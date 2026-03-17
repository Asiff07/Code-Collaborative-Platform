import React, { useState } from "react";
import { requestStripeCheckout } from "../services/api";

const PLANS = [
  {
    id: "basic",
    name: "Basic Plan",
    price: 10,
    credits: 100,
    features: ["100 AI Code Reviews", "Instant Explanations", "Priority Support"],
    color: "from-blue-500 to-indigo-500",
    buttonColor: "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/30",
  },
  {
    id: "pro",
    name: "Pro Plan",
    price: 25,
    credits: 500,
    features: ["500 AI Code Reviews", "Advanced Refactoring", "24/7 Priority Support", "Early Access Features"],
    color: "from-purple-500 to-pink-500",
    buttonColor: "bg-purple-500 hover:bg-purple-600 shadow-purple-500/30",
    popular: true,
  },
  {
    id: "advanced",
    name: "Advanced Plan",
    price: 35,
    credits: 1000,
    features: ["1000 AI Code Reviews", "Unlimited Team Sharing", "Dedicated Support Manager", "Custom Models"],
    color: "from-emerald-400 to-teal-500",
    buttonColor: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30",
  },
];

const CreditPlansPanel = ({ onClose, currentUserCredits }) => {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckout = async (planId) => {
    setLoading(planId);
    setError(null);
    try {
      const data = await requestStripeCheckout(planId);
      if (data && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      if (!error) setLoading(null);
    }
  };

  return (
    <div className="flex flex-col bg-[#0f0f16] border-l border-white/[0.05] w-[350px] h-full flex-shrink-0 relative overflow-hidden text-slate-200">
      
      {/* Header */}
      <div className="h-14 min-h-[56px] bg-white/[0.02] border-b border-white/[0.05] flex items-center justify-between px-5 backdrop-blur-sm z-10 sticky top-0">
        <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 text-indigo-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Credit Plans
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 flex flex-col gap-6 relative z-10">
        <div className="flex flex-col items-center justify-center p-4 bg-white/[0.03] border border-white/[0.05] rounded-2xl mb-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Your Credits</p>
          <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            {currentUserCredits ?? 0}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs leading-relaxed flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                plan.popular
                  ? "bg-purple-900/20 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                  : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold uppercase tracking-widest py-1 px-3 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 text-white">
                  <span className="text-2xl font-extrabold tracking-tight">${plan.price}</span>
                  <span className="text-slate-400 text-xs font-medium">/ one-time</span>
                </div>
              </div>

              <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl mb-4 bg-gradient-to-r ${plan.color} border border-white/10 shadow-inner`} style={{ opacity: 1, backgroundBlendMode: 'normal' }}>
                <div className="p-1.5 bg-white/20 rounded-md text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                <div>
                  <p className="text-lg font-bold tracking-tight text-white leading-none">{plan.credits}</p>
                  <p className="text-[9px] font-semibold text-white/80 uppercase tracking-wider mt-0.5">AI Credits</p>
                </div>
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`w-full py-2.5 rounded-lg text-white font-bold text-xs tracking-wide transition-all mt-auto ${plan.buttonColor} shadow-lg ${
                  loading === plan.id ? "opacity-70 cursor-wait" : ""
                } ${loading !== null && loading !== plan.id ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading === plan.id ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  "Get Started"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditPlansPanel;
