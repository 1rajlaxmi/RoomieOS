import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [user, setUser] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]); // NEW: Chores state
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [choreTitle, setChoreTitle] = useState(""); // NEW: Chore title
  const [choreAssignee, setChoreAssignee] = useState(""); // NEW: Who does the chore?
  const [error, setError] = useState("");

  // --- LIFECYCLE & FETCHING ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchHousehold(token);
  }, [navigate]);

  const fetchHousehold = async (token: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/households/my-household", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setHousehold(data);
        fetchExpenses(token); 
        fetchChores(token); // NEW: Fetch chores once household loads
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

  // --- HANDLERS: EXPENSES & HOUSEHOLD ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: expenseDesc, amount: Number(expenseAmount) }),
      });
      if (response.ok) {
        setExpenseDesc("");
        setExpenseAmount("");
        fetchExpenses(token!); 
      } else setError((await response.json()).message);
    } catch (err) { setError("Server error creating expense."); }
  };

  const handleSettle = async (expenseId: string, userId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/expenses/${expenseId}/settle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) fetchExpenses(token!);
    } catch (err) { console.error("Error settling expense", err); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/households/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: createName }),
      });
      if (response.ok) fetchHousehold(token!);
    } catch (err) { console.error(err); }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/households/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      if (response.ok) fetchHousehold(token!);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- HANDLERS: CHORES (NEW!) ---
  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: choreTitle, assignedTo: choreAssignee }),
      });
      if (response.ok) {
        setChoreTitle("");
        setChoreAssignee("");
        fetchChores(token!); // Refresh chore list
      } else setError((await response.json()).message);
    } catch (err) { setError("Server error creating chore."); }
  };

  const handleToggleChore = async (choreId: string) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/api/chores/${choreId}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) fetchChores(token!); // Refresh so it moves to the bottom!
    } catch (err) { console.error("Error toggling chore", err); }
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">RoomieOS</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">Hi, {user.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center font-medium border border-red-200">{error}</div>}

        {!household ? (
          <div className="grid md:grid-cols-2 gap-6">
             {/* Create / Join Forms remain unchanged */}
             <Card><CardHeader><CardTitle>Create an Apartment</CardTitle></CardHeader><CardContent><form onSubmit={handleCreate} className="space-y-4"><div className="space-y-2"><Label>Household Name</Label><Input placeholder="e.g. The Sunny Loft" required value={createName} onChange={(e)=>setCreateName(e.target.value)} /></div><Button type="submit" className="w-full bg-slate-900">Create</Button></form></CardContent></Card>
             <Card><CardHeader><CardTitle>Join via Code</CardTitle></CardHeader><CardContent><form onSubmit={handleJoin} className="space-y-4"><div className="space-y-2"><Label>Invite Code</Label><Input placeholder="e.g. A8F2K9" className="uppercase" required value={joinCode} onChange={(e)=>setJoinCode(e.target.value)} /></div><Button type="submit" className="w-full" variant="outline">Join</Button></form></CardContent></Card>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* --- LEFT COLUMN: Forms & Info --- */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{household.name}</CardTitle>
                  <CardDescription>Invite Code: <span className="font-mono font-bold text-blue-600">{household.inviteCode}</span></CardDescription>
                </CardHeader>
              </Card>

              {/* Add Expense Form */}
              <Card>
                <CardHeader className="pb-4"><CardTitle className="text-lg">Add Expense</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="space-y-2">
                      <Label>What was it for?</Label>
                      <Input placeholder="Internet Bill, Groceries..." required value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount ($)</Label>
                      <Input type="number" step="0.01" min="0.01" placeholder="60.00" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">Split it</Button>
                  </form>
                </CardContent>
              </Card>

              {/* NEW: Add Chore Form */}
              <Card>
                <CardHeader className="pb-4"><CardTitle className="text-lg">Assign Chore</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddChore} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Task</Label>
                      <Input placeholder="Take out the trash..." required value={choreTitle} onChange={(e) => setChoreTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Assign to</Label>
                      {/* Styled native select to match ShadCN inputs */}
                      <select 
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                        value={choreAssignee} 
                        onChange={(e) => setChoreAssignee(e.target.value)} 
                        required
                      >
                        <option value="" disabled>Select a roommate</option>
                        {household.members.map((member: any) => (
                          <option key={member._id} value={member._id}>
                            {member.name} {member._id === user._id && "(You)"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="w-full" variant="outline">Assign Task</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* --- MIDDLE COLUMN: Expenses Feed --- */}
            <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenses.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">No expenses yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {expenses.map((expense: any) => (
                        <div key={expense._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-slate-900">{expense.description}</h3>
                            <span className="font-bold text-slate-900">${expense.amount.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-slate-500">Paid by {expense.paidBy.name === user.name ? "You" : expense.paidBy.name}</p>
                          
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs space-y-1.5">
                            {expense.splits.map((split: any, idx: number) => {
                              const isOwedToMe = expense.paidBy._id === user._id;
                              const isNotMe = split.user._id !== user._id;
                              const needsPaying = !split.isPaid;

                              return (
                                <div key={idx} className="flex justify-between items-center text-slate-600">
                                  <span>{split.user.name === user.name ? "You" : split.user.name}:</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${split.isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                                      ${split.amountOwed.toFixed(2)} {split.isPaid && "(Paid)"}
                                    </span>
                                    {isOwedToMe && isNotMe && needsPaying && (
                                      <button onClick={() => handleSettle(expense._id, split.user._id)} className="text-slate-400 hover:text-emerald-600 font-medium underline">
                                        Settle
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* --- RIGHT COLUMN: Chores Feed --- */}
            <div className="lg:col-span-4">
              <Card className="h-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Chores</CardTitle>
                </CardHeader>
                <CardContent>
                  {chores.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">No chores assigned!</div>
                  ) : (
                    <div className="space-y-3">
                      {chores.map((chore: any) => (
                        <div 
                          key={chore._id} 
                          className={`p-3 rounded-lg border flex items-center justify-between gap-4 transition-colors ${
                            chore.isCompleted ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-200 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            {/* Checkbox Button */}
                            <button 
                              onClick={() => handleToggleChore(chore._id)}
                              className={`h-5 w-5 flex-shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                                chore.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-slate-400"
                              }`}
                            >
                              {chore.isCompleted && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${chore.isCompleted ? "text-slate-500 line-through" : "text-slate-900"}`}>
                                {chore.title}
                              </p>
                              <p className="text-xs text-slate-500">
                                Assigned to: {chore.assignedTo.name === user.name ? "You" : chore.assignedTo.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}