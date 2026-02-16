import React from "react";
import { motion } from "framer-motion";
import { Clock, ChevronDown } from "lucide-react";

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ label, value, onChange }) => {
  const [hours, minutes] = value.split(":");

  const updateHours = (h: string) => {
    onChange(`${h.padStart(2, "0")}:${minutes}`);
  };

  const updateMinutes = (m: string) => {
    onChange(`${hours}:${m.padStart(2, "0")}`);
  };

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1 truncate">
        {label}
      </span>
      <div className="group relative flex items-center bg-white border border-stone-200 rounded-xl p-0.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-50 focus-within:border-orange-200">
        <div className="flex-1 flex items-center justify-center py-1 overflow-hidden">
          {/* Hours Selection */}
          <div className="relative flex items-center">
            <select
              value={hours}
              onChange={(e) => updateHours(e.target.value)}
              className="appearance-none bg-transparent text-sm font-bold text-stone-700 outline-none cursor-pointer pr-3 pl-1.5 py-0.5 z-10 font-mono"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i.toString().padStart(2, "0")}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
            <ChevronDown
              size={8}
              className="absolute right-0 text-stone-300 group-focus-within:text-orange-400 pointer-events-none"
            />
          </div>

          <span className="text-stone-300 font-bold mx-0.5">:</span>

          {/* Minutes Selection */}
          <div className="relative flex items-center">
            <select
              value={minutes}
              onChange={(e) => updateMinutes(e.target.value)}
              className="appearance-none bg-transparent text-sm font-bold text-stone-700 outline-none cursor-pointer pr-3 pl-1.5 py-0.5 z-10 font-mono"
            >
              {["00", "15", "30", "45"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown
              size={8}
              className="absolute right-0 text-stone-300 group-focus-within:text-orange-400 pointer-events-none"
            />
          </div>
        </div>

        <div className="pr-1.5 pl-1 border-l border-stone-50 hidden xs:block">
          <Clock
            size={12}
            className="text-stone-300 group-focus-within:text-orange-400 transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default TimePicker;
