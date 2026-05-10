"use client";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { colorValueForSwatch } from "apps/user-ui/src/utils/colorDisplayName";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

// ── Status helpers ────────────────────────────────────────────────────────────
const DELIVERY_STEPS = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  processing: "bg-purple-100 text-purple-700 border-purple-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const Page = () => {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(
          `/order/api/get-order-details/${orderId}`,
        );
        setOrder(res.data.order);
      } catch (err) {
        console.error("Failed to fetch order details", err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[40vh]">
        <Loader2 className="animate-spin w-6 h-6 text-gray-600" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-sm text-red-500">Order not found.</p>;
  }

  const currentStepIdx = DELIVERY_STEPS.findIndex(
    (s) =>
      s.toLowerCase() === (order.deliveryStatus || "ordered").toLowerCase(),
  );

  const paymentStatusKey = (order.status || "pending").toLowerCase();
  const badgeClass =
    STATUS_BADGE[paymentStatusKey] ||
    "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">
          Order #{order.id.slice(-6).toUpperCase()}
        </h1>
        <span
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${badgeClass}`}
        >
          {order.status}
        </span>
      </div>

      {/* Delivery Progress */}
      <div className="mb-8 bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Delivery Status
        </p>
        <div className="flex items-center">
          {DELIVERY_STEPS.map((step, idx) => {
            const reached = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className="flex flex-col items-center gap-1.5 relative">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCurrent
                        ? "border-blue-500 bg-blue-500 shadow-md shadow-blue-200"
                        : reached
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300 bg-white"
                    }`}
                  >
                    {reached && !isCurrent && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap absolute top-7 ${
                      isCurrent
                        ? "text-blue-600"
                        : reached
                          ? "text-green-600"
                          : "text-gray-400"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {idx !== DELIVERY_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${reached ? "bg-green-400" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Order info */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2 text-sm text-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Order Info
          </p>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment</span>
            <span
              className={`font-semibold capitalize px-2 py-0.5 rounded-full text-xs border ${badgeClass}`}
            >
              {order.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment method</span>
            <span className="font-medium capitalize">
              {(order.paymentMethod || "").replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fulfillment</span>
            <span className="font-medium capitalize">
              {(order.fulfillmentType || "delivery").replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Discount</span>
              <span className="text-green-600 font-medium">
                −${order.discountAmount.toFixed(2)}
                {order.couponCode && ` (${order.couponCode.public_name})`}
              </span>
            </div>
          )}
          {order.estimatedDeliveryFee > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery fee</span>
              <span className="font-medium">
                {order.isHarareDelivery ? "~" : ""}$
                {order.estimatedDeliveryFee.toFixed(2)}
                {order.isHarareDelivery && (
                  <span className="text-xs text-gray-400 ml-1">(estimate)</span>
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between items-start pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-800 pt-0.5">Total</span>
            <span className="text-right">
              <span className="font-bold text-gray-900 block">
                ${order.total.toFixed(2)}
              </span>
              {order.fulfillmentType === "delivery" && (
                <span className="block text-xs font-medium text-gray-600 mt-0.5">
                  + delivery fee
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Shipping / Collection */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-sm text-gray-700">
          {order.fulfillmentType === "collection" && order.collectionPoint ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Collection Point
              </p>
              <p className="font-semibold text-gray-800">
                {order.collectionPoint.name}
              </p>
              <p className="text-gray-500 mt-1">
                {order.collectionPoint.address}
              </p>
              <p className="text-xs text-green-600 font-medium mt-2">
                ✓ Free collection
              </p>
            </>
          ) : order.shippingAddress ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Shipping Address
              </p>
              <p className="font-semibold text-gray-800">
                {order.shippingAddress.name}
              </p>
              <p className="text-gray-500 mt-1">
                {order.shippingAddress.street}
              </p>
              <p className="text-gray-500">
                {order.shippingAddress.city}, {order.shippingAddress.zip}
              </p>
              <p className="text-gray-500">{order.shippingAddress.country}</p>

              <p className="text-xs text-blue-500 mt-2">
                📍 Exact delivery fee confirmed via WhatsApp
              </p>
            </>
          ) : null}
        </div>
      </div>

      {/* Pending notice */}
      {order.status === "pending" && (
        <div className="mb-6 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          <span className="text-lg">⏳</span>
          <span>
            Your order has been received and is awaiting confirmation. We'll
            reach out on WhatsApp shortly.
          </span>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Order Items
        </h2>
        <div className="space-y-3">
          {order.items.map((item: any) => (
            <div
              key={item.productId}
              className="border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm bg-white"
            >
              <img
                src={item.product?.images[0]?.url || "/placeholder.png"}
                alt={item.product?.title || "Product"}
                className="w-16 h-16 object-cover rounded-xl border border-gray-100 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">
                  {item.product?.title || "Unnamed Product"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Qty: {item.quantity}
                </p>
                {item.selectedOptions &&
                  Object.keys(item.selectedOptions).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {Object.entries(item.selectedOptions).map(
                        ([key, value]: [string, any]) =>
                          value ? (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-gray-600"
                            >
                              <span className="font-medium capitalize">
                                {key}:
                              </span>
                              {key === "color" ? (
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                  style={{
                                    backgroundColor: colorValueForSwatch(
                                      String(value),
                                    ),
                                  }}
                                  title={String(value)}
                                />
                              ) : (
                                <span>{value}</span>
                              )}
                            </span>
                          ) : null,
                      )}
                    </div>
                  )}
              </div>
              <p className="text-sm font-bold text-gray-800 flex-shrink-0">
                ${item.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
