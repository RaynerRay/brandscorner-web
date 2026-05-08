"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { countries } from "apps/user-ui/src/utils/countries";
import { deliveryFees } from "apps/user-ui/src/utils/deliveryFees";
import {
  CheckCircle,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  ShoppingBag,
  Store,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// ── WhatsApp Business number (country code + number, no +) ──────────────────
const WHATSAPP_BUSINESS_NUMBER = "263717116953";

// ── Collection points ────────────────────────────────────────────────────────
const COLLECTION_POINTS = [
  {
    id: "skyline",
    name: "Skyline Mall",
    address: "Shop 9, Corner Robert Mugabe & Inez Terrace",
    city: "Harare CBD",
    mapsUrl: "https://maps.google.com/?q=Skyline+Mall+Harare",
  },
  {
    id: "chinhoyi",
    name: "Chinhoyi Mall",
    address: "Shop B15, Corner Chinhoyi Street & Albion Street",
    city: "Harare CBD",
    mapsUrl: "https://maps.google.com/?q=Chinhoyi+Mall+Harare",
  },
];

// ── Hex → readable colour name ───────────────────────────────────────────────
const NAMED_COLORS: [string, number, number, number][] = [
  ["White", 255, 255, 255],
  ["Black", 0, 0, 0],
  ["Red", 255, 0, 0],
  ["Green", 0, 128, 0],
  ["Blue", 0, 0, 255],
  ["Yellow", 255, 255, 0],
  ["Orange", 255, 165, 0],
  ["Pink", 255, 192, 203],
  ["Hot Pink", 255, 105, 180],
  ["Purple", 128, 0, 128],
  ["Violet", 238, 130, 238],
  ["Lavender", 230, 230, 250],
  ["Brown", 165, 42, 42],
  ["Beige", 245, 245, 220],
  ["Cream", 255, 253, 208],
  ["Ivory", 255, 255, 240],
  ["Grey", 128, 128, 128],
  ["Light Grey", 211, 211, 211],
  ["Dark Grey", 64, 64, 64],
  ["Silver", 192, 192, 192],
  ["Gold", 255, 215, 0],
  ["Navy", 0, 0, 128],
  ["Sky Blue", 135, 206, 235],
  ["Teal", 0, 128, 128],
  ["Turquoise", 64, 224, 208],
  ["Mint", 152, 255, 152],
  ["Lime", 0, 255, 0],
  ["Olive", 128, 128, 0],
  ["Maroon", 128, 0, 0],
  ["Coral", 255, 127, 80],
  ["Salmon", 250, 128, 114],
  ["Peach", 255, 218, 185],
  ["Magenta", 255, 0, 255],
  ["Cyan", 0, 255, 255],
  ["Indigo", 75, 0, 130],
  ["Charcoal", 54, 69, 79],
];

function hexToColorName(hex: string): string {
  if (!hex || !hex.startsWith("#")) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const d = (r - c[1]) ** 2 + (g - c[2]) ** 2 + (b - c[3]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best[0];
}

// ── Delivery fee helpers ─────────────────────────────────────────────────────
function getDeliveryFeeLabel(city: string): {
  label: string;
  price: number | null;
  isHarare: boolean;
} {
  if (!city) return { label: "", price: null, isHarare: false };
  const normalized = city.trim().toLowerCase();
  if (normalized === "harare")
    return { label: "Calculated by distance", price: null, isHarare: true };
  const match = deliveryFees.cities.find(
    (c: any) => c.name.toLowerCase() === normalized,
  );
  if (match)
    return {
      label: `$${match.price.toFixed(2)}`,
      price: match.price,
      isHarare: false,
    };
  const special = deliveryFees.specialCities?.find(
    (c: any) => c.name.toLowerCase() === normalized,
  );
  if (special)
    return {
      label: `$${special.price.toFixed(2)}`,
      price: special.price,
      isHarare: false,
    };
  return { label: "Contact us for a quote", price: null, isHarare: false };
}

function getHarareEstimate(rangeIndex: number): number {
  const ranges = deliveryFees.harare.ranges;
  if (rangeIndex < 0 || rangeIndex >= ranges.length)
    return ranges[ranges.length - 1].price;
  return ranges[rangeIndex].price;
}

// ─── WhatsApp Checkout Modal ─────────────────────────────────────────────────

type FulfillmentType = "delivery" | "collection";
type PaymentMethod = "cash_on_delivery" | "echocash";

type ModalProps = {
  cart: any[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountedProductId: string;
  storedCouponCode: string;
  selectedAddress: any;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
};

const WhatsAppCheckoutModal = ({
  cart,
  subtotal,
  discountAmount,
  discountPercent,
  discountedProductId,
  storedCouponCode,
  selectedAddress,
  onClose,
  onOrderPlaced,
}: ModalProps) => {
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("delivery");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash_on_delivery");
  const [echocashPhone, setEchocashPhone] = useState("");
  const [selectedPoint, setSelectedPoint] = useState(COLLECTION_POINTS[0].id);
  const [harareRangeIndex, setHarareRangeIndex] = useState(0);
  const [sent, setSent] = useState(false);

  const total = subtotal - discountAmount;

  // Delivery fee calculation
  const deliveryCity = selectedAddress?.city || "";
  const {
    label: feeLabel,
    price: feePrice,
    isHarare,
  } = getDeliveryFeeLabel(deliveryCity);
  const estimatedDeliveryFee = isHarare
    ? getHarareEstimate(harareRangeIndex)
    : (feePrice ?? 0);
  const orderTotal =
    fulfillment === "delivery" ? total + estimatedDeliveryFee : total;

  const buildMessage = () => {
    const lines: string[] = [];
    lines.push("🛍️ *New Order Request*");
    lines.push("━━━━━━━━━━━━━━━━━━━━━");

    cart.forEach((item, i) => {
      const isDiscounted = item.id === discountedProductId;
      const unitPrice = isDiscounted
        ? (item.sale_price * (100 - discountPercent)) / 100
        : item.sale_price;
      lines.push(`${i + 1}. *${item.title}*`);
      if (item.selectedOptions?.color)
        lines.push(
          `   🎨 Color: ${hexToColorName(item.selectedOptions.color)}`,
        );
      if (item.selectedOptions?.size)
        lines.push(`   📐 Size: ${item.selectedOptions.size}`);
      lines.push(
        `   Qty: ${item.quantity} × $${unitPrice.toFixed(2)} = *$${(unitPrice * item.quantity).toFixed(2)}*` +
          (isDiscounted ? ` _(${discountPercent}% off)_` : ""),
      );
    });

    lines.push("━━━━━━━━━━━━━━━━━━━━━");
    if (discountAmount > 0)
      lines.push(
        `🏷️ Coupon *${storedCouponCode}*: -$${discountAmount.toFixed(2)}`,
      );
    lines.push(`🛒 Items Total: $${total.toFixed(2)}`);

    if (fulfillment === "delivery") {
      lines.push("━━━━━━━━━━━━━━━━━━━━━");
      lines.push("🚚 *Delivery*");
      if (selectedAddress) {
        lines.push(`📦 *Deliver to:* ${selectedAddress.name}`);
        lines.push(
          `   ${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.zip}`,
        );
        lines.push(`   ${selectedAddress.country}`);
      }
      if (isHarare) {
        const range = deliveryFees.harare.ranges[harareRangeIndex];
        lines.push(
          `📍 Estimated distance: ${range.min}–${range.max} km from CBD`,
        );
        lines.push(
          `🚗 Estimated delivery fee: ~$${estimatedDeliveryFee.toFixed(2)}`,
        );
        lines.push(
          `_I will share my exact location so you can confirm the final delivery fee._`,
        );
      } else if (feePrice) {
        lines.push(`🚗 Delivery fee: $${feePrice.toFixed(2)}`);
      }
      lines.push(
        `💰 *Order Total (incl. delivery): ~$${orderTotal.toFixed(2)}*`,
      );
    } else {
      const point = COLLECTION_POINTS.find((p) => p.id === selectedPoint)!;
      lines.push("━━━━━━━━━━━━━━━━━━━━━");
      lines.push("🏪 *Collection*");
      lines.push(`   ${point.name}`);
      lines.push(`   ${point.address}, ${point.city}`);
      lines.push(`💰 *Order Total: $${total.toFixed(2)}*`);
    }

    lines.push("━━━━━━━━━━━━━━━━━━━━━");
    if (paymentMethod === "echocash") {
      lines.push(`💳 *Payment:* EchoCash 📱`);
      lines.push(`   EchoCash number: *${echocashPhone}*`);
    } else {
      lines.push(`💳 *Payment:* Cash on Delivery 💵`);
    }
    lines.push("━━━━━━━━━━━━━━━━━━━━━");
    lines.push("Please confirm my order. Thank you! 🙏");
    return lines.join("\n");
  };

  const handleSendOrder = async () => {
    if (fulfillment === "delivery" && !selectedAddress) {
      toast.error("Please select a delivery address first.");
      return;
    }
    if (paymentMethod === "echocash" && !echocashPhone.trim()) {
      toast.error("Please enter your EchoCash account phone number.");
      return;
    }

    // 1. Persist the order as "pending" before opening WhatsApp
    try {
      const collectionPoint =
        fulfillment === "collection"
          ? COLLECTION_POINTS.find((p) => p.id === selectedPoint)
          : null;

      const res = await axiosInstance.post("/order/api/create-order", {
        cart,
        status: "pending",
        paymentMethod,
        ...(paymentMethod === "echocash" && { echocashPhone: echocashPhone.trim() }),
        fulfillmentType: fulfillment,
        ...(fulfillment === "delivery" && {
          shippingAddressId: selectedAddress?.id,
          estimatedDeliveryFee: isHarare
            ? estimatedDeliveryFee
            : (feePrice ?? 0),
          isHarareDelivery: isHarare,
        }),
        ...(fulfillment === "collection" && {
          collectionPoint: collectionPoint
            ? {
                id: collectionPoint.id,
                name: collectionPoint.name,
                address: collectionPoint.address,
              }
            : null,
        }),
        coupon: {
          code: storedCouponCode,
          discountAmount,
          discountPercent,
          discountedProductId,
        },
        total: orderTotal,
      });

      const orderId: string = res.data?.order?.id;
      if (orderId) onOrderPlaced(orderId);
    } catch (err) {
      toast.error("Could not save your order. Please try again.");
      return;
    }

    // 2. Open WhatsApp with the pre-filled summary
    const msg = encodeURIComponent(buildMessage());
    window.open(
      `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${msg}`,
      "_blank",
    );
    setSent(true);
  };

  const point = COLLECTION_POINTS.find((p) => p.id === selectedPoint)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <style>{`
        @keyframes sheetUp {
          from { transform: translateY(80px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          70%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .sheet-anim { animation: sheetUp 0.32s cubic-bezier(0.34,1.46,0.64,1) both; }
        .check-anim { animation: checkPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .seg-btn { transition: background 0.18s, color 0.18s, box-shadow 0.18s; }
        .seg-btn.active { background: #010f1c; color: #fff; box-shadow: 0 2px 8px rgba(1,15,28,0.18); }
        .opt-card { transition: border-color 0.18s, background 0.18s, box-shadow 0.18s; cursor: pointer; }
        .opt-card.active { border-color: #25D366; background: #f0fdf4; box-shadow: 0 0 0 3px rgba(37,211,102,0.12); }
        .pay-card { transition: border-color 0.18s, background 0.18s, box-shadow 0.18s; cursor: pointer; }
        .pay-card.active { border-color: #0989FF; background: #eff6ff; box-shadow: 0 0 0 3px rgba(9,137,255,0.12); }
        .point-card { transition: border-color 0.18s, background 0.18s; cursor: pointer; }
        .point-card.active { border-color: #010f1c; background: #f8f9fa; }
      `}</style>

      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!sent ? onClose : undefined}
      />

      <div className="sheet-anim relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              Review & Place Order
            </h2>
          </div>
          {!sent && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {/* Items */}
          <div className="px-6 py-4 space-y-3 border-b border-gray-100">
            {cart.map((item) => {
              const isDiscounted = item.id === discountedProductId;
              const unitPrice = isDiscounted
                ? (item.sale_price * (100 - discountPercent)) / 100
                : item.sale_price;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <Image
                    src={item.images[0]?.url}
                    alt={item.title}
                    width={48}
                    height={48}
                    className="rounded-xl object-cover border border-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      Qty {item.quantity}
                      {item.selectedOptions?.size
                        ? ` · ${item.selectedOptions.size}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isDiscounted && (
                      <p className="text-xs text-gray-400 line-through leading-none">
                        ${(item.sale_price * item.quantity).toFixed(2)}
                      </p>
                    )}
                    <p
                      className={`text-sm font-semibold ${isDiscounted ? "text-green-600" : "text-gray-800"}`}
                    >
                      ${(unitPrice * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {!sent && (
            <div className="px-6 py-4 space-y-5">
              {/* Fulfillment segmented control */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  How would you like to receive your order?
                </p>
                <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                  <button
                    className={`seg-btn flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${fulfillment === "delivery" ? "active" : "text-gray-600"}`}
                    onClick={() => setFulfillment("delivery")}
                  >
                    <Truck className="w-4 h-4" /> Delivery
                  </button>
                  <button
                    className={`seg-btn flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium ${fulfillment === "collection" ? "active" : "text-gray-600"}`}
                    onClick={() => setFulfillment("collection")}
                  >
                    <Store className="w-4 h-4" /> Collect
                  </button>
                </div>
              </div>

              {/* DELIVERY options */}
              {fulfillment === "delivery" && (
                <div className="space-y-3">
                  {selectedAddress ? (
                    <div className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{selectedAddress.name}</p>
                        <p className="text-gray-500 text-xs">
                          {selectedAddress.street}, {selectedAddress.city},{" "}
                          {selectedAddress.country}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                      ⚠️ No delivery address selected. Go back and add one.
                    </p>
                  )}

                  {/* Delivery fee info */}
                  {selectedAddress && (
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Truck className="w-4 h-4" />
                          <span>
                            Delivery to <strong>{selectedAddress.city}</strong>
                          </span>
                        </div>
                        <span
                          className={`text-sm font-semibold ${isHarare ? "text-blue-600" : "text-green-700"}`}
                        >
                          {isHarare
                            ? `~$${estimatedDeliveryFee.toFixed(2)}`
                            : feeLabel}
                        </span>
                      </div>

                      {isHarare && (
                        <div className="px-3 py-3 space-y-2 bg-blue-50/50 border-t border-blue-100">
                          <p className="text-xs text-blue-700 font-medium">
                            📍 Harare delivery is distance-based. Select your
                            approximate distance from CBD:
                          </p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {deliveryFees.harare.ranges.map(
                              (range: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => setHarareRangeIndex(idx)}
                                  className={`text-xs rounded-lg py-1.5 px-1 border font-medium transition-all ${
                                    harareRangeIndex === idx
                                      ? "border-blue-500 bg-blue-500 text-white"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
                                  }`}
                                >
                                  {range.min}–{range.max}km
                                  <br />
                                  <span className="font-bold">
                                    ${range.price}
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            💬 You'll share your exact location on WhatsApp so
                            we can confirm the final fee.
                          </p>
                        </div>
                      )}

                      {!isHarare && !feePrice && selectedAddress.city && (
                        <div className="px-3 py-2 border-t border-gray-100 text-xs text-gray-500">
                          We'll confirm the delivery fee for your area on
                          WhatsApp.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* COLLECTION options */}
              {fulfillment === "collection" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-1">
                    Choose your nearest collection point —{" "}
                    <span className="font-medium text-green-600">FREE</span>
                  </p>
                  {COLLECTION_POINTS.map((pt) => (
                    <div
                      key={pt.id}
                      className={`point-card border-2 rounded-xl p-3 ${selectedPoint === pt.id ? "active border-[#010f1c]" : "border-gray-200"}`}
                      onClick={() => setSelectedPoint(pt.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPoint === pt.id ? "border-[#010f1c] bg-[#010f1c]" : "border-gray-300"}`}
                        >
                          {selectedPoint === pt.id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {pt.name}
                          </p>
                          <p className="text-xs text-gray-500">{pt.address}</p>
                          <p className="text-xs text-gray-400">{pt.city}</p>
                          <a
                            href={pt.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-500 hover:underline inline-flex items-center gap-0.5 mt-1"
                          >
                            <MapPin className="w-3 h-3" /> View on Maps
                          </a>
                        </div>
                        <Package
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedPoint === pt.id ? "text-[#010f1c]" : "text-gray-300"}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment method */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  How will you pay?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: "cash_on_delivery",
                      emoji: "💵",
                      label: "Cash on Delivery",
                    },
                    {
                      value: "echocash",
                      emoji: "📱",
                      label: "EchoCash",
                    },
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className={`pay-card border-2 rounded-xl p-3 flex flex-col items-center gap-1 ${paymentMethod === opt.value ? "active" : "border-gray-200"}`}
                      onClick={() =>
                        setPaymentMethod(opt.value as PaymentMethod)
                      }
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                        {opt.label}
                      </span>
                    </div>
                  ))}
                </div>
                {paymentMethod === "echocash" && (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      EchoCash account phone number
                    </label>
                    <input
                      type="tel"
                      value={echocashPhone}
                      onChange={(e) => setEchocashPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="w-full text-sm p-2.5 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 bg-blue-50"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer — totals + CTA */}
        <div className="flex-shrink-0 border-t border-gray-100">
          {/* Totals */}
          <div className="px-6 py-3 bg-gray-50 space-y-1">
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Coupon{" "}
                  <span className="font-medium text-gray-700">
                    {storedCouponCode}
                  </span>
                </span>
                <span className="text-green-600 font-medium">
                  −${discountAmount.toFixed(2)}
                </span>
              </div>
            )}
            {fulfillment === "delivery" && selectedAddress && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Delivery fee {isHarare ? "(estimate)" : ""}
                </span>
                <span className="text-gray-700 font-medium">
                  {isHarare
                    ? `~$${estimatedDeliveryFee.toFixed(2)}`
                    : feePrice
                      ? `$${feePrice.toFixed(2)}`
                      : "TBC"}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1">
              <span>
                Total{" "}
                {isHarare && fulfillment === "delivery" ? "(approx.)" : ""}
              </span>
              <span>
                {fulfillment === "collection" || !selectedAddress
                  ? `$${total.toFixed(2)}`
                  : feePrice != null || isHarare
                    ? `$${orderTotal.toFixed(2)}`
                    : `$${total.toFixed(2)} + delivery`}
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="px-6 pb-7 pt-4">
            {!sent ? (
              <>
                <button
                  onClick={handleSendOrder}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all active:scale-[0.98]"
                  style={{ backgroundColor: "#25D366" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "#1db954")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "#25D366")
                  }
                >
                  <MessageCircle className="w-5 h-5" />
                  Place Order via WhatsApp
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 transition mt-3 py-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <CheckCircle className="check-anim w-12 h-12 text-green-500" />
                <p className="text-base font-semibold text-gray-900">
                  Order sent to WhatsApp!
                </p>
                <p className="text-sm text-gray-500">
                  {fulfillment === "delivery" && isHarare
                    ? "Please share your exact location on WhatsApp so we can confirm your delivery fee."
                    : fulfillment === "collection"
                      ? `We'll have your order ready at ${point.name}. Check WhatsApp for collection details.`
                      : "We'll confirm your order shortly. Check WhatsApp for updates."}
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-sm font-medium text-gray-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Cart Page ────────────────────────────────────────────────────────────────

const CartPage = () => {
  const router = useRouter();
  const { user } = useUser();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const cart = useStore((state: any) => state.cart);
  const clearCart = useStore((state: any) => state.clearCart);
  const queryClient = useQueryClient();

  const [discountedProductId, setDiscountedProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [couponError, setCouponError] = useState("");
  const [storedCouponCode, setStoredCouponCode] = useState("");
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [inlineAddress, setInlineAddress] = useState({
    label: "Home" as "Home" | "Work" | "Other",
    name: "",
    street: "",
    city: "",
    zip: "",
    country: "Zimbabwe",
    isDefault: true,
  });
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [savedInlineAddress, setSavedInlineAddress] = useState<any>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const couponCodeApplyHandler = async () => {
    setCouponError("");
    if (!couponCode.trim()) {
      setCouponError("Coupon code is required!");
      return;
    }
    try {
      const res = await axiosInstance.put("/order/api/verify-coupon", {
        couponCode: couponCode.trim(),
        cart,
      });
      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode("");
        toast.success("Coupon applied!");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId("");
        setCouponError(
          res.data.message || "Coupon not valid for any items in cart.",
        );
      }
    } catch (err: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
      setCouponError(err?.response?.data?.message || "Failed to apply coupon.");
    }
  };

  const removeFromCart = useStore((state: any) => state.removeFromCart);
  const increaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id ? { ...item, quantity: (item.quantity ?? 1) + 1 } : item,
      ),
    }));
  };
  const decreaseQuantity = (id: string) => {
    useStore.setState((state: any) => ({
      cart: state.cart.map((item: any) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item,
      ),
    }));
  };
  const removeItem = (id: string) =>
    removeFromCart(id, user, location, deviceInfo);

  const subtotal = cart.reduce(
    (total: number, item: any) => total + item.quantity * item.sale_price,
    0,
  );

  const { data: addresses = [], isFetched: addressesFetched } = useQuery<
    any[],
    Error
  >({
    queryKey: ["shipping-addresses"],
    queryFn: async () => {
      const res = await axiosInstance.get("/auth/api/shipping-addresses");
      return res.data.addresses;
    },
  });

  useEffect(() => {
    if (!addressesFetched) return;
    if (addresses.length === 0) {
      setShowAddressForm(true);
    } else if (!selectedAddressId) {
      const defaultAddr = addresses.find((addr: any) => addr.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    }
  }, [addresses, selectedAddressId, addressesFetched]);

  const selectedAddress =
    addresses.find((a: any) => a.id === selectedAddressId) ??
    savedInlineAddress ??
    null;

  const handlePlaceOrder = async () => {
    if (showAddressForm) {
      const { name, street, city, zip, country } = inlineAddress;
      const isFormComplete = !!(
        name.trim() &&
        street.trim() &&
        city.trim() &&
        zip.trim() &&
        country.trim()
      );

      if (isFormComplete) {
        // Form is filled — save address first then open checkout
        setIsSubmittingAddress(true);
        try {
          const res = await axiosInstance.post("/auth/api/add-address", {
            ...inlineAddress,
          });
          const saved = res.data.address;
          queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
          setSelectedAddressId(saved.id);
          setSavedInlineAddress(saved);
          setShowAddressForm(false);
          setInlineAddress({
            label: "Home",
            name: "",
            street: "",
            city: "",
            zip: "",
            country: "Zimbabwe",
            isDefault: true,
          });
        } catch {
          toast.error("Failed to save address. Please try again.");
          setIsSubmittingAddress(false);
          return;
        }
        setIsSubmittingAddress(false);
      }
      // If form is incomplete but user already has a selected address → fall through
      // If form is incomplete and no address at all → modal will show the "no address" warning
      // (user can switch to Collection which needs no address)
    }
    setShowCheckoutModal(true);
  };

  const handleOrderPlaced = (orderId: string) => {
    clearCart(user, location, deviceInfo);
    toast.success("Order placed! Redirecting to your order…");
    router.push(`/order/${orderId}`);
  };

  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-jost">
            Shopping Cart
          </h1>
          <Link href={"/"} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Cart</span>
        </div>

        {cart.length === 0 ? (
          <div className="text-center text-gray-600 text-lg py-20">
            Your cart is empty! Start adding products.
          </div>
        ) : (
          <div className="lg:flex items-start gap-10">
            {/* Cart Table */}
            <table className="w-full lg:w-[70%] border-collapse">
              <thead className="bg-[#f1f3f4]">
                <tr>
                  <th className="py-3 text-left pl-6 align-middle">Product</th>
                  <th className="py-3 text-center align-middle">Price</th>
                  <th className="py-3 text-center align-middle">Quantity</th>
                  <th className="py-3 text-center align-middle"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item: any) => (
                  <tr key={item.id} className="border-b border-b-[#0000000e]">
                    <td className="flex items-center gap-4 p-4">
                      <Image
                        src={item?.images[0]?.url}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="rounded"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        {item?.selectedOptions && (
                          <div className="text-sm text-gray-500">
                            {item.selectedOptions?.color && (
                              <span>
                                Color:{" "}
                                <span
                                  style={{
                                    backgroundColor: item.selectedOptions.color,
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "100%",
                                    display: "inline-block",
                                  }}
                                />
                              </span>
                            )}
                            {item.selectedOptions?.size && (
                              <span className="ml-2">
                                Size: {item.selectedOptions.size}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 text-lg text-center">
                      {item.id === discountedProductId ? (
                        <div className="flex flex-col items-center">
                          <span className="line-through text-gray-500 text-sm">
                            ${item.sale_price.toFixed(2)}
                          </span>
                          <span className="text-green-600 font-semibold">
                            $
                            {(
                              (item.sale_price * (100 - discountPercent)) /
                              100
                            ).toFixed(2)}
                          </span>
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-[2px] rounded-full mt-1">
                            Discount Applied
                          </span>
                        </div>
                      ) : (
                        <span>${item.sale_price.toFixed(2)}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-center items-center border border-gray-200 rounded-[20px] w-[100px] mx-auto p-[6px]">
                        <button
                          className="text-[#000] cursor-pointer text-xl"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          -
                        </button>
                        <span className="px-4">{item.quantity}</span>
                        <button
                          className="text-[#000] cursor-pointer text-xl"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        className="text-[#818487] cursor-pointer hover:text-[#ff1826] transition duration-200"
                        onClick={() => removeItem(item.id)}
                      >
                        ✕ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sidebar */}
            <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[#010f1c] text-base font-medium pb-1">
                  <span className="font-jost">
                    Discount ({discountPercent}%)
                  </span>
                  <span className="text-green-600">
                    − ${discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-jost">Subtotal</span>
                <span>${(subtotal - discountAmount).toFixed(2)}</span>
              </div>
              <hr className="my-4 border-slate-200" />

              {/* Coupon */}
              <div className="mb-4">
                <h4 className="mb-[7px] font-[500] text-[15px]">
                  Have a Coupon?
                </h4>
                <div className="flex">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:border-blue-500"
                  />
                  <button
                    className="bg-blue-500 cursor-pointer text-white px-4 rounded-r-md hover:bg-blue-600 transition-all"
                    onClick={couponCodeApplyHandler}
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-sm pt-2 text-red-500">{couponError}</p>
                )}
              </div>
              <hr className="my-4 border-slate-200" />

              {/* Delivery address */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-[15px]">Delivery Address</h4>
                  {!showAddressForm && selectedAddress && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Add new
                    </button>
                  )}
                </div>

                {/* Selected address card */}
                {!showAddressForm && selectedAddress && (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              selectedAddress.label === "Home"
                                ? "bg-blue-100 text-blue-700"
                                : selectedAddress.label === "Work"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {selectedAddress.label}
                          </span>
                          {selectedAddress.isDefault && (
                            <span className="text-[10px] text-gray-400">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedAddress.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {selectedAddress.street}, {selectedAddress.city}
                        </p>
                      </div>
                      {addresses.length > 1 && (
                        <button
                          onClick={() => setShowSelectModal(true)}
                          className="text-xs text-blue-600 font-medium hover:underline flex-shrink-0"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Has saved addresses but none selected — show select + add buttons */}
                {!showAddressForm &&
                  !selectedAddress &&
                  addresses.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowSelectModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2.5 px-3 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
                      >
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> Select
                        saved address
                      </button>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="flex items-center gap-1 px-3 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> New
                      </button>
                    </div>
                  )}

                {/* No saved addresses — form auto-opens via useEffect */}
                {!showAddressForm &&
                  !selectedAddress &&
                  addresses.length === 0 &&
                  addressesFetched && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="w-full flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-3 text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Add delivery address
                    </button>
                  )}

                {/* Inline address form — auto-saves when order is placed */}
                {showAddressForm && (
                  <div className="space-y-2 border border-blue-100 rounded-xl p-3 bg-blue-50/20">
                    <p className="text-[11px] text-gray-400 mb-1">
                      Saved automatically when you place your order
                    </p>
                    <div className="flex gap-1">
                      {(["Home", "Work", "Other"] as const).map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() =>
                            setInlineAddress((prev) => ({
                              ...prev,
                              label: lbl,
                            }))
                          }
                          className={`flex-1 text-xs py-1.5 rounded-lg font-medium border transition-all ${
                            inlineAddress.label === lbl
                              ? "bg-[#010f1c] text-white border-[#010f1c]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    <input
                      placeholder="Full name *"
                      value={inlineAddress.name}
                      onChange={(e) =>
                        setInlineAddress((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                    />
                    <input
                      placeholder="Street address *"
                      value={inlineAddress.street}
                      onChange={(e) =>
                        setInlineAddress((prev) => ({
                          ...prev,
                          street: e.target.value,
                        }))
                      }
                      className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="City *"
                        value={inlineAddress.city}
                        onChange={(e) =>
                          setInlineAddress((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                      />
                      <input
                        placeholder="ZIP *"
                        value={inlineAddress.zip}
                        onChange={(e) =>
                          setInlineAddress((prev) => ({
                            ...prev,
                            zip: e.target.value,
                          }))
                        }
                        className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                      />
                    </div>
                    <select
                      value={inlineAddress.country}
                      onChange={(e) =>
                        setInlineAddress((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      className="w-full text-sm p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white"
                    >
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={inlineAddress.isDefault}
                        onChange={(e) =>
                          setInlineAddress((prev) => ({
                            ...prev,
                            isDefault: e.target.checked,
                          }))
                        }
                        className="w-3.5 h-3.5 rounded border-gray-300 accent-blue-600"
                      />
                      <span className="text-xs text-gray-500">
                        Set as default address
                      </span>
                    </label>
                    {(addresses.length > 0 || savedInlineAddress) && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="w-full text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                      >
                        Cancel — use saved address
                      </button>
                    )}
                  </div>
                )}
              </div>
              <hr className="my-4 border-slate-200" />

              {/* Collection point teaser */}
              <div className="mb-4 flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <Store className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Prefer to collect? We have{" "}
                  <span className="font-semibold text-gray-800">
                    2 shops in Harare CBD
                  </span>
                  . Choose collection at checkout.
                </p>
              </div>

              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-jost">Total</span>
                <span>${(subtotal - discountAmount).toFixed(2)}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmittingAddress}
                className="w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 rounded-lg font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-70"
                style={{ backgroundColor: "#25D366" }}
                onMouseEnter={(e) => {
                  if (!isSubmittingAddress)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#1db954";
                }}
                onMouseLeave={(e) => {
                  if (!isSubmittingAddress)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#25D366";
                }}
              >
                {isSubmittingAddress ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                {isSubmittingAddress
                  ? "Saving address…"
                  : "Place Order via WhatsApp"}
              </button>
              <p className="text-xs text-center text-gray-400 mt-2">
                We'll confirm your order on WhatsApp
              </p>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp Checkout Modal */}
      {showCheckoutModal && (
        <WhatsAppCheckoutModal
          cart={cart}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountPercent={discountPercent}
          discountedProductId={discountedProductId}
          storedCouponCode={storedCouponCode}
          selectedAddress={selectedAddress}
          onClose={() => setShowCheckoutModal(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      )}

      {/* Address Selection Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSelectModal(false)}
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Address
              </h3>
              <button
                onClick={() => setShowSelectModal(false)}
                className="text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
              {addresses.map((address: any) => (
                <div
                  key={address.id}
                  onClick={() => {
                    setSelectedAddressId(address.id);
                    setShowSelectModal(false);
                  }}
                  className={`border-2 rounded-xl p-3.5 cursor-pointer transition-all ${
                    selectedAddressId === address.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            address.label === "Home"
                              ? "bg-blue-100 text-blue-700"
                              : address.label === "Work"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <span className="text-[10px] text-gray-400">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {address.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {address.street}, {address.city}, {address.country}
                      </p>
                    </div>
                    {selectedAddressId === address.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setShowSelectModal(false);
                  setShowAddressForm(true);
                }}
                className="w-full flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
              >
                <div className="w-9 h-9 bg-blue-50 group-hover:bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 transition">
                  <Plus className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">
                    Add New Address
                  </p>
                  <p className="text-xs text-gray-500">
                    Saved automatically when you place your order
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
