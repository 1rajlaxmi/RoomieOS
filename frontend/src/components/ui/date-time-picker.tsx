import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DateTimePicker({ date, setDate, placeholder = "Select date & time" }: DateTimePickerProps) {
  // Classic 1-12 Hours configuration
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  // Practical standard minutes intervals
  const minutes = ["00", "15", "30", "45"];

  // Determine current 12-hour state mappings from active Date instance
  const get12HourState = () => {
    if (!date) return { hour: "12", minute: "00", period: "PM" };
    let rawHours = date.getHours();
    const period = rawHours >= 12 ? "PM" : "AM";
    let hour12 = rawHours % 12;
    if (hour12 === 0) hour12 = 12;
    
    return {
      hour: hour12.toString().padStart(2, "0"),
      minute: (Math.round(date.getMinutes() / 15) * 15).toString().padStart(2, "0"),
      period
    };
  };

  const { hour: currentHour, minute: currentMinute, period: currentPeriod } = get12HourState();

  const updateDateTime = (newHour: string, newMinute: string, newPeriod: string) => {
    const baseDate = date ? new Date(date) : new Date();
    let internal24Hour = parseInt(newHour, 10);
    
    if (newPeriod === "PM" && internal24Hour !== 12) internal24Hour += 12;
    if (newPeriod === "AM" && internal24Hour === 12) internal24Hour = 0;

    baseDate.setHours(internal24Hour);
    baseDate.setMinutes(parseInt(newMinute, 10));
    baseDate.setSeconds(0);
    setDate(baseDate);
  };

  return (
    <div className="space-y-3 w-full font-sans">
      {/* 📅 ROW 1: PREMIUM FULL-WIDTH DATE SELECTOR BUTTON */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-black h-13 rounded-2xl bg-slate-50/60 border-slate-200/60 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-slate-800",
              !date && "text-slate-400"
            )}
          >
            <CalendarIcon className="mr-3 h-5 w-5 text-indigo-500" strokeWidth={2.5} />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white rounded-3xl border border-slate-100 shadow-2xl" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d: any) => {
              if (!d) return;
              const nextDate = new Date(d);
              if (date) {
                nextDate.setHours(date.getHours(), date.getMinutes());
              }
              setDate(nextDate);
            }}
            className="p-4"
          />
        </PopoverContent>
      </Popover>

      {/* ⏰ ROW 2: CLEAN INTEGRATED 12-HOUR TIME SELECT PANEL */}
      <div className="flex items-center justify-between bg-slate-50/60 border border-slate-200/60 rounded-2xl h-13 px-4 w-full shadow-inner">
        <div className="flex items-center gap-2">
          <Clock className="text-slate-400 h-4 w-4" strokeWidth={2.5} />
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Select Time</span>
        </div>

        <div className="flex items-center gap-1 font-bold text-slate-800">
          {/* HOUR OPTIONS GRID */}
          <Select value={currentHour} onValueChange={(val) => updateDateTime(val, currentMinute, currentPeriod)}>
            <SelectTrigger className="border-none bg-transparent shadow-none font-black text-slate-800 p-1 h-auto focus:ring-0 text-sm cursor-pointer">
              <SelectValue placeholder="12" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl max-h-48 border border-slate-100 shadow-xl">
              {hours.map((h) => (
                <SelectItem key={h} value={h} className="font-bold text-slate-700">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-slate-400 font-bold px-0.5">:</span>

          {/* MINUTE OPTIONS GRID */}
          <Select value={minutes.includes(currentMinute) ? currentMinute : "00"} onValueChange={(val) => updateDateTime(currentHour, val, currentPeriod)}>
            <SelectTrigger className="border-none bg-transparent shadow-none font-black text-slate-800 p-1 h-auto focus:ring-0 text-sm cursor-pointer">
              <SelectValue placeholder="00" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl border border-slate-100 shadow-xl">
              {minutes.map((m) => (
                <SelectItem key={m} value={m} className="font-bold text-slate-700">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AM / PM RADIAL PERIOD BLOCK */}
          <div className="ml-3 flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200/20">
            {["AM", "PM"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => updateDateTime(currentHour, currentMinute, p)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider transition-all cursor-pointer",
                  currentPeriod === p 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}