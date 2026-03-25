import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyStripeSession } from "../services/api";
import { AuthContext } from "../context/AuthContext";

const PaymentSuccess = () => {
  const [status, setStatus] = useState("verifying");
  const [errorMSG, setErrorMSG] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sessionId = searchParams.get("session_id");
    const returnTo = searchParams.get("return_to") || "/dashboard";

    if (!sessionId) {
      setStatus("error");
      setErrorMSG("Invalid session ID");
      setTimeout(() => navigate(returnTo), 3000);
      return;
    }

    const verifyPayment = async () => {
      try {
        const data = await verifyStripeSession(sessionId);
        if (data.success) {
          setStatus("success");
          // Update local user context with new credits
          if (user) {
            const updatedUser = { ...user, credits: data.credits };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } else {
          setStatus("error");
          setErrorMSG(data.message || "Payment verification failed.");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setErrorMSG(error.response?.data?.message || "Something went wrong verifying the payment.");
      } finally {
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate(returnTo);
          }
        }, 2500);
      }
    };

    verifyPayment();
  }, [location, navigate, user, setUser]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#050508] relative overflow-hidden text-slate-200">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none opacity-30" />
      <div className="relative z-10 flex flex-col items-center gap-6 glass p-8 rounded-3xl border border-white/[0.05] max-w-md text-center">
        {status === "verifying" && (
          <>
            <div className="relative w-16 h-16 flex items-center justify-center mb-2">
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
            </div>
            <h2 className="text-2xl font-bold text-white">Verifying Payment</h2>
            <p className="text-slate-400">Please wait while we confirm your transaction and update your credits...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
            <p className="text-emerald-400 font-medium">Your AI credits have been updated.</p>
            <p className="text-slate-500 text-sm mt-2">Redirecting you back...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
            <p className="text-red-400 font-medium">{errorMSG}</p>
            <p className="text-slate-500 text-sm mt-2">Redirecting to previous page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
