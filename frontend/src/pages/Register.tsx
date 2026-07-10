import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion"; // Type-only import for verbatimModuleSyntax compatibility
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, Eye, EyeOff, Home } from "lucide-react";
import { authService } from "@/services/authService";

// =========================================================================
// ✅ LOCKED OUTSIDE THE COMPONENT: These will never rebuild during typing!
// =========================================================================

const AuthBackground = () => (
  <div className="fixed inset-0 z-[-1] bg-[#f8fafc] overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ rotate: [0, -360], scale: [1, 1.15, 1] }} 
      transition={{ duration: 35, repeat: Infinity, ease: "linear" }} 
      className="absolute top-[-15%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-violet-400/20 to-pink-400/10 blur-[120px]" 
    />
    <motion.div 
      animate={{ rotate: [0, 360], x: [0, -30, 0], y: [0, 30, 0] }} 
      transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }} 
      className="absolute bottom-[-8%] right-[-5%] w-[48vw] h-[48vw] rounded-full bg-gradient-to-tr from-indigo-400/20 to-violet-400/15 blur-[110px]" 
    />
  </div>
);

// Bind motion attributes directly to the UI Button component safely
const MotionButton = motion.create(Button); 

// Animation configurations with explicit type structures
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
};

// =========================================================================


export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

 const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const data = await authService.register({ name, email, password });
      
      const token = data.token;
      const userObj = data.user || data; // Prevents flat vs nested JSON redirect loops

      if (!token) {
        setError("Registration succeeded, but no access token was issued.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userObj));
      navigate("/dashboard");
    } catch (err: any) {
      // =========================================================================
      // 🛡️ FRONTEND ERROR CAPTURE FIX: Read structural JSON message strings from the API
      // =========================================================================
      const backendMessage = err.response?.data?.message;
      
      setError(backendMessage || err.message || "Registration failed. Please try again.");
      // =========================================================================
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans text-slate-900 relative">
      <AuthBackground />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(139,92,246,0.08)] max-w-md w-full border border-white/60 relative overflow-hidden"
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500" />

        {/* Brand Header Logo Block */}
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-6">
          <div className="bg-gradient-to-tr from-violet-600 to-pink-500 p-2 rounded-xl text-white shadow-md shadow-violet-500/20">
            <Home size={18} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-black tracking-widest text-violet-600 uppercase">RoomieOS </span>
        </motion.div>

        <motion.h2 variants={itemVariants} className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-slate-900 via-slate-800 to-violet-950 bg-clip-text text-transparent">
          Get Started
        </motion.h2>
        
        <motion.p variants={itemVariants} className="text-slate-400 font-bold text-sm mb-8 leading-relaxed">
          Join or create a modern shared apartment group profile in seconds.
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

        <form onSubmit={handleRegister} className="space-y-4">
          <motion.div variants={itemVariants} className="relative flex items-center group">
            <User className="absolute left-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
            <Input 
              type="text" 
              placeholder="Your Full Name" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="h-14 pl-12 rounded-2xl bg-slate-50/50 border-slate-200/60 group-hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-violet-500 font-bold transition-all" 
            />
          </motion.div>

          <motion.div variants={itemVariants} className="relative flex items-center group">
            <Mail className="absolute left-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
            <Input 
              type="email" 
              placeholder="email@domain.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="h-14 pl-12 rounded-2xl bg-slate-50/50 border-slate-200/60 group-hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-violet-500 font-bold transition-all" 
            />
          </motion.div>

          <motion.div variants={itemVariants} className="relative flex items-center group">
            <Lock className="absolute left-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
            <Input 
              type={showPassword ? "text" : "password"} 
              placeholder="Create Password (min 8 chars)" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="h-14 pl-12 pr-12 rounded-2xl bg-slate-50/50 border-slate-200/60 group-hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-violet-500 font-bold transition-all" 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 text-slate-400 hover:text-violet-600 transition-colors"
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
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-indigo-600 text-white font-bold 
              text-lg shadow-lg shadow-violet-600/20 hover:shadow-xl hover:shadow-violet-600/30 transition-all duration-150 cursor-pointer"
            >
              Create Account
            </MotionButton>
          </div>
        </form>

        <motion.p variants={itemVariants} className="mt-8 text-center text-sm font-bold text-slate-400">
          Already have an account? <Link to="/login" className="text-violet-600 font-black hover:text-indigo-600 transition-colors underline decoration-2 underline-offset-4">Log in</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}