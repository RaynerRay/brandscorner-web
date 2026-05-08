"use client";

import React from "react";
import { Banknote } from "lucide-react";

const WithdrawMethod = () => {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="px-4 rounded-lg">
        <div className="flex items-center gap-3">
          <Banknote size={22} className="text-blue-400" />
          <div>
            <h3 className="text-white font-semibold">Payment Method</h3>
            <p className="text-gray-400 text-sm">
              Orders are paid via Cash on Delivery or EchoCash.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 rounded-lg">
        <div className="p-4 border border-gray-700 rounded-md space-y-2 text-sm text-gray-300">
          <p className="flex items-center gap-2">
            <span className="text-lg">💵</span>
            <span><span className="text-white font-medium">Cash on Delivery</span> — collected at the time of delivery.</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <span><span className="text-white font-medium">EchoCash</span> — customer's EchoCash account phone number is recorded on the order.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default WithdrawMethod;
