import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Award, TrendingUp } from "lucide-react";


export default function ReportCard() {
  const [report, setReport] = useState<any>({ choreRankings: [], financialRankings: [] });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:5000/api/reports/monthly-summary", { headers: { "Authorization": `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setReport(data))
      .catch(err => console.error(err));
  }, [token]);

  return (
    <main className="max-w-5xl mx-auto px-4 pt-28 pb-20 w-full">
      {/* ✅ FIXED: Changed variants reference name here */}
      <motion.div 
      initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl border border-white space-y-10">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2"><Award className="text-amber-500" /> 30-Day House Report Card</h2>
          <p className="text-slate-400 font-bold text-sm mt-1">Aggregated contribution diagnostics for your shared living setup space.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1.5"><Award size={16} /> Chores Checked Off</h3>
            <div className="h-64 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.choreRankings}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1.5"><TrendingUp size={16} /> Total Financial Investment</h3>
            <div className="h-64 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.financialRankings}>
                  <XAxis dataKey="name" fontSize={11} tickLine={false} tick={{ fontWeight: 800, fill: '#64748b' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}