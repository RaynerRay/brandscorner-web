"use client";

import React from "react";
import Link from "next/link";
import { Clock, ShieldCheck } from "lucide-react";

const PendingVerification = () => {
  return (
    <div className="w-full py-10 min-h-screen bg-[#f1f1f1] flex flex-col items-center justify-center">
      <div className="md:w-[480px] w-full px-4">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-6 mx-auto">
            <Clock className="w-7 h-7 text-blue-500" />
          </div>

          <h3 className="text-2xl font-semibold text-center text-black mb-2">
            Account pending verification
          </h3>
          <p className="text-center text-gray-500 text-sm leading-relaxed">
            Your seller account has been created successfully. An admin needs to
            review and verify it before you can access the seller dashboard and
            all seller features.
          </p>

          <div className="mt-5 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4">
            <ShieldCheck className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">
              You'll be notified once your account has been verified. This
              usually takes up to 24 hours.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/"
              className="flex-1 text-center bg-black text-white py-2 rounded-lg text-sm font-medium"
            >
              Back to home
            </Link>
            <Link
              href="/login"
              className="flex-1 text-center border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium"
            >
              Login with another account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingVerification;
