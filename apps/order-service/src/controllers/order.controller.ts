import { NotFoundError, ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { sendEmail } from "../utils/send-email";

// ─── Create Order ─────────────────────────────────────────────────────────────
export const createOrder = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      cart,
      status,
      paymentMethod,
      echocashPhone,
      fulfillmentType,
      shippingAddressId,
      isHarareDelivery,
      collectionPoint,
      coupon,
      total,
    } = req.body;

    const userId: string = req.user?.id;

    console.log("[createOrder] userId:", userId);
    console.log("[createOrder] body keys:", Object.keys(req.body));
    console.log("[createOrder] cart sample:", JSON.stringify(cart?.[0])?.slice(0, 200));
    console.log("[createOrder] fulfillmentType:", fulfillmentType, "| paymentMethod:", paymentMethod);

    // ── Validation ───────────────────────────────────────────────────────────
    if (!userId) {
      return next(new ValidationError("User not authenticated."));
    }
    if (!cart) {
      return next(new ValidationError("Cart is missing from request body."));
    }
    if (!Array.isArray(cart)) {
      return next(new ValidationError(`Cart must be an array, received: ${typeof cart}`));
    }
    if (cart.length === 0) {
      return next(new ValidationError("Cart is empty."));
    }
    if (!fulfillmentType || !["delivery", "collection"].includes(fulfillmentType)) {
      return next(new ValidationError("fulfillmentType must be 'delivery' or 'collection'."));
    }
    if (!paymentMethod || !["cash_on_delivery", "echocash"].includes(paymentMethod)) {
      return next(new ValidationError("paymentMethod must be 'cash_on_delivery' or 'echocash'."));
    }
    if (paymentMethod === "echocash" && !echocashPhone) {
      return next(new ValidationError("echocashPhone is required for EchoCash payments."));
    }
    if (fulfillmentType === "delivery" && !shippingAddressId) {
      return next(new ValidationError("shippingAddressId is required for delivery orders."));
    }

    // ── Group items by shopId ────────────────────────────────────────────────
    // Cart items must have: { id, title, sale_price, quantity, shopId, selectedOptions? }
    const shopGrouped = cart.reduce((acc: Record<string, any[]>, item: any) => {
      const sid = item.shopId;
      if (!sid) {
        console.warn("[createOrder] cart item missing shopId:", item.id);
        return acc;
      }
      if (!acc[sid]) acc[sid] = [];
      acc[sid].push(item);
      return acc;
    }, {});

    if (Object.keys(shopGrouped).length === 0) {
      return next(new ValidationError("No cart items have a valid shopId."));
    }

    const createdOrders: any[] = [];

    for (const shopId of Object.keys(shopGrouped)) {
      const orderItems: any[] = shopGrouped[shopId];

      // Subtotal for this shop
      let orderTotal = orderItems.reduce(
        (sum: number, item: any) => sum + item.quantity * item.sale_price,
        0
      );

      // Apply coupon if the discounted product is in this shop's items
      if (
        coupon?.discountedProductId &&
        orderItems.some((item: any) => item.id === coupon.discountedProductId)
      ) {
        const discountedItem = orderItems.find(
          (item: any) => item.id === coupon.discountedProductId
        );
        if (discountedItem) {
          const discount =
            coupon.discountPercent > 0
              ? (discountedItem.sale_price * discountedItem.quantity * coupon.discountPercent) / 100
              : coupon.discountAmount || 0;
          orderTotal = Math.max(0, orderTotal - discount);
        }
      }

      const order = await prisma.orders.create({
        data: {
          userId,
          shopId,
          total: orderTotal,
          status: status || "pending",
          paymentMethod,
          echocashPhone: paymentMethod === "echocash" ? echocashPhone : null,
          fulfillmentType,
          // Delivery fields
          shippingAddressId: fulfillmentType === "delivery" ? shippingAddressId : null,
          estimatedDeliveryFee: 0,
          isHarareDelivery: isHarareDelivery ?? false,
          // Collection field — undefined omits the field (Json? accepts null but not JsonNull type)
          collectionPoint:
            fulfillmentType === "collection" && collectionPoint
              ? (collectionPoint as Prisma.InputJsonValue)
              : undefined,
          // Coupon
          couponCode: coupon?.code || null,
          discountAmount: coupon?.discountAmount || 0,
          // Order items
          items: {
            create: orderItems.map((item: any) => ({
              productId: item.id,   // String — no @db.ObjectId on orderItems.productId
              quantity: item.quantity,
              price: item.sale_price,
              selectedOptions: (item.selectedOptions ?? {}) as Prisma.InputJsonValue,
            })),
          },
        },
        include: { items: true },
      });

      createdOrders.push(order);

      // ── Stock & analytics ──────────────────────────────────────────────────
      for (const item of orderItems) {
        await prisma.products.update({
          where: { id: item.id },
          data: {
            stock: { decrement: item.quantity },
            totalSales: { increment: item.quantity },
          },
        });

        await prisma.productAnalytics.upsert({
          where: { productId: item.id },
          create: {
            productId: item.id,
            shopId,
            purchases: item.quantity,
            lastViewedAt: new Date(),
          },
          update: { purchases: { increment: item.quantity } },
        });

        const existingAnalytics = await prisma.userAnalytics.findUnique({
          where: { userId },
        });
        const newAction = {
          productId: item.id,
          shopId,
          action: "purchase",
          timestamp: Date.now(),
        };
        const currentActions = Array.isArray(existingAnalytics?.actions)
          ? (existingAnalytics.actions as Prisma.JsonArray)
          : [];

        if (existingAnalytics) {
          await prisma.userAnalytics.update({
            where: { userId },
            data: {
              lastVisited: new Date(),
              actions: [...currentActions, newAction],
            },
          });
        } else {
          await prisma.userAnalytics.create({
            data: { userId, lastVisited: new Date(), actions: [newAction] },
          });
        }
      }

      // ── Notify seller ──────────────────────────────────────────────────────
      const shop = await prisma.shops.findUnique({
        where: { id: shopId },
        select: { sellerId: true },
      });
      if (shop) {
        await prisma.notifications.create({
          data: {
            title: "🛒 New Order Received",
            message: `A customer just placed a new order. Awaiting confirmation.`,
            creatorId: userId,
            receiverId: shop.sellerId,
            redirect_link: `/orders/${order.id}`,
          },
        });
      }
    }

    // ── Notify admin & send email ──────────────────────────────────────────
    const user = await prisma.users.findUnique({ where: { id: userId } });

    await prisma.notifications.create({
      data: {
        title: "📦 New Pending Order",
        message: `A new WhatsApp order was placed by ${user?.name || "a customer"}.`,
        creatorId: userId,
        receiverId: "admin",
        redirect_link: `/orders/${createdOrders[0]?.id}`,
      },
    });

    if (user?.email) {
      await sendEmail(
        user.email,
        "🛍️ Your Order Has Been Received",
        "order-confirmation",
        {
          name: user.name,
          cart,
          totalAmount: total,
          fulfillmentType,
          collectionPoint: fulfillmentType === "collection" ? collectionPoint : null,
          paymentMethod,
          trackingUrl: `/orders/${createdOrders[0]?.id}`,
        }
      );
    }

    return res.status(201).json({
      success: true,
      order: createdOrders[0],
      orders: createdOrders,
    });
  } catch (error) {
    console.error("[createOrder] error:", error);
    return next(error);
  }
};

