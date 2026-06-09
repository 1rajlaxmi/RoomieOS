import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // State Management
  const [user, setUser] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [error, setError] = useState("");

  // 1. Initial Load
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

  // 2. Fetch Household & Expenses Data
  const fetchHousehold = async (token: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/households/my-household", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setHousehold(data);
        fetchExpenses(token); // Grab expenses once we know the household exists!
      }
    } catch (err) {
      console.error("Error fetching household", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async (token: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error("Error fetching expenses", err);
    }
  };

  // 3. Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          description: expenseDesc, 
          amount: Number(expenseAmount) 
        }),
      });

      if (response.ok) {
        setExpenseDesc("");
        setExpenseAmount("");
        fetchExpenses(token!); // Refresh the expense feed!
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (err) {
      setError("Server error creating expense.");
    }
  };

  // Handle Household Creation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/households/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: createName }),
      });
      if (response.ok) fetchHousehold(token!);
      else setError((await response.json()).message);
    } catch (err) { setError("Server error creating household."); }
  };

  // Handle Join Household
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:5000/api/households/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      if (response.ok) fetchHousehold(token!);
      else setError((await response.json()).message);
    } catch (err) { setError("Server error joining household."); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
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
          /* View 1: No Household */
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create an Apartment</CardTitle>
                <CardDescription>Start a new household and invite your flatmates.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Household Name</Label>
                    <Input placeholder="e.g. The Sunny Loft" required value={createName} onChange={(e) => setCreateName(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800">Create</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join via Code</CardTitle>
                <CardDescription>Enter a 6-digit invite code from your flatmate.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <Input placeholder="e.g. A8F2K9" className="uppercase" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" variant="outline">Join</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* View 2: Dashboard with Expenses */
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Left Column: Actions & Roommates */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{household.name}</CardTitle>
                  <CardDescription>Invite Code: <span className="font-mono font-bold text-blue-600">{household.inviteCode}</span></CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Expense</CardTitle>
                </CardHeader>
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

              <Card>
                <CardHeader>
                  <CardTitle>Roommates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {household.members.map((member: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-slate-900 text-sm">{member.name} {member.email === user.email && "(You)"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Activity Feed */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Recent Expenses</CardTitle>
                  <CardDescription>Everything happening in the household.</CardDescription>
                </CardHeader>
                <CardContent>
                  {expenses.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      No expenses yet. Add one to get started!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expenses.map((expense: any) => (
                        <div key={expense._id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-900">{expense.description}</h3>
                            <p className="text-sm text-slate-500">
                              Paid by <span className="font-medium">{expense.paidBy.name === user.name ? "You" : expense.paidBy.name}</span> on {new Date(expense.date).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm min-w-[200px]">
                            <div className="font-semibold text-slate-900 mb-2 border-b border-slate-200 pb-1">
                              Total: ${expense.amount.toFixed(2)}
                            </div>
                            <div className="space-y-1">
                              {expense.splits.map((split: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-slate-600">
                                  <span>{split.user.name === user.name ? "You" : split.user.name}:</span>
                                  <span className={`font-medium ${split.isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                                    ${split.amountOwed.toFixed(2)} {split.isPaid && "(Paid)"}
                                  </span>
                                </div>
                              ))}
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