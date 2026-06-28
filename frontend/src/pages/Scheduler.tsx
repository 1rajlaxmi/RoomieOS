import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Moon, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Scheduler() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"event" | "quiet_hours">("event");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/events", { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) setSchedule(await res.json());
        } catch (err) { console.error(err); }
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

    const handleDeleteEvent = async (eventId: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) setSchedule(await res.json());
        } catch (err) { console.error(err); }
    };

    return (
        <main className="max-w-4xl mx-auto px-4 pt-28 pb-20 w-full">
<motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="grid md:grid-cols-12 gap-8"
      >
                <div className="md:col-span-5 bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-xl border border-white">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Calendar className="text-indigo-600" /> Book Time</h2>
                    <form onSubmit={handlePostSchedule} className="space-y-4">
                        <Input placeholder="Event title..." required value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-xl bg-slate-50 font-bold px-4" />
                        <div className="grid grid-cols-2 gap-3">
                            <button type="button" onClick={() => setType("event")} className={`h-11 rounded-xl font-bold text-sm ${type === "event" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>🎉 Event</button>
                            <button type="button" onClick={() => setType("quiet_hours")} className={`h-11 rounded-xl font-bold text-sm ${type === "quiet_hours" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>🌙 Quiet</button>
                        </div>
                        <div className="space-y-3 text-xs font-black uppercase text-slate-400">
                            <div><label className="block mb-1">Start Time</label><Input type="datetime-local" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 rounded-xl" /></div>
                            <div><label className="block mb-1">End Time</label><Input type="datetime-local" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 rounded-xl" /></div>
                        </div>
                        <button type="submit" className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"><Plus size={16} /> Save Entry</button>
                    </form>
                </div>

                <div className="md:col-span-7 bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-xl border border-white max-h-[500px] overflow-y-auto space-y-4">
                    <h2 className="text-xl font-black flex items-center gap-2">Active House Feed</h2>
                    {schedule.length === 0 ? (
                        <p className="text-slate-400 text-sm font-bold py-6">No scheduled items found.</p>
                    ) : (
                        schedule.map((item) => (
                            <div key={item._id} className={`p-4 rounded-xl border flex items-center justify-between ${item.type === "quiet_hours" ? "bg-slate-950 text-white border-transparent" : "bg-white border-slate-100"}`}>
                                <div className="flex items-center gap-3">
                                    {item.type === "quiet_hours" ? <Moon size={16} className="text-amber-400" /> : <Calendar size={16} className="text-indigo-500" />}
                                    <div>
                                        <h4 className="text-sm font-black">{item.title}</h4>
                                        <span className="text-[10px] opacity-60 font-bold">By {item.postedBy?.name}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono font-bold opacity-80">{new Date(item.startDate).toLocaleDateString()}</span>
                                    <button onClick={() => handleDeleteEvent(item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </main>
    );
}