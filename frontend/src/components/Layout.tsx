import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { Home, LogOut, Menu, X, Users, Layers, CalendarDays } from "lucide-react";
import { householdService } from "@/services/householdService";

// Strict motion orchestration limits for structural scaling animations
const mobileMenuVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", duration: 0.4, staggerChildren: 0.08, delayChildren: 0.1 } 
  },
  exit: { 
    opacity: 0, 
    y: -15, 
    scale: 0.98,
    transition: { duration: 0.2 } 
  }
};

const mobileItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false); // ✅ NEW: Tracks responsive mobile toggle burger state

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
    
    // Sync roommate list arrays dynamically to draw navbar face bubbles
    householdService.getProfile()
      .then(data => {
        if (data && data.members) setMembers(data.members);
      })
      .catch(err => console.error("Error syncing layout navbar details:", err));
  }, [location.pathname]); // Automatically updates if a roommate logs in/out or shifts pages

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: <Layers size={18} /> },
    { label: "House Scheduler", path: "/scheduler", icon: <CalendarDays size={18} /> },
    { label: "Monthly Analytics", path: "/report-card", icon: <Users size={18} /> },
  ];

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-clip text-slate-900 bg-slate-50">
      
      {/* GLOBAL STICKY NAVBAR */}
      <nav className="sticky top-4 z-50 mx-4 sm:mx-8">
        <motion.div 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] h-20 px-6 flex items-center justify-between transition-all"
        >
          {/* Left Side: Brand Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-600/10 group-hover:scale-105 transition-transform">
                <Home size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
                RoomieOS
              </h1>
            </div>

            {/* Inline Navigation Links (Hidden on Mobile viewports) */}
            <div className="hidden md:flex items-center gap-6 text-sm font-bold">
              {navItems.map((item) => (
                <span
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`cursor-pointer transition-all duration-200 py-1.5 px-3 rounded-xl relative ${
                    isActive(item.path) 
                      ? "text-indigo-600 font-extrabold bg-indigo-50/50" 
                      : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50/60"
                  }`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right Side Actions Container */}
          <div className="flex items-center gap-4">
            {/* Avatar Stack + Identity Badge (Hidden on Mobile) */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex -space-x-3">
                {members && members.length > 0 ? (
                  members.slice(0, 3).map((m: any, i: number) => (
                    <img 
                      key={m._id || i} 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.name || "Roomie"}`} 
                      className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 relative z-10 shadow-sm transition-transform hover:scale-105" 
                      alt="avatar" 
                    />
                  ))
                ) : (
                  user && (
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} 
                      className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 relative z-10 shadow-sm" 
                      alt="user avatar" 
                    />
                  )
                )}
              </div>
              
              {user && (
                <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-full flex flex-col justify-center shadow-inner">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-sm font-black text-slate-700">{user.name}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Desktop Logout Button (Hidden on Mobile) */}
            <button 
              onClick={handleLogout} 
              className="hidden md:flex items-center gap-2 text-sm font-black text-slate-600 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 px-5 py-2.5 rounded-2xl border border-slate-100 hover:border-rose-100 transition-all cursor-pointer"
            >
              <LogOut size={16} /> Logout
            </button>

            {/* Responsive Burger Action Trigger */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden flex items-center justify-center p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all cursor-pointer"
            >
              {isOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
            </button>
          </div>
        </motion.div>

        {/* --- RESPONSIVE MOBILE EXPANSION DRAWER --- */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-24 left-0 right-0 md:hidden bg-white/95 backdrop-blur-2xl rounded-3xl border border-white p-5 shadow-[0_20px_40px_rgba(0,0,0,0.08)] space-y-4"
            >
              {/* Quick Profile Overview (Shows on small phone form-factors) */}
              {user && (
                <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-inner sm:hidden">
                  <img 
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} 
                    className="w-10 h-10 rounded-full border bg-white shadow-sm" 
                    alt="mobile user avatar" 
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Session</span>
                    <span className="text-sm font-black text-slate-800">{user.name}</span>
                  </div>
                </div>
              )}

              {/* Navigation Routes Mapping Stack */}
              <div className="flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <motion.div 
                    variants={mobileItemVariants} 
                    key={item.path}
                    onClick={() => { navigate(item.path); setIsOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-black text-sm cursor-pointer transition-all ${
                      isActive(item.path)
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </motion.div>
                ))}
              </div>

              {/* Mobile Logout Trigger Block */}
              <motion.div variants={mobileItemVariants} className="pt-2 border-t border-slate-100">
                <button 
                  onClick={() => { setIsOpen(false); handleLogout(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-black text-sm bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <LogOut size={18} /> Close Account Session
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* SUB-PAGE MOUNT INTERACTION POINT */}
      <div className="flex-grow z-10">
        <Outlet />
      </div>

      {/* GLOBAL FOOTER */}
      <footer className="w-full bg-[#0f172a] mt-auto relative z-20 overflow-hidden select-none">
        {/* Neon accent top boundary edge line */}
        <div className="w-full h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left Block: Deep Charcoal & Bright Brand Contrast */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => { navigate("/dashboard"); setIsOpen(false); }}>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-950 shadow-lg shadow-black/20">
              <Home size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-black text-2xl text-white tracking-tight block leading-none">
                Roomie<span className="text-indigo-400">OS</span>
              </span>
              <span className="text-xs font-bold text-slate-400 block tracking-tight mt-1.5">
                The architecture for shared living space.
              </span>
            </div>
          </div>

          {/* Right Block: Structured Badging & Copyright Status */}
          <div className="flex flex-col items-center md:items-end gap-2.5">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 px-3 py-1.5 rounded-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest">
                System Active v1.2
              </span>
            </div>
            <span className="text-xs font-bold text-slate-500 tracking-tight">
              © 2026 RoomieOS Systems. All rights reserved.
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}