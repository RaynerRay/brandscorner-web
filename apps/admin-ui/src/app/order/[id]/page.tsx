"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import axiosInstance from "apps/admin-ui/src/utils/axiosInstance";
import { colorValueForSwatch } from "packages/utils/color-display-name";

const DELIVERY_STATUSES = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const Page = () => {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axiosInstance.get(`/order/api/get-order-details/${orderId}`);
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
        <Loader2 className="animate-spin w-6 h-6 text-gray-200" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-center text-sm text-red-500">Order not found.</p>;
  }

  const currentIdx = DELIVERY_STATUSES.findIndex(
    (s) => s.toLowerCase() === (order.deliveryStatus || "ordered").toLowerCase()
  );

  const paymentStatusColor =
    order.paymentStatus === "success"
      ? "text-green-400"
      : order.paymentStatus === "failed"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-200 mb-4">
        Order #{order.id.slice(-6)}
      </h1>

      {/* EchoCash info */}
      {order.paymentMethod === "echocash" && (
        <div className="mb-6 flex items-center gap-3 bg-blue-950/40 border border-blue-800 rounded-xl px-4 py-3">
          <span className="text-lg">📱</span>
          <div>
            <p className="text-xs text-blue-300 font-medium mb-0.5">EchoCash Payment</p>
            {order.echocashPhone && (
              <p className="text-sm text-gray-200">
                Account: <span className="font-semibold text-white">{order.echocashPhone}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delivery Progress Bar */}
      <div className="my-4">
        <div className="flex items-center justify-between text-xs font-medium text-gray-200 mb-2">
          {DELIVERY_STATUSES.map((step, idx) => (
            <div
              key={step}
              className={`flex-1 text-left ${
                step.toLowerCase() === (order.deliveryStatus || "ordered").toLowerCase()
                  ? "text-blue-600"
                  : idx <= currentIdx
                  ? "text-green-600"
                  : "text-gray-200"
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="flex items-center">
          {DELIVERY_STATUSES.map((step, idx) => (
            <div key={step} className="flex-1 flex items-center">
              <div className={`w-4 h-4 rounded-full ${idx <= currentIdx ? "bg-blue-600" : "bg-gray-300"}`} />
              {idx !== DELIVERY_STATUSES.length - 1 && (
                <div className={`flex-1 h-1 ${idx < currentIdx ? "bg-blue-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Info */}
      <div className="mb-6 space-y-1 text-sm text-gray-200">
        <p>
          <span className="font-semibold">Payment Method:</span>{" "}
          <span className="capitalize">{order.paymentMethod?.replace(/_/g, " ") ?? "—"}</span>
        </p>
        <p>
          <span className="font-semibold">Payment Status:</span>{" "}
          <span className={`font-medium capitalize ${paymentStatusColor}`}>
            {order.paymentStatus ?? "pending"}
          </span>
        </p>

        <p>
          <span className="font-semibold">Total:</span>{" "}
          <span className="font-medium">${order.total.toFixed(2)}</span>
        </p>

        {order.discountAmount > 0 && (
          <p>
            <span className="font-semibold">Discount Applied:</span>{" "}
            <span className="text-green-700">
              -${order.discountAmount.toFixed(2)} (
              {order.couponCode?.discountType === "percentage"
                ? `${order.couponCode.discountValue}%`
                : `$${order.couponCode.discountValue}`}{" "}
              off)
            </span>
          </p>
        )}

        {order.couponCode && (
          <p>
            <span className="font-semibold">Coupon:</span>{" "}
            <span className="text-blue-700">{order.couponCode.public_name}</span>
          </p>
        )}

        <p>
          <span className="font-semibold">Date:</span>{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Shipping Info */}
      {order.shippingAddress && (
        <div className="mb-6 text-sm text-gray-200">
          <h2 className="text-md font-semibold mb-2">Shipping Address</h2>
          <p>{order.shippingAddress.name}</p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
            {order.shippingAddress.zip}
          </p>
          <p>{order.shippingAddress.country}</p>
        </div>
      )}

      {/* Order Items */}
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.items.map((item: any) => (
            <div
              key={item.productId}
              className="border border-gray-200 rounded-md p-4 flex items-center gap-4"
            >
              <img
                src={item.product?.images[0]?.url || "/placeholder.png"}
                alt={item.product?.title || "Product image"}
                className="w-16 h-16 object-cover rounded-md border border-gray-200"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-200">
                  {item.product?.title || "Unnamed Product"}
                </p>
                <p className="text-sm text-gray-200">Quantity: {item.quantity}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <div className="text-xs text-gray-200 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {Object.entries(item.selectedOptions).map(([key, value]: [string, any]) =>
                      value ? (
                        <span key={key} className="inline-flex gap-2 items-center">
                          <span className="font-medium capitalize">{key}:</span>
                          {key.toLowerCase() === "color" ? (
                            <span
                              className="w-4 h-4 rounded-full border border-gray-400 flex-shrink-0 block"
                              style={{
                                backgroundColor: colorValueForSwatch(String(value)),
                              }}
                            />
                          ) : (
                            <span>{value}</span>
                          )}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-200">${item.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
