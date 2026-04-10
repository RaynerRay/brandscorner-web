"use client";

import React from "react";
import Link from "next/link";

const PendingVerificationPage = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl border border-slate-800 rounded-xl p-6 bg-[#0b0b0b]">
        <h1 className="text-2xl font-semibold">Seller account pending verification</h1>
        <p className="mt-3 text-slate-300 leading-relaxed">
          Your seller account has been created, but an admin still needs to verify it.
          Once verified, you’ll be able to access the seller dashboard and all seller features.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-white text-black px-4 py-2 text-sm font-medium"
          >
            Back to home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-white"
          >
            Login with another account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingVerificationPage;

