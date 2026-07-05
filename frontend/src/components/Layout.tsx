import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LogOut } from "lucide-react";
import { householdService } from "@/services/householdService";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

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

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-clip text-slate-900">
      
      {/* GLOBAL STICKY NAVBAR */}
     <nav className="sticky top-4 z-50 mx-4 sm:mx-8">
  <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white shadow-xl h-20 px-6 flex items-center justify-between">
    <div className="flex items-center gap-8">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
        <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-2xl text-white shadow-lg"><Home size={24} strokeWidth={2.5} /></div>
        <h1 className="text-2xl font-black tracking-tighter hidden sm:block">RoomieOS</h1>
      </div>

      <div className="hidden md:flex items-center gap-6 text-sm font-bold">
        <span onClick={() => navigate("/dashboard")} className={`cursor-pointer transition-colors ${isActive("/dashboard") ? "text-indigo-600 font-extrabold" : "text-slate-500 hover:text-indigo-600"}`}>Dashboard</span>
        <span onClick={() => navigate("/scheduler")} className={`cursor-pointer transition-colors ${isActive("/scheduler") ? "text-indigo-600 font-extrabold" : "text-slate-500 hover:text-indigo-600"}`}>House Scheduler</span>
        <span onClick={() => navigate("/report-card")} className={`cursor-pointer transition-colors ${isActive("/report-card") ? "text-indigo-600 font-extrabold" : "text-slate-500 hover:text-indigo-600"}`}>Monthly Analytics</span>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="hidden sm:flex items-center gap-3">
        
        {/* ✅ FIXED ROW: Guaranteed to show avatars. If members array is empty, it falls back to the current user's profile avatar icon */}
        <div className="flex -space-x-3">
          {members && members.length > 0 ? (
            members.slice(0, 3).map((m: any, i: number) => (
              <img 
                key={m._id || i} 
                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.name || "Roomie"}`} 
                className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 relative z-10 shadow-sm" 
                alt="avatar" 
              />
            ))
          ) : (
            /* Fallback avatar if members array hasn't populated yet */
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
          <div className="bg-slate-100 px-4 py-2 rounded-full flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-bold text-slate-700">{user.name}</span>
            </div>
          </div>
        )}
      </div>
      
      <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 px-5 py-2.5 rounded-full transition-all"><LogOut size={16} /> Logout</button>
    </div>
  </motion.div>
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
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate("/dashboard")}>
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