import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isValid,
  getDay 
} from "date-fns";

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

const moodColorClasses: Record<number, string> = {
  1: "bg-mood-1",
  2: "bg-mood-2",
  3: "bg-mood-3",
  4: "bg-mood-4",
  5: "bg-mood-5",
};

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
      map.set(entry.date, entry);
    });
    return map;
  }, [entries]);

  return (
    <div className="w-full">
      {/* En-tête des jours */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDays.map(day => (
          <div key={day} className="text-[12px] font-black text-center uppercase tracking-tighter">
            {day}
          </div>
        ))}
      </div>

      {/* Grille des pixels */}
      <div className="grid grid-cols-7 gap-2">
        {/* Espaces vides pour décaler le premier jour du mois */}
        {days.length > 0 && Array.from({ length: getDay(days[0]) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const entry = entryMap.get(dateKey);
          const isToday = isSameDay(day, new Date());
          const score = entry?.mood_score ? Number(entry.mood_score) : null;
          
          // Logique simple : couleur du mood ou blanc par défaut
          const colorClass = score ? moodColorClasses[score] : "bg-white";

          return (
            <motion.button
              key={dateKey}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDayClick(day, entry)}
              className={cn(
                "pixel-cell aspect-square flex items-center justify-center relative transition-all border-2 border-black/5",
                colorClass,
                // Bordure orange pour aujourd'hui
                isToday && "ring-4 ring-orange-500 ring-inset z-10"
              )}
            >
              <span className="text-[10px] font-black uppercase pointer-events-none">
                {format(day, "d")}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}