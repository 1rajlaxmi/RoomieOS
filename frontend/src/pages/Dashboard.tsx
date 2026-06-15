import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell as RechartsCell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Home, LogOut, Wallet, CheckCircle2, Sparkles, Trash2, Activity, Users, Plus, ArrowRight, Key, ChevronDown, Clipboard } from "lucide-react";

// --- CONTINUOUS AMBIENT BACKGROUND ANIMATIONS ---
const BackgroundAnimation = () => (
  <div className="fixed inset-0 z-[-1] bg-[#f8fafc] overflow-hidden pointer-events-none">
    {/* Spinning Ambient Orbs */}
    <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-300/20 blur-[100px]" />
    <motion.div animate={{ x: [0, -50, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-300/20 blur-[120px]" />

    {/* Floating Particles */}
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

// --- ANIMATION VARIANTS (Guarded for Strict TypeScript Compiling) ---
const staggerContainer: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };
const slideUp: any = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 100 } } };
const hoverCard: any = { scale: 1.02, y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)", transition: { type: "spring", stiffness: 300 } };

export default function Dashboard() {
  const navigate = useNavigate();

  // CORE APP STATES
  const [user, setUser] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FORM & MODAL CONTROLLERS
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [choreTitle, setChoreTitle] = useState("");
  const [choreAssignee, setChoreAssignee] = useState("");

  // SEPARATED CONTEXTUAL ERROR FEED STATES
  const [error, setError] = useState("");
  const [choreError, setChoreError] = useState("");
  const [choreFeedError, setChoreFeedError] = useState("");

  // INTERACTIVE TOGGLE STATES
  const [isChoreDropdownOpen, setIsChoreDropdownOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [showAdminExitModal, setShowAdminExitModal] = useState(false);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState("");
  const [roommateToEvict, setRoommateToEvict] = useState<any>(null)
  const [showDissolveModal, setShowDissolveModal] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false)

  // ROLE-BASED ACCESS FLAG DERIVATION
  const isAdmin = useMemo(() => {
    if (!household || !user) return false;
    return household.owner === user._id;
  }, [household, user]);

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

  // HANDLER FOR EXTRACTION PASTE COMMANDS
  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJoinCode(text.trim().toUpperCase());
    } catch (err) {
      console.error(err);
      setError("Please check your clipboard permissions settings.");
    }
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
    setChoreError("");

    if (!choreAssignee) {
      setChoreError("Please choose a roommate to delegate this task to.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/chores", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: choreTitle, assignedTo: choreAssignee }) });
      if (response.ok) { setChoreTitle(""); setChoreAssignee(""); setChoreError(""); fetchChores(token!); }
    } catch (err) { console.error(err); }
  };

  const handleToggleChore = async (choreId: string) => {
    setChoreFeedError("");
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/chores/${choreId}/toggle", { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        fetchChores(token!);
      } else {
        const data = await response.json();
        setChoreFeedError(data.message || "Unauthorized execution.");
      }
    } catch (err) { console.error(err); }
  };

  // ROOM LEAVE HANDLERS (Standard Roommate vs Admin Route Separation)
  const handleExitClick = () => {
    if (isAdmin) setShowAdminExitModal(true);
    else setIsLeaveModalOpen(true);
  };

  const executeStandardLeave = async () => {
    setIsLeaveModalOpen(false);
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/households/leave", { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { setHousehold(null); setExpenses([]); setChores([]); }
    } catch (err) { console.error(err); }
  };

  const executeTransferAndLeave = async () => {
    if (!selectedTransferTarget) return;
    const token = localStorage.getItem("token");
    try {
      const resTransfer = await fetch("http://localhost:5000/api/households/transfer", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ newOwnerId: selectedTransferTarget }) });
      if (resTransfer.ok) {
        const resLeave = await fetch("http://localhost:5000/api/households/leave", { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
        if (resLeave.ok) { setShowAdminExitModal(false); setHousehold(null); setExpenses([]); setChores([]); }
      }
    } catch (err) { console.error(err); }
  };

  const executeNuclearDelete = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/households", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setShowDissolveModal(false); // Smoothly fold away the warning modal
        setHousehold(null);
        setExpenses([]);
        setChores([]);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to dissolve room.");
        setShowDissolveModal(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network connection issue.");
      setShowDissolveModal(false);
    }
  };

  // 1. Catches the initial button click and opens our custom themed popup
  const handleEvictRoommateClick = (member: any) => {
    setRoommateToEvict(member);
  };

  // 2. Fires only when the Admin clicks the custom "Yes, Remove" action card button
  const executeEviction = async () => {
    if (!roommateToEvict) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:5000/api/households/evict/${roommateToEvict._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setRoommateToEvict(null); // Close the modal smoothly
        fetchHousehold(token!);   // Instantly update the resident list
      } else {
        const data = await response.json();
        setError(data.message || "Failed to remove roommate.");
        setRoommateToEvict(null);
      }
    } catch (err) {
      console.error(err);
      setError("Network connection issue.");
      setRoommateToEvict(null);
    }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };

  // --- ARRAYS & DATA TRANSFORMS ---
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
    <div className="min-h-screen font-sans flex flex-col relative overflow-clip text-slate-900">
      <BackgroundAnimation />

      {/* STICKY NAVBAR */}
      <nav className="sticky top-4 z-50 mx-4 sm:mx-8">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }} className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white shadow-xl shadow-indigo-900/5 h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2.5 rounded-2xl text-white shadow-lg"><Home size={24} strokeWidth={2.5} /></div>
            <h1 className="text-2xl font-black tracking-tighter hidden sm:block">RoomieOS</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="flex -space-x-3">
                {household?.members.slice(0, 3).map((m: any, i: number) => (
                  <img key={i} src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`} className="w-9 h-9 rounded-full border-2 border-white bg-slate-100 z-10 relative shadow-sm" alt="avatar" />
                ))}
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-full flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-slate-700">{user.name}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 pl-4 leading-none">{user.email}</span>
              </div>
            </div>

            {household && (
              <button onClick={handleExitClick} className={`text-sm font-bold px-4 py-2.5 rounded-full transition-all border ${isAdmin ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50"}`}>
                {isAdmin ? "👑 Admin Leave" : "Leave Apartment"}
              </button>
            )}

            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 px-5 py-2.5 rounded-full transition-all">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </motion.div>
      </nav>

      {/* COMPONENT ROUTER SCREEN */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-20 w-full z-10">
        {error && <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold text-sm">{error}</div>}

        {!household ? (
          /* ONBOARDING FLOW: REGISTRATION SETUP INTERFACES */
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
            <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6"><Sparkles size={28} /></div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6">Create Apartment</h2>
              <form onSubmit={async (e) => { e.preventDefault(); const t = localStorage.getItem("token"); await fetch("http://localhost:5000/api/households/create", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ name: createName }) }).then(() => fetchHousehold(t!)); }} className="space-y-4">
                <Input placeholder="e.g. The Sunny Loft" required value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-14 rounded-2xl bg-white/50 border-white focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold px-5" />
                <Button type="submit" className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20">Create New Space <ArrowRight className="ml-2" size={20} /></Button>
              </form>
            </motion.div>

            <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mb-6"><Users size={28} /></div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6">Join via Code</h2>
              <form onSubmit={async (e) => { e.preventDefault(); const t = localStorage.getItem("token"); await fetch("http://localhost:5000/api/households/join", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ inviteCode: joinCode }) }).then(() => fetchHousehold(t!)); }} className="space-y-4">
                <div className="relative flex items-center">
                  <Input placeholder="A8F2K9" className="uppercase h-14 w-full rounded-2xl bg-white/50 border-white focus:bg-white focus:ring-2 focus:ring-violet-500 transition-all font-mono font-black text-center text-lg tracking-widest pl-12 pr-14" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                  <button type="button" onClick={handlePasteCode} className="absolute right-4 p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all focus:outline-none" title="Paste from clipboard"><Clipboard size={18} /></button>
                </div>
                <Button type="submit"
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20">Join Existing</Button>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          /* PRIMARY ACTIVE HOUSING DASHBOARD MODULE */
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">

            {/* HERO HERO CONTAINER */}
            <motion.div variants={slideUp} whileHover={hoverCard} className="relative w-full h-72 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
              <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" alt="Home" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent"></div>
              <div className="absolute inset-0 p-10 flex flex-col justify-end w-full md:w-2/3">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{household.name}</h1>
                  {isAdmin && <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-md ml-2 uppercase tracking-wider">Admin</span>}
                </div>
                <p className="text-indigo-100 font-medium text-lg">Welcome home, {user.name}. Here is your daily overview.</p>
              </div>
              <div className="absolute top-6 right-6 md:bottom-10 md:top-auto bg-white/20 backdrop-blur-xl border border-white/40 p-4 rounded-2xl shadow-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1 flex items-center gap-1"><Key size={12} /> Invite Code</span>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl">
                  <span className="font-mono font-black text-xl text-indigo-600 tracking-widest">{household.inviteCode}</span>
                </div>
              </div>
            </motion.div>

            {/* CHARTS CONTAINER GRID */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Chart 1: UPGRADED EQUALIZER BAR CHART */}
              <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-md"><Wallet size={24} /></div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">Financial Balance</h2>
                      <p className="text-xs font-bold text-slate-400 mt-0.5">Who owes vs. who is owed</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100/50">Live Ledger</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" /></linearGradient>
                        <linearGradient id="negGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#e11d48" /></linearGradient>
                      </defs>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} dy={10} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} tick={{ fontWeight: 800, fill: '#64748b' }} />
                      <text x="0" y="0" className="hidden" />
                      <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }} content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const val = Number(payload[0].value);
                          return (
                            <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-2xl text-white font-sans">
                              <p className="text-xs font-bold text-slate-400 mb-1">{payload[0].payload.name}</p>
                              <p className="text-lg font-black tracking-tight">
                                <span className={val >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                  {val >= 0 ? `Owed: +₹${val.toFixed(2)}` : `Owes: -₹${Math.abs(val).toFixed(2)}`}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar dataKey="Net Paid" radius={[10, 10, 10, 10]}>
                        {expenseChartData.map((entry: any, idx: number) => {
                          const isPos = entry["Net Paid"] >= 0;
                          return <RechartsCell key={`cell-${idx}`} fill={isPos ? "url(#posGradient)" : "url(#negGradient)"} style={{ filter: isPos ? 'drop-shadow(0px 6px 12px rgba(16, 185, 129, 0.2))' : 'drop-shadow(0px 6px 12px rgba(244, 63, 94, 0.2))' }} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Chart 2: CHORE DONUT COMPONENT */}
              <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Sparkles size={24} /></div>
                  <h2 className="text-2xl font-black tracking-tight">Chore Productivity</h2>
                </div>
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={choreChartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                        {choreChartData.map((entry, index) => <RechartsCell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-slate-900">{chores.length}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tasks</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* WORKSPACES ACTION SPLIT AND CHORE COLUMN CONTROLS */}
            <div className="grid lg:grid-cols-12 gap-8">

              {/* ACTION COMPONENT RAILS */}
              <div className="lg:col-span-4 space-y-8">
                {/* CARD A: EXPENSE CONTROLLER */}
                <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                  <h2 className="text-xl font-black mb-6">Add Expense</h2>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <Input placeholder="Groceries, Rent..." required value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500 font-bold px-5" />
                    <Input type="number" step="0.01" min="0.01" placeholder="₹0.00" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-indigo-500 font-bold px-5" />
                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-lg"><Plus size={20} className="mr-2" /> Split Bill</motion.button>
                  </form>
                </motion.div>

                {/* CARD B: CHORE CONTROLLER WITH INTEGRATED DROP PANELS */}
                <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                  <h2 className="text-xl font-black mb-6">Assign Task</h2>
                  <form onSubmit={handleAddChore} className="space-y-4">
                    <Input placeholder="Vacuum the rug..." required value={choreTitle} onChange={(e) => setChoreTitle(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent focus:ring-2 focus:ring-emerald-500 font-bold px-5" />

                    {/* CUSTOM THEMED INTERACTIVE SELECT DROP COMPONENT */}
                    <div className="relative">
                      <div onClick={() => setIsChoreDropdownOpen(!isChoreDropdownOpen)} className="flex h-14 w-full rounded-2xl bg-slate-50 border border-transparent items-center justify-between px-5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none text-slate-700">
                        <div className="flex items-center gap-3">
                          {choreAssignee ? (() => {
                            const matchObj = household.members.find((m: any) => m._id === choreAssignee);
                            return matchObj ? (
                              <>
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${matchObj.name}`} className="w-6 h-6 rounded-full bg-slate-200" alt="avatar" />
                                <span>{matchObj.name}</span>
                              </>
                            ) : <span className="text-slate-400">Select roommate</span>;
                          })() : <span className="text-slate-400">Select roommate</span>}
                        </div>
                        <motion.div animate={{ rotate: isChoreDropdownOpen ? 180 : 0 }} transition={{ type: "spring", stiffness: 250 }} className="text-slate-400"><ChevronDown size={20} /></motion.div>
                      </div>

                      <AnimatePresence>
                        {isChoreDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsChoreDropdownOpen(false)} />
                            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute z-50 left-0 right-0 mt-2 bg-white/90 backdrop-blur-2xl rounded-2xl border border-white shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                              {household.members.map((member: any) => (
                                <div key={member._id} onClick={() => { setChoreAssignee(member._id); setIsChoreDropdownOpen(false); }} className={`flex items-center gap-3 px-5 py-3.5 font-bold cursor-pointer transition-colors text-slate-700 ${choreAssignee === member._id ? "bg-emerald-50 text-emerald-600" : "hover:bg-slate-50"}`}>
                                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} className="w-7 h-7 rounded-full bg-slate-100 shadow-sm" alt="avatar" />
                                  <span className="text-sm">{member.name}</span>
                                </div>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button whileTap={{ scale: 0.95 }} type="submit" className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center shadow-lg"><CheckCircle2 size={20} className="mr-2" /> Delegate</motion.button>
                  </form>

                  {/* INLINE CONTEXTUAL ERROR FOR CARD MODULE */}
                  <AnimatePresence>
                    {choreError && (
                      <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1, x: [0, -8, 8, -8, 8, 0] }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.4 }} className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs text-center border border-rose-100 flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {choreError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ADVANCED ADMIN-ONLY ROOMMATE DIRECTORY EVICTION MANAGER */}
                {isAdmin && (
                  <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-slate-800"><Users size={20} /> Residents List</h2>
                    <div className="space-y-3">
                      {household.members.map((m: any) => (
                        <div key={m._id} className="flex items-center justify-between p-3 bg-slate-50 border border-transparent rounded-2xl hover:border-slate-100">
                          <div className="flex items-center gap-3">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`} className="w-8 h-8 rounded-lg bg-white shadow-sm" alt="avatar" />
                            <span className="text-sm font-bold text-slate-700">{m.name} {m._id === user._id && "(You)"}</span>
                          </div>
                          {m._id !== user._id && (
                            <button onClick={() => handleEvictRoommateClick(m)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Evict Roommate"><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* DATA LOG TRANSACTIONS REFS FEED RAILS */}
              <div className="lg:col-span-8 space-y-8">
                {/* EXPENSE LOG TRACKING FEED */}
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
                          <span className="font-black text-2xl">₹{expense.amount.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-2 space-y-1">
                          {expense.splits.map((split: any, idx: number) => {
                            const needsPaying = !split.isPaid && expense.paidBy._id === user._id && split.user._id !== user._id;
                            return (
                              <div key={idx} className="flex justify-between items-center p-3 font-bold bg-white rounded-xl shadow-sm">
                                <span>{split.user.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className={split.isPaid ? "text-emerald-500" : "text-slate-900"}>₹{split.amountOwed.toFixed(2)} {split.isPaid && "✓"}</span>
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

                {/* CHORE COMPLETIONS TASK LIST FEEDS (Guarded validation blocks) */}
                <motion.div variants={slideUp} className="space-y-4">
                  <h2 className="text-2xl font-black flex items-center gap-2"><Trash2 className="text-emerald-500" /> Pending Tasks</h2>

                  {/* FEED SHAKE WARNING COMPONENT DISPLAY */}
                  <AnimatePresence>
                    {choreFeedError && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1, x: [0, -10, 10, -10, 10, 0] }} exit={{ opacity: 0 }} className="p-4 bg-amber-50 text-amber-700 font-bold text-sm rounded-2xl border border-amber-200/60 shadow-sm text-center">
                        ⚠️ {choreFeedError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {chores.map((chore: any) => (
                      <motion.div key={chore._id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={hoverCard} className={glassCardClass + ` !p-5 flex items-center gap-5 ${chore.isCompleted ? "opacity-50" : ""}`}>
                        <motion.button whileTap={{ scale: 0.8, rotate: 180 }} onClick={() => handleToggleChore(chore._id)} className={`h-12 w-12 rounded-2xl border-2 flex items-center justify-center transition-colors ${chore.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-slate-300 bg-slate-50"}`}>
                          {chore.isCompleted && <CheckCircle2 className="text-white" size={28} />}
                        </motion.button>
                        <div>
                          <p className={`text-xl font-black ${chore.isCompleted ? "line-through text-slate-400" : ""}`}>{chore.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${chore.assignedTo.name}`} className="w-5 h-5 rounded-full bg-emerald-100" alt="avatar" />
                            <p className="text-sm font-bold text-slate-500">For {chore.assignedTo.name === user.name ? "You" : chore.assignedTo.name}</p>
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

      {/* --- STANDARD POPUP MODAL DIALOG --- */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLeaveModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-2xl text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
              <h3 className="text-2xl font-black tracking-tight mb-2">Leave Apartment?</h3>
              <p className="text-slate-500 font-bold text-sm mb-8">Are you sure you want to leave this space? Your outstanding split metrics will remain but dashboard access closes.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setIsLeaveModalOpen(false)} className="h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold">Nevermind</button>
                <button onClick={executeStandardLeave} className="h-14 rounded-2xl bg-rose-600 text-white font-bold">Yes, Leave</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADMIN ADVANCED FORWARD KEYS ACCORDION DRAWER MODAL --- */}
      <AnimatePresence>
        {showAdminExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowAdminExitModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-2xl max-w-md w-full relative z-10">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Administrative Exit</h3>
              <p className="text-sm font-bold text-slate-400 mb-6">You are the founder of this room. Choose an active deployment strategy below to clear verification bounds.</p>
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-xs font-black tracking-wide uppercase text-slate-400 mb-2">Option A: Hand over keys</label>
                  {/* --- UPGRADED CUSTOM INTERACTIVE SUCCESSOR PICKER --- */}
                  <div className="relative mb-3">
                    {/* Dropdown Trigger Plate */}
                    <div
                      onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                      className="flex h-12 w-full rounded-xl bg-white border border-slate-200 items-center justify-between px-4 font-bold cursor-pointer hover:bg-slate-50 transition-colors select-none text-sm text-slate-700"
                    >
                      <div className="flex items-center gap-2.5">
                        {selectedTransferTarget ? (
                          (() => {
                            const matchObj = household.members.find((m: any) => m._id === selectedTransferTarget);
                            return matchObj ? (
                              <>
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${matchObj.name}`} className="w-5 h-5 rounded-full bg-slate-100" alt="avatar" />
                                <span>{matchObj.name}</span>
                              </>
                            ) : <span className="text-slate-400">Choose successor...</span>;
                          })()
                        ) : (
                          <span className="text-slate-400">Choose successor...</span>
                        )}
                      </div>

                      {/* Spring-Pivot Arrow Indicator */}
                      <motion.div
                        animate={{ rotate: isAdminDropdownOpen ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 250, damping: 20 }}
                        className="text-slate-400"
                      >
                        <ChevronDown size={16} />
                      </motion.div>
                    </div>

                    {/* Drawer Options Menu */}
                    <AnimatePresence>
                      {isAdminDropdownOpen && (
                        <>
                          {/* Sheet layer mask background closer guard */}
                          <div className="fixed inset-0 z-40" onClick={() => setIsAdminDropdownOpen(false)} />

                          <motion.div
                            initial={{ opacity: 0, y: -5, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -5, scale: 0.98 }}
                            className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto"
                          >
                            {household.members
                              .filter((m: any) => m._id !== user._id) // Filter out yourself dynamically
                              .map((member: any) => (
                                <div
                                  key={member._id}
                                  onClick={() => {
                                    setSelectedTransferTarget(member._id);
                                    setIsAdminDropdownOpen(false);
                                  }}
                                  className={`flex items-center gap-2.5 px-4 py-2.5 font-bold cursor-pointer transition-colors text-slate-700 text-sm 
                  ${selectedTransferTarget === member._id ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50"}
                `}
                                >
                                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} className="w-6 h-6 rounded-full bg-slate-100" alt="avatar" />
                                  <span>{member.name}</span>
                                </div>
                              ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <button disabled={!selectedTransferTarget} onClick={executeTransferAndLeave} className="w-full h-11 bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors disabled:bg-slate-200">Assign & Resign</button>
                </div>
                <div className="relative flex py-2 items-center text-slate-300">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-xs font-black uppercase text-slate-400">Or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>
                {/* --- UPDATE Option B's button block to this --- */}
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100/50">
                  <label className="block text-xs font-black uppercase text-rose-500 mb-1">Option B: Dissolve Room</label>
                  <p className="text-xs font-bold text-rose-600/70 mb-4">This action kicks out all roommates and safely deletes the workspace.</p>

                  <button
                    onClick={() => {
                      setShowAdminExitModal(false); // Close the management options card
                      setShowDissolveModal(true);   // Trigger the final high-fidelity warning sheet
                    }}
                    className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/10"
                  >
                    Delete Room for Everyone
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* --- CUSTOM THEMED RESIDENT EVICTION MODAL --- */}
      <AnimatePresence>
        {roommateToEvict && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            {/* Blurring Glass Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRoommateToEvict(null)} // Closes safely if you click outside the card
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />

            {/* Tactile Motion Response Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-slate-100 text-center"
            >
              {/* Dynamic Target User Identity Badge */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-rose-100 rounded-2xl rotate-6 scale-95" />
                <div className="absolute inset-0 bg-rose-50 rounded-2xl -rotate-3 scale-95" />
                <div className="relative w-20 h-20 bg-white border border-rose-100 rounded-2xl flex items-center justify-center shadow-md">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${roommateToEvict.name}`} className="w-16 h-16 rounded-xl bg-slate-50" alt="avatar" />
                </div>
              </div>

              <h3 className="text-2xl font-black tracking-tight text-slate-900 mb-2">Remove Resident?</h3>
              <p className="text-slate-500 font-bold text-sm px-4 mb-8 leading-relaxed">
                Are you absolutely certain you want to remove <span className="text-rose-600 font-black underline decoration-2 decoration-rose-200">{roommateToEvict.name}</span> from this apartment? They will instantly lose complete access to this dashboard group.
              </p>

              {/* Action Choice Button Matrix */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRoommateToEvict(null)}
                  className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={executeEviction}
                  className="h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-lg shadow-rose-500/20"
                >
                  Yes, Remove
                </motion.button>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
      {/* --- CUSTOM FINTECH-STYLE NUCLEAR DISSOLVE MODAL --- */}
      <AnimatePresence>
        {showDissolveModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">

            {/* Ultra-Blurred Intimidating Dark Overlay Sheet */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDissolveModal(false)} // Safe backup close on outer click
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
            />

            {/* Warning Container Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 shadow-[0_40px_80px_rgba(244,63,94,0.15)] border-2 border-rose-100 text-center"
            >
              {/* Pulsing Destructive Alert Icon Indicator */}
              <div className="w-20 h-20 bg-rose-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/30 relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-rose-600 rounded-[1.5rem] z-[-1]"
                />
                <Trash2 size={36} />
              </div>

              <h3 className="text-3xl font-black tracking-tighter text-slate-900 mb-3">Dissolve Apartment?</h3>
              <p className="text-slate-500 font-bold text-sm px-2 leading-relaxed mb-8">
                This action is <span className="text-rose-600 uppercase font-black tracking-wider">irreversible</span>. You are choosing to permanently break down this group. All chore charts, balance sheets, and active logs will be scrubbed completely.
              </p>

              {/* Secure Choice Options Matrix */}
              <div className="space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={executeNuclearDelete}
                  className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black tracking-tight text-lg transition-colors shadow-lg shadow-rose-600/20"
                >
                  Yes, Dissolve Space
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDissolveModal(false)}
                  className="w-full h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Cancel, Keep Active
                </motion.button>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* FIXED BASE FOOTER */}
      <footer className="w-full bg-white/70 backdrop-blur-2xl border-t border-white mt-auto py-8 z-10">
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