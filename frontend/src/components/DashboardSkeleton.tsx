import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  const glassCardClass = "bg-white/80 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white space-y-4";

  return (
    <div className="min-h-screen font-sans flex flex-col relative overflow-clip text-slate-900 bg-slate-50/50">
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-20 w-full z-10 space-y-8">
        
        {/* 🏠 HERO IMAGE BANNER SKELETON */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full h-72 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-md bg-slate-200/60 p-10 flex flex-col justify-end"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 items-start w-full">
            <div className="space-y-3 w-1/2">
              <Skeleton className="h-10 w-3/4 bg-slate-300 rounded-2xl" />
              <Skeleton className="h-5 w-1/2 bg-slate-300/70 rounded-xl" />
            </div>
            <Skeleton className="h-13 w-40 bg-slate-300 rounded-2xl" />
          </div>
          <div className="absolute top-6 right-6 p-4 rounded-2xl flex flex-col items-center space-y-2">
            <Skeleton className="h-4 w-16 bg-slate-300" />
            <Skeleton className="h-10 w-24 bg-slate-300 rounded-xl" />
          </div>
        </motion.div>

        {/* 📊 CHARTS PIPELINE GRID SKELETON */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className={glassCardClass}>
            <div className="flex items-center gap-3 mb-6">
              <Skeleton className="w-12 h-12 rounded-2xl bg-slate-200" />
              <Skeleton className="h-6 w-40 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-56 w-full flex items-end gap-4 px-4 pt-4">
              <Skeleton className="h-[40%] w-full bg-slate-200/80 rounded-t-xl" />
              <Skeleton className="h-[75%] w-full bg-slate-200/80 rounded-t-xl" />
              <Skeleton className="h-[50%] w-full bg-slate-200/80 rounded-t-xl" />
            </div>
          </div>

          <div className={glassCardClass}>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-12 h-12 rounded-2xl bg-slate-200" />
              <Skeleton className="h-6 w-40 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-56 w-full flex items-center justify-center">
              <div className="relative w-44 h-44 rounded-full border-[16px] border-slate-100 flex items-center justify-center animate-pulse">
                <div className="flex flex-col items-center space-y-1">
                  <Skeleton className="h-7 w-8 bg-slate-200" />
                  <Skeleton className="h-3 w-12 bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🧹 WORKFLOWS & ACTIVITY FEED SKELETON */}
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <div className={glassCardClass}>
              <Skeleton className="h-6 w-32 bg-slate-200 rounded-md" />
              <Skeleton className="h-14 w-full bg-slate-100 rounded-2xl" />
              <Skeleton className="h-14 w-full bg-slate-100 rounded-2xl" />
              <Skeleton className="h-14 w-full bg-slate-900/10 rounded-2xl" />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-7 w-44 bg-slate-200 rounded-lg" />
            </div>
            <div className={glassCardClass + " !p-6 flex items-center gap-4"}>
              <Skeleton className="w-12 h-12 rounded-2xl bg-slate-100 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3 bg-slate-200 rounded-md" />
                <Skeleton className="h-4 w-1/4 bg-slate-100 rounded-sm" />
              </div>
              <Skeleton className="h-6 w-16 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}