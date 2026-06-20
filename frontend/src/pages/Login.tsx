import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/authService";

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
    
    // ✅ FIXES THE LOOP: Captures token and handles both flat & nested payloads safely
    const token = data.token;
    const userObj = data.user || data; 

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] p-10 shadow-xl max-w-md w-full border border-slate-100">
        <h2 className="text-4xl font-black tracking-tighter mb-2">Welcome Back</h2>
        <p className="text-slate-400 font-bold text-sm mb-8">Log in to manage your apartment shared metrics cleanly.</p>

        {error && <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative flex items-center">
            <Mail className="absolute left-4 text-slate-400" size={20} />
            <Input type="email" placeholder="email@domain.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 pl-12 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500 font-bold" />
          </div>

          <div className="relative flex items-center">
            <Lock className="absolute left-4 text-slate-400" size={20} />
            <Input type={showPassword ? "text" : "password"} placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 pl-12 pr-12 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500 font-bold" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button type="submit" className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-lg">Sign In</Button>
        </form>

        <p className="mt-8 text-center text-sm font-bold text-slate-400">
          New to RoomieOS? <Link to="/register" className="text-indigo-600 font-black hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}