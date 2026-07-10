import { useEffect, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom"; // ✅ UPDATED: Added useOutletContext hook
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "../socket"; // ✅ FIXED: Drops local io connection and uses central client engine exclusively
import { Skeleton } from "@/components/ui/skeleton";
import DashboardSkeleton from "../components/DashboardSkeleton"
import { LogOut, Wallet, CheckCircle2, Sparkles, Trash2, Activity, Users, Plus, ArrowRight, Key, ChevronDown, Clipboard } from "lucide-react";

// Centralized feature service layers
import { householdService } from "@/services/householdService";
import { choreService } from "@/services/choreService";
import { expenseService } from "@/services/expenseService";

const staggerContainer: any = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } };
const slideUp: any = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 100 } } };
const hoverCard: any = { scale: 1.02, y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)", transition: { type: "spring", stiffness: 300 } };

export default function Dashboard() {
  const navigate = useNavigate();
  // ✅ NEW: Read the global layout refresh handler to keep navigation avatars completely in sync
  const { fetchHouseholdData: refreshGlobalNavbarAvatars } = useOutletContext<any>() || {};

  const [user, setUser] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [household, setHousehold] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination Tracking Indices
  const [expensePage, setExpensePage] = useState(1);
  const [chorePage, setChorePage] = useState(1);
  const itemsPerPage = 3;

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [choreTitle, setChoreTitle] = useState("");
  const [choreAssignee, setChoreAssignee] = useState("");

  const [error, setError] = useState("");
  const [choreError, setChoreError] = useState("");
  const [choreFeedError, setChoreFeedError] = useState("");

  const [isChoreDropdownOpen, setIsChoreDropdownOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [showAdminExitModal, setShowAdminExitModal] = useState(false);
  const [selectedTransferTarget, setSelectedTransferTarget] = useState("");
  const [roommateToEvict, setRoommateToEvict] = useState<any>(null);
  const [showDissolveModal, setShowDissolveModal] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);

  const isAdmin = useMemo(() => {
    if (!household || !user) return false;
    const ownerIdStr = typeof household.owner === "object" && household.owner?._id
      ? household.owner._id.toString()
      : household.owner?.toString();
    const userIdStr = user._id?.toString();
    return ownerIdStr === userIdStr;
  }, [household, user]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      initializeDashboardContext();
    } catch (err) {
      console.error("Profile synchronization failure. Re-authenticating...");
      localStorage.clear();
      navigate("/login");
    }
  }, [navigate]);

  // ✅ FIXED: Added 'isBackground' parameter to prevent skeleton flash during real-time updates
  const initializeDashboardContext = async (isBackground = false) => {
    if (!localStorage.getItem("token")) return;
    try {
      // Only show the skeleton loader if it's NOT a background sync
      if (!isBackground) {
        setLoading(true);
      }
      setError("");

      const freshUserResponse = await householdService.getProfile();

      if (freshUserResponse && freshUserResponse._id) {
        setHousehold(freshUserResponse);

        const [fetchedExpenses, fetchedChores] = await Promise.all([
          expenseService.getHouseholdExpenses(),
          choreService.getAll()
        ]);

        setExpenses(Array.isArray(fetchedExpenses) ? fetchedExpenses : []);
        setChores(Array.isArray(fetchedChores) ? fetchedChores : []);
      } else {
        setHousehold(null);
        setExpenses([]);
        setChores([]);
      }
    } catch (err: any) {
      console.error("Dashboard context hydration failure:", err);
      setHousehold(null);
      setExpenses([]);
      setChores([]);
    } finally {
      // Only turn off loading if we explicitly turned it on
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  const fetchDashboardData = async () => {
    if (!household?._id) return;
    try {
      const [fetchedExpenses, fetchedChores] = await Promise.all([
        expenseService.getHouseholdExpenses(),
        choreService.getAll()
      ]);
      setExpenses(Array.isArray(fetchedExpenses) ? fetchedExpenses : []);
      setChores(Array.isArray(fetchedChores) ? fetchedChores : []);
    } catch (err: any) {
      console.error("Background sync failure:", err);
    }
  };

  // ✅ FIXED REAL-TIME SYNCHRONIZATION HOOK: Adopted unified client file mappings
  useEffect(() => {
    if (!household || !household._id || !user || !user._id) {
      return;
    }

    socket.emit("join_household", household._id.toString());

    // ✅ FIXED: Pass 'true' to signal a background re-hydration, preventing the skeleton flash!
    const triggerRefreshEvent = () => {
      initializeDashboardContext(true); // 🔥 true = silent update (no full-page reload)
      if (refreshGlobalNavbarAvatars) refreshGlobalNavbarAvatars();
    };

    socket.on("household_data_changed", triggerRefreshEvent);
    socket.on("chores_data_changed", triggerRefreshEvent);
    socket.on("expenses_data_changed", triggerRefreshEvent);
    socket.on("calendar_data_changed", triggerRefreshEvent);

    return () => {
      socket.off("household_data_changed", triggerRefreshEvent);
      socket.off("chores_data_changed", triggerRefreshEvent);
      socket.off("expenses_data_changed", triggerRefreshEvent);
      socket.off("calendar_data_changed", triggerRefreshEvent);
    };
  }, [household?._id, user?._id]);

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJoinCode(text.trim().toUpperCase());
    } catch (err) { setError("Check your clipboard settings."); }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true); // 🔥 Trigger skeleton loading window right now!
      const updatedHousehold = await householdService.create(createName);
      setCreateName("");
      setHousehold(updatedHousehold);

      if (user) {
        const freshUserProfile = { ...user, household: updatedHousehold };
        localStorage.setItem("user", JSON.stringify(freshUserProfile));
        setUser(freshUserProfile);
      }

      socket.emit("join_household", updatedHousehold._id.toString());
      if (refreshGlobalNavbarAvatars) refreshGlobalNavbarAvatars();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to create space.");
    } finally {
      setLoading(false); // Stop loading fallback layer
    }
  };

  const handleJoinSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true); // 🔥 Trigger skeleton loading window right now!
      const updatedHousehold = await householdService.join(joinCode);
      setJoinCode("");
      setHousehold(updatedHousehold);

      if (user) {
        const freshUserProfile = { ...user, household: updatedHousehold };
        localStorage.setItem("user", JSON.stringify(freshUserProfile));
        setUser(freshUserProfile);
      }

      socket.emit("join_household", updatedHousehold._id.toString());
      if (refreshGlobalNavbarAvatars) refreshGlobalNavbarAvatars();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to join space.");
    } finally {
      setLoading(false); // Stop loading fallback layer
    }
  };

  // ✅ FIXED: Changed route update hook step down from initializeDashboardContext to fetchDashboardData
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingExpense(true); // 🔥 Start the activity loop skeleton loader instantly!
      setError("");

      await expenseService.create({
        description: expenseDesc,
        amount: Number(expenseAmount)
      });

      setExpenseDesc("");
      setExpenseAmount("");

      await fetchDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsCreatingExpense(false); // 🧼 Turn off the isolated skeleton wrapper smoothly
    }
  };

  // ✅ FIXED: Changed route update hook step down from initializeDashboardContext to fetchDashboardData
  const handleSettle = async (expenseId: string, userId: string) => {
    try {
      await expenseService.settle(expenseId, userId);
      await fetchDashboardData(); // 🔥 Silent, flicker-free background sync
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  // ✅ FIXED: Changed route update hook step down from initializeDashboardContext to fetchDashboardData
  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault();
    setChoreError("");
    if (!choreAssignee) { setChoreError("Please choose a roommate to delegate this task to."); return; }

    try {
      setIsCreatingTask(true);
      await choreService.create(choreTitle, choreAssignee);
      setChoreTitle("");
      setChoreAssignee("");

      await fetchDashboardData(); // 🔥 Silent, flicker-free background sync
    } catch (err: any) {
      setChoreError(err.response?.data?.message || err.message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  // ✅ FIXED: Changed route update hook step down from initializeDashboardContext to fetchDashboardData
  const handleToggleChore = async (choreId: string) => {
    setChoreFeedError("");
    try {
      await choreService.toggleStatus(choreId);
      await fetchDashboardData(); // 🔥 Silent, flicker-free background sync
    } catch (err: any) {
      setChoreFeedError(err.response?.data?.message || err.message || "Unauthorized execution.");
    }
  };

  const handleExitClick = () => {
    if (isAdmin) setShowAdminExitModal(true);
    else setIsLeaveModalOpen(true);
  };

  const executeStandardLeave = async () => {
    const oldRoomId = household?._id;
    setIsLeaveModalOpen(false);
    try {
      if (oldRoomId) socket.emit("leave_room", oldRoomId.toString());

      await householdService.leave();
      setHousehold(null);
      setExpenses([]);
      setChores([]);

      if (user) {
        const freshUserProfile = { ...user, household: null };
        localStorage.setItem("user", JSON.stringify(freshUserProfile));
        setUser(freshUserProfile);
      }

      if (refreshGlobalNavbarAvatars) refreshGlobalNavbarAvatars();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to leave household.");
    }
  };

  const executeTransferAndLeave = async () => {
    if (!selectedTransferTarget) return;
    const oldRoomId = household?._id;
    try {
      if (oldRoomId) socket.emit("leave_room", oldRoomId.toString());

      await householdService.transferOwnership(selectedTransferTarget);
      await householdService.leave();
      setShowAdminExitModal(false);
      setHousehold(null);
      setExpenses([]);
      setChores([]);

      if (user) {
        const freshUserProfile = { ...user, household: null };
        localStorage.setItem("user", JSON.stringify(freshUserProfile));
        setUser(freshUserProfile);
      }

      if (refreshGlobalNavbarAvatars) refreshGlobalNavbarAvatars();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const executeNuclearDelete = async () => {
    try {
      await householdService.dissolveRoom();
      setShowDissolveModal(false);
      setHousehold(null);
      setExpenses([]);
      setChores([]);

      if (user) {
        const freshUserProfile = { ...user, household: null };
        localStorage.setItem("user", JSON.stringify(freshUserProfile));
        setUser(freshUserProfile);
      }

      if (refreshGlobalNavbarAvatars) refreshGlobalNavbarAvatars();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to dissolve room.");
      setShowDissolveModal(false);
    }
  };

  const handleEvictRoommate = async () => {
    if (!roommateToEvict) return;
    try {
      await householdService.evictRoommate(roommateToEvict._id);
      setRoommateToEvict(null);
      fetchDashboardData();
      if (refreshGlobalNavbarAvatars) refreshGlobalNavbarAvatars();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message);
      setRoommateToEvict(null);
    }
  };

  const expenseChartData = useMemo(() => {
    if (!household || !household.members || !expenses) return [];
    return household.members.map((member: any) => {
      let actualPaid = 0;
      expenses.forEach((exp: any) => {
        if (exp.paidBy?._id === member._id) {
          actualPaid += exp.amount;
          exp.splits?.forEach((s: any) => { if (s.user?._id !== member._id && s.isPaid) actualPaid -= s.amountOwed; });
        } else {
          exp.splits?.forEach((s: any) => { if (s.user?._id === member._id && s.isPaid) actualPaid += s.amountOwed; });
        }
      });

      const netPaid = Number(actualPaid.toFixed(2));
      return {
        id: member._id,
        name: member.name === user?.name ? "You" : member.name,
        "Net Paid": netPaid,
        fill: netPaid >= 0 ? "url(#posGradient)" : "url(#negGradient)"
      };
    });
  }, [household, expenses, user]);

  const choreChartData = useMemo(() => {
    const completed = chores.filter(c => c.isCompleted).length;
    const pending = chores.length - completed;

    if (chores.length === 0) return [{ name: "No Chores", value: 1, fill: "#e2e8f0" }];
    return [
      { name: "Completed", value: completed, fill: "#10b981" },
      { name: "Pending", value: pending, fill: "#6366f1" }
    ];
  }, [chores]);

  if (loading || !user) return <DashboardSkeleton />;

  const glassCardClass = "bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white";

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-clip text-slate-900">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-20 w-full z-10">
        {error && <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl text-center font-bold text-sm">{error}</div>}

        {!household ? (
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
            <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-6 "><Sparkles size={28} /></div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6">Create Apartment</h2>
              <form onSubmit={handleCreateSpace} className="space-y-4">
                <Input placeholder="e.g. The Sunny Loft" required value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-14 rounded-2xl bg-white/50 border-white focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold px-5" />
                <Button type="submit" className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xl cursor-pointer">
                  Create New Space <ArrowRight className="ml-2" size={20} />
                </Button>
              </form>
            </motion.div>

            <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 mb-6"><Users size={28} /></div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-6">Join via Code</h2>
              <form onSubmit={handleJoinSpace} className="space-y-4">
                <div className="relative flex items-center">
                  <Input placeholder="A8F2K9" className="uppercase h-14 w-full rounded-2xl bg-white/50 border-white focus:bg-white focus:ring-2 focus:ring-violet-500 font-mono font-black text-center text-lg tracking-widest pl-12 pr-14" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                  <button type="button" onClick={handlePasteCode} className="absolute right-4 p-2 rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all" title="Paste"><Clipboard size={18} /></button>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xl cursor-pointer">
                  Join Existing
                </Button>
              </form>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={slideUp} whileHover={hoverCard} className="relative w-full h-72 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
              <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop" alt="Home" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/75 to-transparent"></div>
              <div className="absolute inset-0 p-10 flex flex-col justify-end w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{household.name}</h1>
                      {isAdmin ? (
                        <span className="text-[10px] font-black bg-amber-500 text-white px-2.5 py-1 rounded-full shadow-md ml-2 uppercase tracking-wider animate-pulse">Owner Console</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full ml-2">Resident</span>
                      )}
                    </div>
                    <p className="text-indigo-100 font-medium text-lg">Welcome home, {user.name}. Here is your dashboard.</p>
                  </div>
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      y: -3,
                      boxShadow: isAdmin
                        ? "0 0 25px 5px rgba(245, 158, 11, 0.4), 0 10px 20px -5px rgba(0, 0, 0, 0.3)"
                        : "0 10px 25px -5px rgba(0, 0, 0, 0.2)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExitClick}
                    className={`h-12 px-6 font-bold rounded-2xl transition-all duration-300 flex items-center gap-2.5 text-sm select-none border backdrop-blur-xl cursor-pointer ${isAdmin
                      ? "bg-slate-950/80 text-amber-400 border-amber-500/40 hover:bg-amber-500 hover:text-white hover:border-amber-400"
                      : "bg-white/90 text-slate-900 border-slate-200/80 hover:bg-white"
                      }`}
                  >
                    <LogOut size={16} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-0.5" />
                    <span className="tracking-tight">{isAdmin ? "Room Management" : "Leave Apartment"}</span>
                  </motion.button>
                </div>
              </div>

              <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-xl border border-white/40 p-4 rounded-2xl shadow-2xl flex flex-col items-center">
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1 flex items-center gap-1"><Key size={12} /> Invite Code</span>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl">
                  <span className="font-mono font-black text-xl text-indigo-600 tracking-widest">{household.inviteCode}</span>
                </div>
              </div>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8">
              <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-md"><Wallet size={24} /></div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Financial Balance</h2>
                  </div>
                </div>
                <div className="h-64 w-full min-w-0">
                  {household?._id && expenseChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={250} minWidth={0}>
                      <BarChart data={expenseChartData} margin={{ top: 10, right: 10, left: -5, bottom: 5 }}>
                        <defs>
                          <linearGradient id="posGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="negGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="100%" stopColor="#e11d48" />
                          </linearGradient>
                        </defs>

                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} dy={10} />

                        <YAxis
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontWeight: 800, fill: '#64748b' }}
                          tickFormatter={(val) => {
                            const num = Math.abs(val);
                            let formatted = `₹${val}`;

                            if (num >= 1.0e9) {
                              formatted = `₹${(val / 1.0e9).toFixed(1)}B`;
                            } else if (num >= 1.0e6) {
                              formatted = `₹${(val / 1.0e6).toFixed(1)}M`;
                            } else if (num >= 1.0e3) {
                              formatted = `₹${(val / 1.0e3).toFixed(1)}K`;
                            } else {
                              formatted = `₹${val}`;
                            }
                            return formatted;
                          }}
                        />

                        <Tooltip content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const val = Number(payload[0].value);
                            return (
                              <div className="bg-slate-950/95 backdrop-blur-xl p-4 rounded-2xl text-white font-sans shadow-xl border border-white/10">
                                <p className="text-xs font-bold text-slate-400 mb-1">{payload[0].payload.name}</p>
                                <p className="text-lg font-black">
                                  <span className={val >= 0 ? "text-emerald-400" : "text-rose-400"}>
                                    {val >= 0 ? `Owed: +₹${val.toLocaleString('en-IN')}` : `Owes: -₹${Math.abs(val).toLocaleString('en-IN')}`}
                                  </span>
                                </p>
                              </div>
                            );
                          } return null;
                        }} />

                        <Bar
                          dataKey="Net Paid"
                          radius={[10, 10, 10, 10]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

              <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl"><Sparkles size={24} /></div>
                  <h2 className="text-2xl font-black tracking-tight">Chore Productivity</h2>
                </div>
                <div className="h-64 w-full relative min-w-0">
                  {household?._id && (
                    <ResponsiveContainer width="100%" height={250} minWidth={0}>
                      <PieChart>
                        <Tooltip
                          wrapperStyle={{ zIndex: 1000 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const dataItem = payload[0].payload;
                              return (
                                <div className="bg-slate-950/95 backdrop-blur-xl p-4 rounded-2xl text-white font-sans shadow-xl border border-white/10 relative z-[1000]">
                                  <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{dataItem.name}</p>
                                  <p className="text-xl font-black flex items-center gap-2">
                                    <span style={{ color: dataItem.fill }}>●</span>
                                    <span>{dataItem.value} {dataItem.value === 1 ? 'Task' : 'Tasks'}</span>
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        <Pie
                          data={choreChartData}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          stroke="none"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {household?._id && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                      <div className="bg-white rounded-full w-[136px] h-[136px] flex flex-col items-center justify-center shadow-inner border border-slate-50/10">
                        <span className="text-4xl font-black text-slate-900">{chores.length}</span>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tasks</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8 relative z-30">
                <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                  <h2 className="text-xl font-black mb-6">Add Expense</h2>
                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <Input placeholder="Groceries, Rent..." required value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent font-bold px-5" />
                    <Input type="number" step="0.01" min="0.01" placeholder="₹0.00" required value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-transparent font-bold px-5" />
                    <button type="submit" className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center shadow-lg cursor-pointer"><Plus size={20} className="mr-2" />Split Bill</button>
                  </form>
                </motion.div>

                <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass + " !overflow-visible relative z-50"}>
                  <h2 className="text-xl font-black mb-6">Assign Task</h2>
                  <form onSubmit={handleAddChore} className="space-y-4">
                    <Input
                      placeholder="Vacuum the rug..."
                      required
                      value={choreTitle}
                      onChange={(e) => setChoreTitle(e.target.value)}
                      className="h-14 rounded-2xl bg-slate-50 border-transparent font-bold px-5"
                    />

                    <div className="relative z-50">
                      <div
                        onClick={() => setIsChoreDropdownOpen(!isChoreDropdownOpen)}
                        className="flex h-14 w-full rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 items-center justify-between px-5 font-bold cursor-pointer text-slate-700 select-none transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {choreAssignee ? (() => {
                            const matchObj = household.members?.find((m: any) => m._id === choreAssignee);
                            return matchObj ? (
                              <>
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${matchObj.name}`} className="w-6 h-6 rounded-full bg-slate-200" alt="avatar" />
                                <span className="text-sm font-black text-slate-800">{matchObj.name}</span>
                              </>
                            ) : <span className="text-slate-400 text-sm">Select roommate...</span>;
                          })() : <span className="text-slate-400 text-sm">Select roommate...</span>}
                        </div>
                        <motion.div animate={{ rotate: isChoreDropdownOpen ? 180 : 0 }} className="text-slate-400">
                          <ChevronDown size={18} strokeWidth={2.5} />
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {isChoreDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-[60]" onClick={() => setIsChoreDropdownOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] max-h-48 overflow-y-auto z-[70] scrollbar-thin scrollbar-thumb-slate-200"
                            >
                              {household.members?.map((member: any, index: number) => (
                                <button
                                  key={member._id || `assign-${index}`}
                                  onClick={() => { setChoreAssignee(member._id); setIsChoreDropdownOpen(false); }}
                                  className={`flex items-center gap-3 px-5 py-3.5 font-bold cursor-pointer text-left w-full transition-all ${choreAssignee === member._id ? "bg-emerald-50 text-emerald-600" : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                                    }`}
                                  type="button"
                                >
                                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} className="w-7 h-7 rounded-full bg-slate-100 shadow-sm" alt="avatar" />
                                  <span className="text-sm font-black">{member.name} {member._id === user?._id ? "(You)" : ""}</span>
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {choreError && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: [0, -8, 8, -8, 8, 0] }}
                            exit={{ opacity: 0 }}
                            className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs text-center border flex items-center justify-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> {choreError}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button type="submit" className="w-full h-14 rounded-2xl bg-emerald-500 text-white font-bold text-lg flex items-center justify-center shadow-lg cursor-pointer transition-all hover:bg-emerald-600">
                      <CheckCircle2 size={20} className="mr-2" /> Delegate
                    </button>
                  </form>
                </motion.div>

                {isAdmin && (
                  <motion.div variants={slideUp} whileHover={hoverCard} className={glassCardClass}>
                    <h2 className="text-xl font-black mb-4 flex items-center gap-2"><Users size={20} /> Residents List</h2>
                    <div className="space-y-3">
                      {household.members?.map((m: any, index: number) => (
                        <div key={m._id || `resident-${index}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-transparent">
                          <div className="flex items-center gap-3">
                            <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.name}`} className="w-8 h-8 rounded-lg bg-white shadow-sm" alt="avatar" />
                            <span className="text-sm font-bold text-slate-700">{m.name} {m._id === user._id && "(You)"}</span>
                          </div>
                          {m._id !== user._id && (
                            <button type="button" onClick={() => setRoommateToEvict(m)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="lg:col-span-8 space-y-8 relative z-10">
                <motion.div variants={slideUp} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black flex items-center gap-2"><Activity className="text-indigo-500" /> Recent Activity</h2>
                    {expenses.length > itemsPerPage && (
                      <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                        Page {expensePage} of {Math.ceil(expenses.length / itemsPerPage)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-4"></div>
                  <AnimatePresence mode="popLayout">
                    {/* ✅ FIXED: Beautiful local skeleton container item added right here */}
                    {isCreatingExpense && (
                      <motion.div
                        key="single-expense-skeleton"
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0 }}
                        className={glassCardClass + " !p-6 flex items-center justify-between border-dashed border-indigo-300 bg-indigo-50/10"}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Skeleton className="h-12 w-12 rounded-2xl bg-indigo-200/50 flex-shrink-0 animate-pulse" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-1/3 bg-slate-200 rounded-lg animate-pulse" />
                            <Skeleton className="h-4 w-1/4 bg-slate-100 rounded-md animate-pulse" />
                          </div>
                        </div>
                        <Skeleton className="h-7 w-20 bg-slate-200 rounded-xl flex-shrink-0 animate-pulse" />
                      </motion.div>
                    )}
                    {expenses.length === 0 ? (
                      <div className={glassCardClass + " text-center py-8 text-slate-400 font-bold text-sm"}>No recent bills logged.</div>
                    ) : (
                      expenses
                        .slice((expensePage - 1) * itemsPerPage, expensePage * itemsPerPage)
                        .map((expense: any) => (
                          <motion.div key={expense._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={hoverCard} className={glassCardClass + " !p-6"}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${expense.paidBy?.name}`} className="w-12 h-12 rounded-2xl bg-indigo-50" alt="avatar" />
                                <div>
                                  <h3 className="font-black text-xl">{expense.description}</h3>
                                  <p className="text-sm font-bold text-slate-500">Paid by {expense.paidBy?.name === user.name ? "You" : expense.paidBy?.name}</p>
                                </div>
                              </div>
                              <span className="font-black text-2xl">₹{expense.amount?.toFixed(2)}</span>
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-2 space-y-1">
                              {expense.splits?.map((split: any, idx: number) => {
                                const needsPaying = !split.isPaid && expense.paidBy?._id === user._id && split.user?._id !== user._id;
                                return (
                                  <div key={idx} className="flex justify-between items-center p-3 font-bold bg-white rounded-xl shadow-sm">
                                    <span>{split.user?.name}</span>
                                    <div className="flex items-center gap-3">
                                      <span className={split.isPaid ? "text-emerald-500" : "text-slate-900"}>₹{split.amountOwed?.toFixed(2)} {split.isPaid && "✓"}</span>
                                      {needsPaying && <button onClick={() => handleSettle(expense._id, split.user?._id)} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold cursor-pointer">Settle</button>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        ))
                    )}
                  </AnimatePresence>

                  {expenses.length > itemsPerPage && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100/60 mt-4">
                      <button
                        type="button"
                        disabled={expensePage === 1}
                        onClick={() => setExpensePage(prev => Math.max(prev - 1, 1))}
                        className="px-5 py-2.5 text-xs font-black text-slate-700 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl shadow-sm transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        disabled={expensePage >= Math.ceil(expenses.length / itemsPerPage)}
                        onClick={() => setExpensePage(prev => prev + 1)}
                        className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </motion.div>

                <motion.div variants={slideUp} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black flex items-center gap-2">
                      <CheckCircle2 className="text-emerald-500" /> Pending Tasks
                    </h2>
                    {chores.filter(c => !c.isCompleted).length > itemsPerPage && (
                      <span className="text-xs font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                        Page {chorePage} of {Math.ceil(chores.filter(c => !c.isCompleted).length / itemsPerPage)}
                      </span>
                    )}
                  </div>
                  <AnimatePresence mode="popLayout">
                    {choreFeedError && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-4 bg-amber-50 text-amber-700 font-bold text-sm rounded-2xl text-center">
                        ⚠️ {choreFeedError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                      {isCreatingTask && (
                        <motion.div key="single-task-skeleton" initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0 }} className={glassCardClass + " !p-5 flex items-center gap-5 border-dashed border-indigo-300 bg-indigo-50/10"}>
                          <Skeleton className="h-12 w-12 rounded-2xl bg-indigo-200/50 flex-shrink-0 animate-pulse" />
                          <div className="space-y-2.5 flex-1">
                            <Skeleton className="h-5 w-1/2 bg-slate-200/80 rounded-lg animate-pulse" />
                            <Skeleton className="h-4 w-1/4 bg-slate-100 rounded-md animate-pulse" />
                          </div>
                        </motion.div>
                      )}

                      {chores.filter(c => !c.isCompleted).length === 0 && !isCreatingTask ? (
                        <div className={glassCardClass + " text-center py-8 text-slate-400 font-bold text-sm"}>No pending tasks for your room! 🎉</div>
                      ) : (
                        chores
                          .filter((c: any) => !c.isCompleted)
                          .slice((chorePage - 1) * itemsPerPage, chorePage * itemsPerPage)
                          .map((chore: any) => (
                            <motion.div key={chore._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={hoverCard} className={glassCardClass + " !p-5 flex items-center gap-5"}>
                              <button type="button" onClick={() => handleToggleChore(chore._id)} className="h-12 w-12 rounded-2xl border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 border-slate-300 bg-slate-50 hover:border-emerald-400 cursor-pointer">
                                {chore.isCompleted && <CheckCircle2 className="text-white" size={28} />}
                              </button>
                              <div>
                                <p className="text-xl font-black text-slate-900">{chore.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${chore.assignedTo?.name}`} className="w-5 h-5 rounded-full bg-emerald-100" alt="avatar" />
                                  <p className="text-sm font-bold text-slate-500">For {chore.assignedTo?.name === user?.name ? "You" : chore.assignedTo?.name}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                      )}
                    </AnimatePresence>
                  </div>

                  {chores.filter(c => !c.isCompleted).length > itemsPerPage && (
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100/60 mt-4">
                      <button
                        type="button"
                        disabled={chorePage === 1}
                        onClick={() => setChorePage(prev => Math.max(prev - 1, 1))}
                        className="px-5 py-2.5 text-xs font-black text-slate-700 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl shadow-sm transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                      >
                        ← Prev
                      </button>
                      <button
                        type="button"
                        disabled={chorePage >= Math.ceil(chores.filter(c => !c.isCompleted).length / itemsPerPage)}
                        onClick={() => setChorePage(prev => prev + 1)}
                        className="px-5 py-2.5 text-xs font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer flex items-center gap-1 select-none"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* STANDARD EXIT MODAL */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLeaveModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 text-center shadow-2xl">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 size={32} /></div>
              <h3 className="text-2xl font-black mb-2">Leave Apartment?</h3>
              <p className="text-slate-500 font-bold text-sm mb-8">Are you sure you want to exit? Your dashboard access will close instantly.</p>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold cursor-pointer">Nevermind</button>
                <button type="button" onClick={executeStandardLeave} className="h-14 rounded-2xl bg-rose-600 text-white font-bold cursor-pointer">Yes, Leave</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EVICTION CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {roommateToEvict && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setRoommateToEvict(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 text-center shadow-2xl border">
              <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center border bg-white rounded-2xl shadow">
                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${roommateToEvict.name}`} className="w-16 h-16 rounded-xl" alt="avatar" />
              </div>
              <h3 className="text-2xl font-black mb-2">Remove Resident?</h3>
              <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">Are you absolutely certain you want to remove <span className="text-rose-600 font-black">{roommateToEvict.name}</span> from this apartment group?</p>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setRoommateToEvict(null)} className="h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold cursor-pointer">Cancel</button>
                <button type="button" onClick={handleEvictRoommate} className="h-14 rounded-2xl bg-rose-600 text-white font-bold cursor-pointer">Yes, Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN PERMISSIONS EXITS MODAL */}
      <AnimatePresence>
        {showAdminExitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setShowAdminExitModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-md w-full relative z-10">
              <h3 className="text-2xl font-black mb-2">Administrative Exit</h3>
              <p className="text-sm font-bold text-slate-400 mb-6">Choose an exit action block to update active database permissions constraints.</p>
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border">
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">Option A: Hand over keys</label>
                  <div className="relative mb-3">
                    <div onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)} className="flex h-12 w-full rounded-xl bg-white border items-center justify-between px-4 font-bold cursor-pointer text-sm text-slate-700 select-none">
                      <div className="flex items-center gap-2.5">
                        {selectedTransferTarget ? (() => {
                          const matchObj = household.members?.find((m: any) => m._id === selectedTransferTarget);
                          return matchObj ? (<> <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${matchObj.name}`} className="w-5 h-5 rounded-full bg-slate-100" alt="avatar" /> <span>{matchObj.name}</span> </>) : <span>Choose successor...</span>;
                        })() : <span className="text-slate-400">Choose successor...</span>}
                      </div>
                      <motion.div animate={{ rotate: isAdminDropdownOpen ? 180 : 0 }} className="text-slate-400"><ChevronDown size={16} /></motion.div>
                    </div>
                    <AnimatePresence>
                      {isAdminDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsAdminDropdownOpen(false)} />
                          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute z-50 left-0 right-0 mt-1.5 bg-white border rounded-xl shadow-xl max-h-40 overflow-y-auto">
                            {household.members?.filter((m: any) => m._id !== user?._id).map((member: any, index: number) => (
                              <div key={member._id || `assign-${index}`} onClick={() => { setSelectedTransferTarget(member._id); setIsAdminDropdownOpen(false); }} className={`flex items-center gap-2.5 px-4 py-2.5 font-bold cursor-pointer text-sm ${selectedTransferTarget === member._id ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50"}`}>
                                <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} className="w-6 h-6 rounded-full bg-slate-100" alt="avatar" />
                                <span>{member.name}</span>
                              </div>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  <button type="button" disabled={!selectedTransferTarget} onClick={executeTransferAndLeave} className="w-full h-11 bg-slate-900 text-white text-sm font-bold rounded-xl disabled:bg-slate-200 cursor-pointer">Assign & Resign</button>
                </div>
                <div className="relative flex py-2 items-center text-slate-300">
                  <div className="flex-grow border-t"></div> <span className="mx-4 text-xs font-black uppercase text-slate-400">Or</span> <div className="flex-grow border-t"></div>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <label className="block text-xs font-black uppercase text-rose-500 mb-1">Option B: Dissolve Room</label>
                  <button type="button" onClick={() => { setShowAdminExitModal(false); setShowDissolveModal(true); }} className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-600/10 cursor-pointer">Delete Room for Everyone</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NUCLEAR DISSOLVE OVERLAY WARNING */}
      <AnimatePresence>
        {showDissolveModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDissolveModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }} className="bg-white rounded-[2.5rem] p-8 max-w-md w-full relative z-10 border-2 border-rose-100 text-center shadow-2xl">
              <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-600/20"><Trash2 size={32} /></div>
              <h3 className="text-3xl font-black tracking-tighter mb-3">Dissolve Apartment?</h3>
              <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">This action is permanent. All chore tracking charts, balance splits, and historical data logs will be completely wiped from the cloud infrastructure.</p>
              <div className="space-y-3">
                <button type="button" onClick={executeNuclearDelete} className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-lg shadow-lg cursor-pointer">Yes, Dissolve Space</button>
                <button type="button" onClick={() => setShowDissolveModal(false)} className="w-full h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold cursor-pointer">Cancel, Keep Active</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}