// ─── Confirm Order (seller or admin flips pending → confirmed) ────────────────
export const confirmOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { finalDeliveryFee } = req.body;

    const existing = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!existing) return next(new NotFoundError("Order not found."));
    if (existing.status === "confirmed") {
      return res.status(200).json({ success: true, message: "Order already confirmed.", order: existing });
    }

    const updateData: Prisma.ordersUpdateInput = {
      status: "confirmed",
      updatedAt: new Date(),
    };

    // Adjust fee if admin confirmed the real Harare delivery distance
    if (finalDeliveryFee != null && existing.isHarareDelivery) {
      const feeDiff = finalDeliveryFee - (existing.estimatedDeliveryFee ?? 0);
      updateData.estimatedDeliveryFee = finalDeliveryFee;
      updateData.total = Number(existing.total) + feeDiff;
    }

    const order = await prisma.orders.update({
      where: { id: orderId },
      data: updateData,
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return next(error);
  }
};

// ─── Update Delivery Status ───────────────────────────────────────────────────
export const updateDeliveryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;

    const allowed = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];

    if (!orderId || !deliveryStatus) {
      return res.status(400).json({ error: "Missing orderId or deliveryStatus." });
    }
    if (!allowed.includes(deliveryStatus)) {
      return next(new ValidationError(`Invalid delivery status. Must be one of: ${allowed.join(", ")}`));
    }

    const existing = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!existing) return next(new NotFoundError("Order not found."));

    const updateData: Prisma.ordersUpdateInput = { deliveryStatus, updatedAt: new Date() };
    if (deliveryStatus === "Delivered") {
      updateData.paymentStatus = "success";
    }

    const order = await prisma.orders.update({
      where: { id: orderId },
      data: updateData,
    });

    return res.status(200).json({ success: true, message: "Delivery status updated.", order });
  } catch (error) {
    return next(error);
  }
};

