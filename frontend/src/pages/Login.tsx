import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Mail, Lock, ArrowRight } from "lucide-react";

// --- CONTINUOUS AMBIENT ANIMATIONS ---
const BackgroundAnimation = () => (
  <div className="fixed inset-0 z-[-1] bg-[#f8fafc] overflow-hidden pointer-events-none">
    <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-300/20 blur-[100px]" />
    <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-300/20 blur-[120px]" />
    {[...Array(15)].map((_, i) => (
      <motion.div key={i} animate={{ y: ["100vh", "-10vh"], opacity: [0, 0.8, 0], x: Math.sin(i) * 50 }} transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }} className="absolute w-1.5 h-1.5 bg-indigo-500/40 rounded-full blur-[1px]" style={{ left: `${Math.random() * 100}%` }} />
    ))}
  </div>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/dashboard");
      } else setError(data.message);
    } catch (err) { setError("Server error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-clip">
      <BackgroundAnimation />

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white">
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 mb-6">
              <Home size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Welcome back.</h1>
            <p className="text-slate-500 font-bold">Log in to manage your apartment.</p>
          </div>

          {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-rose-100 text-rose-600 rounded-2xl text-center font-bold text-sm border border-rose-200">{error}</motion.div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold pl-14 pr-5 text-slate-900 placeholder:text-slate-400" />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-14 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold pl-14 pr-5 text-slate-900 placeholder:text-slate-400" />
            </div>

            <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-slate-900/20">
              Enter RoomieOS <ArrowRight size={20} />
            </motion.button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-bold">
            New to the apartment? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 transition-colors">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}