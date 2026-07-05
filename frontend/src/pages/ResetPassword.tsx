import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Key, CheckCircle2, Loader2, Lock } from "lucide-react";
import { authService } from "@/services/authService";
import type  { Variants } from "framer-motion";

const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 120 } }
};

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Front-End Verification Rules (Mirroring your backend rules!)
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError("Password must contain both letters and numbers.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token || "", password);
      setIsSuccess(true);
      
      // Auto-route back to login after 3.5 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Token is invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  const glassCardClass = "bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white max-w-md w-full relative z-10";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-clip text-slate-900 font-sans">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div key="reset-form" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95 }} variants={slideUp} className={glassCardClass}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mb-6 flex items-center justify-center shadow-sm">
              <Key size={26} />
            </div>

            <h2 className="text-3xl font-black tracking-tight mb-2">Create New Password</h2>
            <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed">
              Your recovery token is active. Define a strong, secure password for your workspace below.
            </p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold text-xs border border-rose-100">
                ⚠️ {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative flex items-center">
                <Lock className="absolute left-5 text-slate-400 pointer-events-none" size={20} />
                <Input
                  type="password"
                  placeholder="New password (8+ chars)"
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-transparent font-bold pl-14 pr-5 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all w-full shadow-inner"
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-5 text-slate-400 pointer-events-none" size={20} />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-transparent font-bold pl-14 pr-5 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all w-full shadow-inner"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg shadow-xl shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-2 select-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Updating Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </motion.div>
        ) : (
          /* SUCCESS DISPLAY OVERLAY */
          <motion.div key="reset-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} variants={slideUp} className={glassCardClass + " text-center"}>
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            
            <h2 className="text-3xl font-black tracking-tight mb-3 text-slate-900">Credential Updated</h2>
            <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed px-2">
              Your password has been securely written. You are being securely routed to the login console...
            </p>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: "0%" }} 
                animate={{ width: "100%" }} 
                transition={{ duration: 3.2, ease: "easeInOut" }} 
                className="h-full bg-indigo-600 rounded-full" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}