// ─── Update Payment Status (echocash only, manual) ───────────────────────────
export const updatePaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const allowed = ["pending", "success", "failed"];
    if (!paymentStatus || !allowed.includes(paymentStatus)) {
      return next(new ValidationError(`paymentStatus must be one of: ${allowed.join(", ")}`));
    }

    const existing = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!existing) return next(new NotFoundError("Order not found."));
    if (existing.paymentMethod !== "echocash") {
      return next(new ValidationError("Manual payment status update is only allowed for EchoCash orders."));
    }

    const order = await prisma.orders.update({
      where: { id: orderId },
      data: { paymentStatus, updatedAt: new Date() },
    });

    return res.status(200).json({ success: true, message: "Payment status updated.", order });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Order Details ────────────────────────────────────────────────────────
export const getOrderDetails = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return next(new NotFoundError("Order not found."));

    // address model: { id, userId, label (enum), name, street, city, zip, country, isDefault }
    const shippingAddress = order.shippingAddressId
      ? await prisma.address.findUnique({ where: { id: order.shippingAddressId } })
      : null;

    // discount_codes model: { id, public_name, discountType, discountValue, discountCode, sellerId }
    const coupon = order.couponCode
      ? await prisma.discount_codes.findUnique({ where: { discountCode: order.couponCode } })
      : null;

    // Fetch product details — productId is plain String (no ObjectId)
    const productIds = order.items.map((item) => item.productId);
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, images: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const items = order.items.map((item) => ({
      ...item,
      product: productMap.get(item.productId) ?? null,
    }));

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items,
        shippingAddress,
        couponCode: coupon,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ─── Get User Orders ──────────────────────────────────────────────────────────
export const getUserOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { userId: req.user?.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Seller Orders ────────────────────────────────────────────────────────
export const getSellerOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // sellers.id matches req.id (set by isAuthenticated for seller role)
    const shop = await prisma.shops.findUnique({ where: { sellerId: req.seller?.id } });
    if (!shop) return next(new NotFoundError("Shop not found for this seller."));

    const orders = await prisma.orders.findMany({
      where: { shopId: shop.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
};

// ─── Get Admin Orders ─────────────────────────────────────────────────────────
export const getAdminOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        shop: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
};

// ─── Verify Coupon Code ───────────────────────────────────────────────────────
export const verifyCouponCode = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponCode, cart } = req.body;

    if (!couponCode || !cart || cart.length === 0) {
      return next(new ValidationError("Coupon code and cart are required."));
    }

    // discount_codes model uses discountCode as unique identifier
    const discount = await prisma.discount_codes.findUnique({
      where: { discountCode: couponCode },
    });

    if (!discount) {
      return next(new ValidationError("Coupon code isn't valid."));
    }

    // products.discount_codes is String[] @db.ObjectId — match by discount id
    const matchingProduct = cart.find((item: any) =>
      Array.isArray(item.discount_codes) &&
      item.discount_codes.some((d: any) => d === discount.id)
    );

    if (!matchingProduct) {
      return res.status(200).json({
        valid: false,
        discount: 0,
        discountAmount: 0,
        message: "This coupon is not valid for any item in your cart.",
      });
    }

    const price = matchingProduct.sale_price * matchingProduct.quantity;
    let discountAmount =
      discount.discountType === "percentage"
        ? (price * discount.discountValue) / 100
        : discount.discountValue;

    discountAmount = Math.min(discountAmount, price);

    return res.status(200).json({
      valid: true,
      discount: discount.discountValue,
      discountAmount: discountAmount.toFixed(2),
      discountedProductId: matchingProduct.id,
      discountType: discount.discountType,
      message: "Discount applied to 1 eligible product.",
    });
  } catch (error) {
    return next(error);
  }
};