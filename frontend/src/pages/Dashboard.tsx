import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [choreTitle, setChoreTitle] = useState("");
  const [choreAssignee, setChoreAssignee] = useState("");
  const [error, setError] = useState("");

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
        fetchExpenses(token);
        fetchChores(token);
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
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: expenseDesc, amount: Number(expenseAmount) }),
      });
      if (response.ok) { setExpenseDesc(""); setExpenseAmount(""); fetchExpenses(token!); }
    } catch (err) { setError("Server error creating expense."); }
  };

  const handleSettle = async (expenseId: string, userId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${expenseId}/settle`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) fetchExpenses(token!);
    } catch (err) { console.error(err); }
  };

  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/chores", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: choreTitle, assignedTo: choreAssignee }),
      });
      if (response.ok) { setChoreTitle(""); setChoreAssignee(""); fetchChores(token!); }
    } catch (err) { setError("Server error creating chore."); }
  };

  const handleToggleChore = async (choreId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/chores/${choreId}/toggle`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchChores(token!);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); };

  // --- SMART NET OUT-OF-POCKET MATH ---
  const chartData = useMemo(() => {
    if (!household || !expenses) return [];
    return household.members.map((member: any) => {
      let actualPaid = 0;
      expenses.forEach((exp: any) => {
        if (exp.paidBy._id === member._id) {
          actualPaid += exp.amount;
          exp.splits.forEach((split: any) => {
            if (split.user._id !== member._id && split.isPaid) actualPaid -= split.amountOwed;
          });
        } else {
          exp.splits.forEach((split: any) => {
            if (split.user._id === member._id && split.isPaid) actualPaid += split.amountOwed;
          });
        }
      });
      return { name: member.name === user?.name ? "You" : member.name, "Net Paid": Number(actualPaid.toFixed(2)) };
    });
  }, [household, expenses, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex justify-center items-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-indigo-200 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-indigo-200 rounded w-3/4"></div>
            <div className="space-y-2"><div className="h-4 bg-indigo-200 rounded"></div></div>
          </div>
        </div>
      </div>
    );
  }

  // REUSABLE PREMIUM CARD STYLE
  const premiumCardClass = "bg-white/90 backdrop-blur-2xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 rounded-3xl overflow-hidden";

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Navigation Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-center p-5 px-8 gap-4 ${premiumCardClass}`}>
          <h1 className="text-2xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            RoomieOS
          </h1>
          <div className="flex items-center gap-5">
            <span className="text-sm font-semibold text-slate-600">Hey, {user.name} 👋</span>
            <button onClick={handleLogout} className="text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors">
              Log out
            </button>
          </div>
        </div>

        {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold border border-rose-200 shadow-sm">{error}</div>}

        {!household ? (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
            <Card className={premiumCardClass}>
              <CardHeader><CardTitle className="text-xl font-bold tracking-tight">Create an Apartment</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={async (e) => { e.preventDefault(); const t = localStorage.getItem("token"); await fetch("http://localhost:5000/api/households/create", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ name: createName }) }).then(() => fetchHousehold(t!)); }} className="space-y-5">
                  <Input placeholder="e.g. The Sunny Loft" required value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" />
                  <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95">Create</Button>
                </form>
              </CardContent>
            </Card>
            <Card className={premiumCardClass}>
              <CardHeader><CardTitle className="text-xl font-bold tracking-tight">Join via Code</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={async (e) => { e.preventDefault(); const t = localStorage.getItem("token"); await fetch("http://localhost:5000/api/households/join", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ inviteCode: joinCode }) }).then(() => fetchHousehold(t!)); }} className="space-y-5">
                  <Input placeholder="e.g. A8F2K9" className="uppercase h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-mono font-bold text-center" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                  <Button type="submit" className="w-full h-12 rounded-xl bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-300 font-bold shadow-sm transition-all active:scale-95">Join</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8">

            {/* --- LEFT COLUMN: Forms & Data --- */}
            <div className="lg:col-span-4 space-y-8">

              {/* Premium Analytics Card */}
              <Card className={`${premiumCardClass} relative`}>
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <CardHeader className="pb-2 pt-6">
                  <CardTitle className="text-xl font-bold tracking-tight text-slate-900">{household.name}</CardTitle>
                  <CardDescription className="font-medium mt-1">
                    Invite Code: <span className="font-mono font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md tracking-widest">{household.inviteCode}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-52 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} tick={{ fill: '#64748b', fontWeight: 600 }} />
                        <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Bar
                          dataKey="Net Paid"
                          radius={[8, 8, 0, 0]}
                          fill="#cbd5e1" // Default color for roommates
                        >
                          {chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'You' ? '#6366f1' : '#cbd5e1'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Add Expense Form */}
              <Card className={premiumCardClass}>
                <CardHeader className="pb-4"><CardTitle className="text-lg font-bold tracking-tight">Add Expense</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <Input placeholder="Internet Bill, Groceries..." required value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                    <Input type="number" step="0.01" min="0.01" placeholder="Amount ($)" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                    <Button type="submit" className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md shadow-slate-900/20 transition-all active:scale-95">Split Exactly</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Add Chore Form */}
              <Card className={premiumCardClass}>
                <CardHeader className="pb-4"><CardTitle className="text-lg font-bold tracking-tight">Assign Chore</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddChore} className="space-y-4">
                    <Input placeholder="Take out the trash..." required value={choreTitle} onChange={(e) => setChoreTitle(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
                    <select className="flex h-11 w-full rounded-xl border-transparent bg-slate-50 px-3 py-2 text-sm font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer" value={choreAssignee} onChange={(e) => setChoreAssignee(e.target.value)} required>
                      <option value="" disabled>Select a roommate</option>
                      {household.members.map((member: any) => (
                        <option key={member._id} value={member._id}>{member.name} {member._id === user._id && "(You)"}</option>
                      ))}
                    </select>
                    <Button type="submit" className="w-full h-11 rounded-xl bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-300 font-bold shadow-sm transition-all active:scale-95">Assign Task</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* --- MIDDLE COLUMN: Activity Feed --- */}
            <div className="lg:col-span-4">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-800 mb-6 px-2">Recent Activity</h2>
              <div className="space-y-5">
                {expenses.length === 0 ? (
                  <div className="text-center py-16 text-sm font-medium text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">No expenses yet.</div>
                ) : (
                  <AnimatePresence>
                    {expenses.map((expense: any) => (
                      <motion.div
                        key={expense._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 space-y-5"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">{expense.description}</h3>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">Paid by {expense.paidBy.name === user.name ? "You" : expense.paidBy.name}</p>
                          </div>
                          <span className="font-black text-xl text-slate-900 tracking-tight">${expense.amount.toFixed(2)}</span>
                        </div>

                        <div className="bg-slate-50/80 p-4 rounded-2xl space-y-3">
                          {expense.splits.map((split: any, idx: number) => {
                            const isOwedToMe = expense.paidBy._id === user._id;
                            const isNotMe = split.user._id !== user._id;
                            const needsPaying = !split.isPaid;
                            return (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-slate-600">{split.user.name === user.name ? "You" : split.user.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className={`font-bold ${split.isPaid ? "text-emerald-500" : "text-rose-500"}`}>
                                    ${split.amountOwed.toFixed(2)} {split.isPaid && "✓"}
                                  </span>
                                  {isOwedToMe && isNotMe && needsPaying && (
                                    <button onClick={() => handleSettle(expense._id, split.user._id)} className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-600 shadow-md shadow-slate-900/10 transition-all active:scale-95">
                                      Settle
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* --- RIGHT COLUMN: Chores Feed --- */}
            <div className="lg:col-span-4">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-800 mb-6 px-2">Household Chores</h2>
              <div className="space-y-4">
                {chores.length === 0 ? (
                  <div className="text-center py-16 text-sm font-medium text-slate-400 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">No chores assigned.</div>
                ) : (
                  <AnimatePresence>
                    {chores.map((chore: any) => (
                      <motion.div
                        key={chore._id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className={`p-5 rounded-3xl flex items-center justify-between gap-4 transition-all duration-500 border-0 ${chore.isCompleted ? "bg-white/40 shadow-sm ring-1 ring-slate-900/5 opacity-70 grayscale-[30%]" : "bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5"
                          }`}
                      >
                        <div className="flex items-center gap-4 overflow-hidden w-full">
                          <button
                            onClick={() => handleToggleChore(chore._id)}
                            className={`h-7 w-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-75 ${chore.isCompleted ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30" : "border-slate-300 hover:border-indigo-400 bg-slate-50"
                              }`}
                          >
                            {chore.isCompleted && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" /></svg>
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className={`text-base font-bold truncate transition-all ${chore.isCompleted ? "text-slate-400 line-through" : "text-slate-900"}`}>
                              {chore.title}
                            </p>
                            <p className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${chore.isCompleted ? "text-slate-400" : "text-indigo-500"}`}>
                              {chore.assignedTo.name === user.name ? "Your Turn" : `For ${chore.assignedTo.name}`}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}