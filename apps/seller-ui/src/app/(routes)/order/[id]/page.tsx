"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import axiosInstance from "apps/seller-ui/src/utils/axiosInstance";
import { useParams, useRouter } from "next/navigation";

const DELIVERY_STATUSES = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const PAYMENT_STATUSES = ["pending", "success", "failed"];

const Page = () => {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const router = useRouter();

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

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      const res = await axiosInstance.put(`/order/api/update-status/${order.id}`, {
        deliveryStatus: newStatus,
      });
      setOrder((prev: any) => ({
        ...prev,
        deliveryStatus: newStatus,
        // Backend auto-sets paymentStatus to "success" on Delivered
        paymentStatus: res.data.order?.paymentStatus ?? prev.paymentStatus,
      }));
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPaymentStatus = e.target.value;
    setUpdatingPayment(true);
    try {
      const res = await axiosInstance.put(`/order/api/update-payment-status/${order.id}`, {
        paymentStatus: newPaymentStatus,
      });
      setOrder((prev: any) => ({
        ...prev,
        paymentStatus: res.data.order?.paymentStatus ?? newPaymentStatus,
      }));
    } catch (err) {
      console.error("Failed to update payment status", err);
    } finally {
      setUpdatingPayment(false);
    }
  };

  useEffect(() => {
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

  const paymentStatusColor =
    order.paymentStatus === "success"
      ? "text-green-400"
      : order.paymentStatus === "failed"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="my-4">
        <span
          className="text-white flex items-center gap-2 font-semibold cursor-pointer"
          onClick={() => router.push("/dashboard/orders")}
        >
          <ArrowLeft />
          Go Back to Dashboard
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-200 mb-4">
        Order #{order.id.slice(-6)}
      </h1>

      {/* Delivery Status Selector */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-300 mr-3">
          Update Delivery Status:
        </label>
        <select
          value={order.deliveryStatus}
          onChange={handleStatusChange}
          disabled={updating}
          className="border bg-transparent text-gray-200 border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          {DELIVERY_STATUSES.map((status) => {
            const currentIndex = DELIVERY_STATUSES.indexOf(order.deliveryStatus);
            const statusIndex = DELIVERY_STATUSES.indexOf(status);
            return (
              <option key={status} value={status} disabled={statusIndex < currentIndex}>
                {status}
              </option>
            );
          })}
        </select>
      </div>

      {/* EchoCash Payment Status Selector (manual, only for echocash orders) */}
      {order.paymentMethod === "echocash" && (
        <div className="mb-6 flex items-center gap-3 bg-blue-950/40 border border-blue-800 rounded-xl px-4 py-3">
          <span className="text-lg">📱</span>
          <div className="flex-1">
            <p className="text-xs text-blue-300 font-medium mb-0.5">EchoCash Payment</p>
            {order.echocashPhone && (
              <p className="text-sm text-gray-200">
                Account: <span className="font-semibold text-white">{order.echocashPhone}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">Payment Status:</label>
            <select
              value={order.paymentStatus}
              onChange={handlePaymentStatusChange}
              disabled={updatingPayment}
              className="border bg-gray-900 text-gray-200 border-gray-600 rounded-md px-3 py-1 text-sm"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            {updatingPayment && <Loader2 className="animate-spin w-4 h-4 text-gray-400" />}
          </div>
        </div>
      )}

      {/* Delivery Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
          {DELIVERY_STATUSES.map((step, idx) => {
            const current = step === order.deliveryStatus;
            const passed = DELIVERY_STATUSES.indexOf(order.deliveryStatus) >= idx;
            return (
              <div
                key={step}
                className={`flex-1 text-left ${
                  current ? "text-blue-600" : passed ? "text-green-600" : "text-gray-400"
                }`}
              >
                {step}
              </div>
            );
          })}
        </div>
        <div className="flex items-center">
          {DELIVERY_STATUSES.map((step, idx) => {
            const reached = idx <= DELIVERY_STATUSES.indexOf(order.deliveryStatus);
            return (
              <div key={step} className="flex-1 flex items-center">
                <div className={`w-4 h-4 rounded-full ${reached ? "bg-blue-600" : "bg-gray-300"}`} />
                {idx !== DELIVERY_STATUSES.length - 1 && (
                  <div className={`flex-1 h-1 ${reached ? "bg-blue-500" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
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
            <span className="text-green-400">
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
            <span className="font-semibold">Coupon Used:</span>{" "}
            <span className="text-blue-400">{order.couponCode.public_name}</span>
          </p>
        )}

        <p>
          <span className="font-semibold">Date:</span>{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="mb-6 text-sm text-gray-300">
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
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Order Items</h2>
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
                <p className="text-sm text-gray-300">Quantity: {item.quantity}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {Object.entries(item.selectedOptions).map(
                      ([key, value]: [string, any]) =>
                        value && (
                          <span key={key} className="mr-3">
                            <span className="font-medium capitalize">{key}:</span> {value}
                          </span>
                        )
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
