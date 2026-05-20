'use client'

import { useState } from "react"
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// This helper function safely loads the Razorpay popup script into your browser
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SubscriptionModel({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {update} = useSession();

  const handleSubscribe = async () => {
    setLoading(true);

    // 1. Load the script first
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      setLoading(false);
      return;
    }

    try {
      // 2. Ask your backend to create the Subscription ID
      const res = await fetch("/api/razorpay/checkout", { method: "POST" });
      const data = await res.json();

      if (!data.subscriptionId) {
        throw new Error("Failed to create subscription on backend");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        subscription_id: data.subscriptionId,
        name: "Deep Dispatch",
        description: "1 Year Pro Access",
        theme: {
          color: "#10B981", 
        },
        handler: async function (response) {
          console.log("Payment successful!", response);
          alert("Payment Successful! Welcome to Pro.");
          await new Promise(resolve=>setTimeout(resolve,1000));
          await update();
          onClose(); 
          window.location.hred ="/optimize"
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Subscription failed", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-black text-white mb-2">Unlock Optimizer</h2>
        <p className="text-gray-400 mb-6">Upgrade to Pro to access 7-day multi-asset AI optimization for your microgrid.</p>
        
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8">
          <ul className="text-emerald-400 space-y-3 font-medium">
            <li>✓ Unlimited AI Optimizations</li>
            <li>✓ 1 Year Full Access</li>
            <li>✓ Multi-site Management</li>
          </ul>
        </div>
        
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? "Loading Secure Checkout..." : "Get Pro - ₹1/Year"}
        </button>
        
        <button onClick={onClose} className="w-full mt-4 text-gray-500 text-sm hover:text-white transition">
          Maybe later
        </button>
      </div>
    </div>
  );
}