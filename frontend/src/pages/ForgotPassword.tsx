import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { authService } from "@/services/authService"; // Adheres to your service wrapper naming
import type  { Variants } from "framer-motion";

const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 120 } }
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to transmit recovery link.");
    } finally {
      setIsLoading(false);
    }
  };

  const glassCardClass = "bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white max-w-md w-full relative z-10";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-clip text-slate-900 font-sans">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div key="forgot-form" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95 }} variants={slideUp} className={glassCardClass}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
              <Sparkles size={28} />
            </div>
            
            <h2 className="text-3xl font-black tracking-tight mb-2 text-slate-900">Recover Password</h2>
            <p className="text-slate-500 font-bold text-sm mb-6 leading-relaxed">
              Enter your email address and we'll transmit a secure cryptographic reset link to your inbox.
            </p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold text-xs border border-rose-100">
                ⚠️ {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative flex items-center">
                <Mail className="absolute left-5 text-slate-400 pointer-events-none" size={20} />
                <Input
                  type="email"
                  placeholder="name@domain.com"
                  required
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-transparent font-bold pl-14 pr-5 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all w-full shadow-inner"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-lg shadow-xl shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2 select-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Sending Link...
                  </>
                ) : (
                  "Send Recovery Link"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center">
              <Link to="/login" className="flex items-center gap-2 text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Sign In
              </Link>
            </div>
          </motion.div>
        ) : (
          /* CONFIRMATION STATE CARD */
          <motion.div key="forgot-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} variants={slideUp} className={glassCardClass + " text-center"}>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            
            <h2 className="text-3xl font-black tracking-tight mb-3 text-slate-900">Transmission Complete</h2>
            <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed px-2">
              If that email is registered in our infrastructure, a recovery link has been dispatched. Please inspect your inbox and spam filters.
            </p>

            <Link to="/login" className="block w-full">
              <Button className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-lg shadow-xl cursor-pointer">
                Return to Login
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}