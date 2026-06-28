import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Moon, Award, TrendingUp, Plus, Trash2 } from "lucide-react"; // ✅ Added Trash2 import
import { Input } from "@/components/ui/input";

export default function ReportAndCalendar({ glassCardClass }: { glassCardClass: string }) {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [report, setReport] = useState<any>({ choreRankings: [], financialRankings: [] });
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"event" | "quiet_hours">("event");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const [resEvents, resReport] = await Promise.all([
        fetch("http://localhost:5000/api/events", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5000/api/reports/monthly-summary", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      if (resEvents.ok) setSchedule(await resEvents.json());
      if (resReport.ok) setReport(await resReport.json());
    } catch (err) { console.error("Error connecting metrics streams:", err); }
  };

  const handlePostSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title, type, startDate, endDate })
      });
      if (res.ok) {
        setSchedule(await res.json());
        setTitle(""); setStartDate(""); setEndDate("");
      }
    } catch (err) { console.error(err); }
  };

  // ✅ NEW: Frontend delete request handler pipeline
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const remainingData = await res.json();
        setSchedule(remainingData); // Instantly clean your state array natively
      }
    } catch (err) {
      console.error("Failed to drop calendar node entity:", err);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 mt-8">
      {/* HOUSE SCHEDULE & QUIET HOURS PORTAL */}
      <div className="lg:col-span-5 space-y-6">
        <div className={glassCardClass}>
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> Roommate Scheduler
          </h2>
          <form onSubmit={handlePostSchedule} className="space-y-4">
            <Input placeholder="Event title or context..." required value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl bg-slate-50 font-bold" />
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setType("event")} className={`h-11 rounded-xl font-bold text-sm ${type === "event" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>🎉 Event</button>
              <button type="button" onClick={() => setType("quiet_hours")} className={`h-11 rounded-xl font-bold text-sm ${type === "quiet_hours" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>🌙 Quiet Hours</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-black uppercase text-slate-400">
              <div>
                <label className="block mb-1 pl-1">Start</label>
                <Input type="datetime-local" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="block mb-1 pl-1">End</label>
                <Input type="datetime-local" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>
            <button type="submit" className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"><Plus size={16} /> Update House Feed</button>
          </form>
        </div>

        {/* ACTIVE TIMELINE STREAM */}
        <div className={`${glassCardClass} max-h-64 overflow-y-auto space-y-3`}>
          {schedule.length === 0 ? (
            <p className="text-center text-slate-400 text-xs font-bold py-4">No events booked for this house.</p>
          ) : (
            schedule.map((item) => (
              <div key={item._id} className={`p-3.5 rounded-xl border flex items-center justify-between ${item.type === "quiet_hours" ? "bg-slate-950 text-white" : "bg-white text-slate-900"}`}>
                <div className="flex items-center gap-3">
                  {item.type === "quiet_hours" ? <Moon size={16} className="text-amber-400" /> : <Calendar size={16} className="text-indigo-500" />}
                  <div>
                    <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                    <span className="text-[10px] font-bold opacity-60">By {item.postedBy?.name}</span>
                  </div>
                </div>
                
                {/* ✅ FIXED: High contrast delete action trigger layer button */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-black opacity-80">{new Date(item.startDate).toLocaleDateString()}</span>
                  <button 
                    onClick={() => handleDeleteEvent(item._id)}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      item.type === "quiet_hours" ? "text-slate-400 hover:text-rose-400 hover:bg-white/10" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    }`}
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 30-DAY HOUSE REPORT CARD PANEL */}
      <div className="lg:col-span-7">
        <div className={glassCardClass + " h-full flex flex-col justify-between"}>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2 flex items-center gap-2">
              <Award className="text-amber-500" /> 30-Day House Report Card
            </h2>
            <p className="text-sm font-bold text-slate-400 mb-6 leading-relaxed">Aggregated performance and contribution diagnostics for your shared space layout.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1"><Award size={14} /> Chores Completed</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.choreRankings}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} tick={{ fontWeight: 800 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1"><TrendingUp size={14} /> Total Investment (₹)</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.financialRankings}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} tick={{ fontWeight: 800 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}