import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isValid, getDay } from "date-fns";

interface Entry {
  id: string;
  date: string;
  mood_score: number;
}

interface PixelGridProps {
  entries: Entry[];
  currentDate: Date;
  onDayClick: (date: Date, entry?: Entry) => void;
}

const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function PixelGrid({ entries, currentDate, onDayClick }: PixelGridProps) {
  const days = useMemo(() => {
    const baseDate = isValid(currentDate) ? currentDate : new Date();
    return eachDayOfInterval({
      start: startOfMonth(baseDate),
      end: endOfMonth(baseDate),
    });
  }, [currentDate]);

  const entryMap = useMemo(() => {
    const map = new Map<string, Entry>();
    entries.forEach((entry) => {
      if (!entry.date) return;
      const d = new Date(entry.date);
      if (isValid(d)) {
        map.set(format(d, "yyyy-MM-dd"), entry);
      }
    });
    return map;
  }, [entries]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-[12px] font-black text-center uppercase mb-2">
            {day}
          </div>
        ))}

        {Array.from({ length: getDay(days[0]) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const entry = entryMap.get(dateKey);
          const isToday = isSameDay(day, new Date());
          const score = entry ? Number(entry.mood_score) : null;

          return (
            <button
              key={dateKey}
              onClick={() => onDayClick(day, entry)}
              className={cn(
                "pixel-cell aspect-square flex items-center justify-center relative",
                score ? `mood-${score}` : "bg-white border-2 border-black",
                isToday && "ring-4 ring-orange-500 z-10"
              )}
            >
              <span className="text-[10px] font-black uppercase">
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}