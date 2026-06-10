import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell as RechartsCell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Home, LogOut, Wallet, CheckCircle2, Sparkles, Trash2, Activity, Users, Plus, Key, Copy } from "lucide-react";

// --- CONTINUOUS AMBIENT ANIMATIONS ---
// Orbs that spin and pulse, plus glowing particles floating upward
const BackgroundAnimation = () => (
  <div className="fixed inset-0 z-[-1] bg-[#f8fafc] overflow-hidden pointer-events-none">
    {/* Spinning Ambient Orbs */}
    <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-300/20 blur-[100px]" />
    <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-300/20 blur-[120px]" />
    
    {/* Continuous Floating Particles */}
    {[...Array(15)].map((_, i) => (
      <motion.div 
        key={i} 
        animate={{ y: ["100vh", "-10vh"], opacity: [0, 0.8, 0], x: Math.sin(i) * 50 }} 
        transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }} 
        className="absolute w-1.5 h-1.5 bg-indigo-500/40 rounded-full blur-[1px]" 
        style={{ left: `${Math.random() * 100}%` }} 
      />
    ))}
  </div>
);

// --- ANIMATION VARIANTS ---
const staggerContainer : any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };
const slideUp : any = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 100 } } };
const hoverCard : any = { scale: 1.02, y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)", transition: { type: "spring", stiffness: 300 } };

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [user, setUser] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [choreTitle, setChoreTitle] = useState("");
  const [choreAssignee, setChoreAssignee] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) { navigate("/login"); return; }
    setUser(JSON.parse(storedUser));
    fetchHousehold(token);
  }, [navigate]);

  const fetchHousehold = async (token: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/households/my-household", { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setHousehold(data);
        fetchExpenses(token); fetchChores(token);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchExpenses = async (token: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/expenses", { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setExpenses(await response.json());
    } catch (err) { console.error(err); }
  };

  const fetchChores = async (token: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/chores", { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setChores(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/expenses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ description: expenseDesc, amount: Number(expenseAmount) }) });
      if (response.ok) { setExpenseDesc(""); setExpenseAmount(""); fetchExpenses(token!); } 
    } catch (err) { console.error(err); }
  };

  const handleSettle = async (expenseId: string, userId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${expenseId}/settle`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ userId }) });
      if (response.ok) fetchExpenses(token!);
    } catch (err) { console.error(err); }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/chores", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: choreTitle, assignedTo: choreAssignee }) });
      if (response.ok) { setChoreTitle(""); setChoreAssignee(""); fetchChores(token!); }
    } catch (err) { console.error(err); }
  };

  const handleToggleChore = async (choreId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/chores/${choreId}/toggle`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) fetchChores(token!); 
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };

  const expenseChartData = useMemo(() => {
    if (!household || !expenses) return [];
    return household.members.map((member: any) => {
      let actualPaid = 0;
      expenses.forEach((exp: any) => {
        if (exp.paidBy._id === member._id) {
          actualPaid += exp.amount;
          exp.splits.forEach((s: any) => { if (s.user._id !== member._id && s.isPaid) actualPaid -= s.amountOwed; });
        } else {
          exp.splits.forEach((s: any) => { if (s.user._id === member._id && s.isPaid) actualPaid += s.amountOwed; });
        }
      });
      return { name: member.name === user?.name ? "You" : member.name, "Net Paid": Number(actualPaid.toFixed(2)) };
    });
  }, [household, expenses, user]);

  const choreChartData = useMemo(() => {
    const completed = chores.filter(c => c.isCompleted).length;
    const pending = chores.length - completed;
    if (chores.length === 0) return [{ name: "No Chores", value: 1, color: "#e2e8f0" }];
    return [
      { name: "Completed", value: completed, color: "#10b981" },
      { name: "Pending", value: pending, color: "#6366f1" }
    ];
  }, [chores]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-bold text-indigo-500">Loading OS...</div>;

  const glassCardClass = "bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white";

  return (
    // Changed overflow-hidden to overflow-clip so sticky navbar works!
    <div className="min-h-screen font-sans flex flex-col relative overflow-clip text-slate-900">
      <BackgroundAnimation />

      {/* --- STICKY NAVBAR WITH USER NAME --- */}
      <nav className="sticky top-4 z-50 mx-4 sm:mx-8">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white shadow-xl shadow-indigo-900/5 h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-2xl text-white shadow-lg"><Home size={24} strokeWidth={2.5} /></div>
            <h1 className="text-2xl font-black tracking-tighter hidden sm:block">RoomieOS</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3">
               <div className="flex -space-x-3">
                 {household?.members.slice(0, 3).map((m: any, i: number) => (
                   <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 z-10 relative shadow-sm" alt="avatar" />
                 ))}
               </div>
               {/* User Name Added Here */}
               <div className="bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-sm font-bold text-slate-700">{user.name}</span>
               </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 px-5 py-2.5 rounded-full transition-all">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </motion.div>
      </nav>

      {/* MAIN LAYOUT */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-20 w-full z-10">
        {!household ? (
          <div className="text-center py-20"><h2 className="text-3xl font-black">You need to join a household first!</h2></div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            
            {/* 1. HERO IMAGE BANNER & PROMINENT INVITE CODE */}
            <motion.div variants={slideUp} whileHover={hoverCard} className="relative w-full h-72 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
              <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" alt="Home" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>
              
              <div className="absolute inset-0 p-10 flex flex-col justify-end w-full md:w-2/3">
                <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{household.name}</h1>
                <p className="text-indigo-100 font-medium mt-2 text-lg">Welcome home, {user.name}. Here is your daily overview.</p>
              </div>

              {/* Prominent Invite Code Ticket */}
              <div className="absolute top-6 right-6 md:bottom-10 md:top-auto bg-white/20 backdrop-blur-xl border border-white/40 p-4 rounded-2xl shadow-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1 flex items-center gap-1"><Key size={12}/> Invite Code</span>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl">
                  <span className="font-mono font-black text-xl text-indigo-600 tracking-widest">{household.inviteCode}</span>
                </div>
              </div>
            </motion.div>

            {/* 2. DUAL CHARTS ROW */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Chart 1: Finances */}
              <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl"><Wallet size={24} /></div>
                  <h2 className="text-2xl font-black tracking-tight">Financial Balance</h2>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={expenseChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" fontSize={13} tickLine={false} axisLine={false} tick={{fontWeight: 700}} />
                      <YAxis fontSize={13} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} tick={{fontWeight: 700}} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold' }}/>
                      <Area type="monotone" dataKey="Net Paid" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorNet)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Chart 2: Chore Productivity */}
              <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                 <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Sparkles size={24} /></div>
                  <h2 className="text-2xl font-black tracking-tight">Chore Productivity</h2>
                </div>
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={choreChartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {choreChartData.map((entry, index) => (
                          <RechartsCell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text in Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-slate-900">{chores.length}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tasks</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 3. FORMS & FEEDS */}
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Add Tools Column */}
              <div className="lg:col-span-4 space-y-8">
                <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                  <h2 className="text-xl font-black mb-6">Add Expense</h2>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <Input placeholder="Groceries, Rent..." required value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500 font-bold px-5" />
                    <Input type="number" step="0.01" min="0.01" placeholder="$0.00" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500 font-bold px-5" />
                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center shadow-lg"><Plus size={20} className="mr-2"/> Split Bill</motion.button>
                  </form>
                </motion.div>

                <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                  <h2 className="text-xl font-black mb-6">Assign Task</h2>
                  <form onSubmit={handleAddChore} className="space-y-4">
                    <Input placeholder="Vacuum the rug..." required value={choreTitle} onChange={(e) => setChoreTitle(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-emerald-500 font-bold px-5" />
                    <select className="flex h-14 w-full rounded-2xl bg-slate-50 border-transparent px-5 font-bold focus:ring-2 focus:ring-emerald-500" value={choreAssignee} onChange={(e) => setChoreAssignee(e.target.value)} required>
                      <option value="" disabled>Select roommate</option>
                      {household.members.map((m: any) => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center shadow-lg"><CheckCircle2 size={20} className="mr-2"/> Delegate</motion.button>
                  </form>
                </motion.div>
              </div>

              {/* Feed Column */}
              <div className="lg:col-span-8 space-y-8">
                {/* Expense Feed */}
                <motion.div variants={slideUp} className="space-y-4">
                  <h2 className="text-2xl font-black flex items-center gap-2"><Activity className="text-indigo-500" /> Recent Activity</h2>
                  <AnimatePresence>
                    {expenses.map((expense: any) => (
                      <motion.div key={expense._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={hoverCard} className={glassCardClass + " !p-6"}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${expense.paidBy.name}`} className="w-12 h-12 rounded-2xl bg-indigo-50" alt="avatar" />
                            <div>
                              <h3 className="font-black text-xl">{expense.description}</h3>
                              <p className="text-sm font-bold text-slate-500">Paid by {expense.paidBy.name === user.name ? "You" : expense.paidBy.name}</p>
                            </div>
                          </div>
                          <span className="font-black text-2xl">${expense.amount.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-2 space-y-1">
                          {expense.splits.map((split: any, idx: number) => {
                            const needsPaying = !split.isPaid && expense.paidBy._id === user._id && split.user._id !== user._id;
                            return (
                              <div key={idx} className="flex justify-between items-center p-3 font-bold bg-white rounded-xl shadow-sm">
                                <span>{split.user.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className={split.isPaid ? "text-emerald-500" : "text-slate-900"}>${split.amountOwed.toFixed(2)} {split.isPaid && "✓"}</span>
                                  {needsPaying && <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleSettle(expense._id, split.user._id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">Settle</motion.button>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Chores Feed */}
                <motion.div variants={slideUp} className="space-y-4">
                  <h2 className="text-2xl font-black flex items-center gap-2"><Trash2 className="text-emerald-500" /> Pending Tasks</h2>
                  <AnimatePresence>
                    {chores.map((chore: any) => (
                      <motion.div key={chore._id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={hoverCard} className={glassCardClass + ` !p-5 flex items-center gap-5 ${chore.isCompleted ? "opacity-50" : ""}`}>
                        <motion.button whileTap={{ scale: 0.8, rotate: 180 }} onClick={() => handleToggleChore(chore._id)} className={`h-12 w-12 rounded-2xl border-2 flex items-center justify-center transition-colors ${chore.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-slate-50"}`}>
                          {chore.isCompleted && <CheckCircle2 className="text-white" size={28} />}
                        </motion.button>
                        <div>
                          <p className={`text-xl font-black ${chore.isCompleted ? "line-through text-slate-400" : ""}`}>{chore.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${chore.assignedTo.name}`} className="w-5 h-5 rounded-full bg-emerald-100" />
                             <p className="text-sm font-bold text-slate-500">For {chore.assignedTo.name}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* --- PROMINENT FOOTER --- */}
      <footer className="w-full bg-white/70 backdrop-blur-2xl border-t border-white mt-auto py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><Home size={20} /></div>
            <div>
              <span className="font-black text-xl text-slate-900 tracking-tight block leading-tight">RoomieOS</span>
              <span className="text-xs font-bold text-slate-400">Automate your apartment.</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 font-bold text-sm transition-colors">Terms of Service</a>
            <div className="h-6 w-px bg-slate-200"></div>
            <span className="text-sm font-bold text-slate-400">© 2026 RoomieOS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}