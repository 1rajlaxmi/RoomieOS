import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Moon, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker"; // 🚀 Clean Import Linked
import { apiRequest } from "@/services/api"; // Bonus: Using your global API helper to drop hardcoded URLs!

export default function Scheduler() {
    const [schedule, setSchedule] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [type, setType] = useState<"event" | "quiet_hours">("event");

    // ✅ REMOVED: Old duplicate string values (startDate, endDate) are gone.
    // ✅ RETAINED: Strict Date instances managed directly by your Shadcn picker engine
    const [startTime, setStartTime] = useState<Date | undefined>(new Date());
    const [endTime, setEndTime] = useState<Date | undefined>(new Date(Date.now() + 3600000));

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const data = await apiRequest("/events", { method: "GET" });
            if (data) setSchedule(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // ✅ UPDATED: Forwards the JS Date strings directly to match your original backend schema properties
            const data = await apiRequest("/events", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    type,
                    startDate: startTime?.toISOString(),
                    endDate: endTime?.toISOString()
                })
            });

            if (data) {
                setSchedule(data);
                setTitle("");
                setStartTime(new Date());
                setEndTime(new Date(Date.now() + 3600000));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            const data = await apiRequest(`/events/${eventId}`, { method: "DELETE" });
            if (data) setSchedule(data);
        } catch (err) {
            console.error(err);
        }
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
                    <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                        <Calendar className="text-indigo-600" /> Book Time
                    </h2>
                    <form onSubmit={handlePostSchedule} className="space-y-4">
                        <Input
                            placeholder="Event title..."
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 rounded-xl bg-slate-50 font-bold px-4"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType("event")}
                                className={`h-11 rounded-xl font-bold text-sm cursor-pointer ${type === "event" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"}`}
                            >
                                🎉 Event
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("quiet_hours")}
                                className={`h-11 rounded-xl font-bold text-sm cursor-pointer ${type === "quiet_hours" ? "bg-slate-900 text-white shadow-md shadow-black/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200/60"}`}
                            >
                                🌙 Quiet
                            </button>
                        </div>

                        {/* ✅ UPDATED INTERFACE: Dropped raw inputs and mapped Shadcn popover blocks */}
                        <div className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">Start Time</label>
                                <div className="w-full">
                                    <DateTimePicker date={startTime} setDate={setStartTime} placeholder="Pick start window" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">End Time</label>
                                <div className="w-full">
                                    <DateTimePicker date={endTime} setDate={setEndTime} placeholder="Pick completion target" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="w-full h-12 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors">
                            <Plus size={16} /> Save Entry
                        </button>
                    </form>
                </div>

                {/* ACTIVE HOUSE FEED CONTENT */}
                <div className="md:col-span-7 bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-xl border border-white max-h-[500px] overflow-y-auto space-y-4">
                    <h2 className="text-xl font-black flex items-center gap-2">Active House Feed</h2>
                    {schedule.length === 0 ? (
                        <p className="text-slate-400 text-sm font-bold py-6">No scheduled items found.</p>
                    ) : (
                        schedule.map((item) => (
                            <div key={item._id} className={`p-4 rounded-xl border flex items-center justify-between ${item.type === "quiet_hours" ? "bg-slate-950 text-white border-transparent shadow-lg shadow-black/5" : "bg-white border-slate-100 shadow-sm"}`}>
                                <div className="flex items-center gap-3">
                                    {item.type === "quiet_hours" ? <Moon size={16} className="text-amber-400" /> : <Calendar size={16} className="text-indigo-500" />}
                                    <div>
                                        <h4 className="text-sm font-black">{item.title}</h4>
                                        <span className="text-[10px] opacity-60 font-bold">By {item.postedBy?.name || "Roommate"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono font-bold opacity-80">
                                        {new Date(item.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <button onClick={() => handleDeleteEvent(item._id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </main>
    );
}