import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// Added Eye and EyeOff to the lucide-react imports
import { Home, Mail, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";

// --- CONTINUOUS AMBIENT ANIMATIONS ---
const BackgroundAnimation = () => (
  <div className="fixed inset-0 z-[-1] bg-[#f8fafc] overflow-hidden pointer-events-none">
    <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-300/20 blur-[100px]" />
    <motion.div animate={{ x: [0, 50, 0], y: [0, -50, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-300/20 blur-[120px]" />
    {[...Array(15)].map((_, i) => (
      <motion.div key={i} animate={{ y: ["100vh", "-10vh"], opacity: [0, 0.8, 0], x: Math.cos(i) * 50 }} transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }} className="absolute w-1.5 h-1.5 bg-violet-500/40 rounded-full blur-[1px]" style={{ left: `${Math.random() * 100}%` }} />
    ))}
  </div>
);

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // <-- NEW: Visibility tracker
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (password.length < 8 || !hasLetter || !hasNumber) {
      setError("Password must be at least 8 characters and include letters & numbers.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (response.ok) navigate("/login");
      else setError((await response.json()).message);
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
            <div className="w-16 h-16 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-violet-500/30 mb-6">
              <Sparkles size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">Get Started.</h1>
            <p className="text-slate-500 font-bold">Create your RoomieOS account.</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div animate={{ x: [0, -12, 12, -12, 12, 0] }} transition={{ duration: 0.5 }} className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold text-sm border border-rose-100/80 shadow-sm flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="text" placeholder="Your Name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-14 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-violet-500 outline-none transition-all font-bold pl-14 pr-5 text-slate-900 placeholder:text-slate-400" />
            </div>

            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-violet-500 outline-none transition-all font-bold pl-14 pr-5 text-slate-900 placeholder:text-slate-400" />
            </div>
            
            {/* UPGRADED PASSWORD BOX WITH RIGHT EYE TOGGLE */}
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Create Password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full h-14 rounded-2xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-violet-500 outline-none transition-all font-bold pl-14 pr-14 text-slate-900 placeholder:text-slate-400" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-colors flex items-center justify-center mt-2 shadow-lg shadow-slate-900/20">
              Create Account
            </motion.button>
          </form>

          <p className="mt-8 text-center text-slate-500 font-bold">
            Already have an account? <Link to="/login" className="text-violet-600 hover:text-violet-700 transition-colors">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}