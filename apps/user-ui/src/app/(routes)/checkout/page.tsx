"use client";
import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <p className="text-2xl font-semibold text-gray-800 mb-4">Online checkout is unavailable</p>
      <p className="text-gray-500 mb-6">
        We accept Cash on Delivery and EchoCash. Place your order from the cart via WhatsApp.
      </p>
      <Link
        href="/cart"
        className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-700 transition"
      >
        Back to Cart
      </Link>
    </div>
  );
}
