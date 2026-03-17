import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const UpgradePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // stores the planId being processed
  const [error, setError] = useState(null);

  const handleCheckout = async (planId) => {
    setLoading(planId);
    setError(null);
    try {
      const data = await requestStripeCheckout(planId);
      if (data && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      if (!error) {
        // We only set it to false if it failed; if success, we are redirecting away
        setLoading(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] relative overflow-hidden py-12 px-4 selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-30" />

      {/* Header */}
      <div className="relative z-10 max-w-2xl mx-auto text-center mb-16">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute -top-12 left-0 text-slate-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-semibold group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Dashboard
        </button>

        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-6 tracking-tight">
          Upgrade your Superpowers
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Never run out of AI Credits. Fuel your coding sessions with intelligent reviews, explanations, and refactoring assistance.
        </p>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm leading-relaxed flex items-center justify-center gap-3 w-max mx-auto px-8 shadow-xl shadow-red-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full px-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col p-8 rounded-3xl backdrop-blur-xl border transition-all duration-300 ${
              plan.popular
                ? "bg-purple-900/10 border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.15)] md:-translate-y-4"
                : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 text-white">
                <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                <span className="text-slate-400 font-medium">/ one-time</span>
              </div>
            </div>

            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-8 bg-gradient-to-r ${plan.color} bg-opacity-10 backdrop-blur-sm border border-white/10 shadow-inner`}>
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-white mb-0.5">{plan.credits}</p>
                <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">AI Credits</p>
              </div>
            </div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300 text-sm font-medium">
                  <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout(plan.id)}
              disabled={loading !== null}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide transition-all ${plan.buttonColor} shadow-lg ${
                loading === plan.id ? "opacity-70 cursor-wait" : ""
              } ${loading !== null && loading !== plan.id ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading === plan.id ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
  );
};

export default UpgradePage;
