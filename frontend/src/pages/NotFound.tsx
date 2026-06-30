import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Compass, ArrowRight } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Automatically redirect back to dashboard after 10 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-hidden text-slate-900 bg-[#f8fafc] items-center justify-center p-4">
      {/* Soft Background Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-300/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-300/20 blur-[100px] pointer-events-none" />

      {/* 404 Glass Card Layout */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 md:p-16 shadow-2xl border border-white max-w-xl w-full text-center space-y-8 relative z-10"
      >
        <div className="relative">
          {/* Animated Compass Icon */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-600/20 mb-6"
          >
            <Compass size={48} strokeWidth={1.5} />
          </motion.div>
          
          <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black text-slate-900">Lost in Transit?</h2>
          <p className="text-slate-500 font-bold text-sm max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn't exist or has been shifted to another apartment workspace layout.
          </p>
        </div>

        {/* Dynamic Countdown Alert Block */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 max-w-sm mx-auto">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            Returning to Dashboard in <span className="text-indigo-600 font-extrabold font-mono text-sm">{countdown}s</span>
          </p>
        </div>

        {/* Quick Back Home Trigger Action */}
        <button 
          onClick={() => navigate("/dashboard")}
          className="h-14 px-8 bg-slate-900 hover:bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-indigo-600/10 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <Home size={16} /> Take Me Home <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}