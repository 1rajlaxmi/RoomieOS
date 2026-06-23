import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff, Home } from "lucide-react";
import { authService } from "@/services/authService";

// Dynamic atmospheric background elements
const AuthBackground = () => (
  <div className="fixed inset-0 z-[-1] bg-[#f8fafc] overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }} 
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
      className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-indigo-400/20 to-violet-400/20 blur-[120px]" 
    />
    <motion.div 
      animate={{ rotate: [360, 0], x: [0, 40, 0], y: [0, -40, 0] }} 
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} 
      className="absolute bottom-[-5%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-pink-400/10 to-indigo-400/20 blur-[100px]" 
    />
  </div>
);

// Bind motion attributes directly to the UI Button component class safely
const MotionButton = motion(Button);

// Animation configurations with explicit type structures
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
};

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await authService.login({ email, password });
      
      const token = data.token;
      const userObj = data.user || data; // Prevents flat vs nested JSON redirect loops

      if (!token) {
        setError("Authentication succeeded, but no security token was returned.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userObj));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans text-slate-900 relative">
      <AuthBackground />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(99,102,241,0.08)] max-w-md w-full border border-white/60 relative overflow-hidden"
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />

        {/* Brand Header Logo Block */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl text-white shadow-md shadow-indigo-500/20">
            <Home size={18} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-black tracking-widest text-indigo-600 uppercase">RoomieOS </span>
        </motion.div>

        <motion.h2 variants={itemVariants} className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 bg-clip-text text-transparent">
          Welcome Back
        </motion.h2>
        
        <motion.p variants={itemVariants} className="text-slate-400 font-bold text-sm mb-8 leading-relaxed">
          Log in to manage your apartment shared metrics and balances cleanly.
        </motion.p>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1, x: [0, -6, 6, -6, 6, 0] }}
            className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-bold text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <motion.div variants={itemVariants} className="relative flex items-center group">
            <Mail className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <Input 
              type="email" 
              placeholder="email@domain.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="h-14 pl-12 rounded-2xl bg-slate-50/50 border-slate-200/60 group-hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold transition-all" 
            />
          </motion.div>

          <motion.div variants={itemVariants} className="relative flex items-center group">
            <Lock className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="h-14 pl-12 pr-12 rounded-2xl bg-slate-50/50 border-slate-200/60 group-hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold transition-all" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </motion.div>

          <div className="pt-2">
            <MotionButton 
              variants={itemVariants}
              type="submit" 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transition-all duration-150"
            >
              Sign In Securely
            </MotionButton>
          </div>
        </form>

        <motion.p variants={itemVariants} className="mt-8 text-center text-sm font-bold text-slate-400">
          New to RoomieOS? <Link to="/register" className="text-indigo-600 font-black hover:text-violet-600 transition-colors underline decoration-2 underline-offset-4">Create an account</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}