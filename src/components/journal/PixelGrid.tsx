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
import { fr } from "date-fns/locale";

interface Entry {
  id: string;
  date: string; // ✅ On utilise bien 'date'
  mood_score: number;
}

interface PixelGridProps {
  entries: Entry[];
  currentDate: Date; // ✅ C'est cette variable qui manquait ou était mal nommée
  onDayClick: (date: Date, entry?: Entry) => void;
}

// Couleurs pastels
const moodClasses: Record<number, string> = {
  1: "bg-mood-1",
  2: "bg-mood-2",
  3: "bg-mood-3",
  4: "bg-mood-4",
  5: "bg-mood-5",
};

const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function PixelGrid({ entries, currentDate, onDayClick }: PixelGridProps) {
  // 1. Calcul des jours du mois reçu en prop (currentDate)
  const days = useMemo(() => {
    // Sécurité : si currentDate est invalide, on prend aujourd'hui
    const baseDate = isValid(currentDate) ? currentDate : new Date();
    return eachDayOfInterval({
      start: startOfMonth(baseDate),
      end: endOfMonth(baseDate),
    });
  }, [currentDate]);

  // 2. Map des entrées
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
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {/* Jours de la semaine */}
        {weekDays.map(day => (
          <div key={day} className="text-[10px] font-bold text-center uppercase text-muted-foreground mb-2">
            {day}
          </div>
        ))}

        {/* Espaces vides pour le début du mois */}
        {days.length > 0 && Array.from({ length: getDay(days[0]) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Les Pixels */}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const entry = entryMap.get(dateKey);
          const isToday = isSameDay(day, new Date());
          const score = entry ? Number(entry.mood_score) : null;

          return (
            <motion.button
              key={dateKey}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDayClick(day, entry)}
              className={cn(
                "aspect-square rounded-xl transition-all duration-300 relative flex items-center justify-center",
                score ? moodClasses[score] : "bg-white/40 border-2 border-dashed border-gray-200/50 hover:border-gray-300",
                isToday && !entry && "ring-2 ring-pink-400 ring-offset-2 ring-offset-white/0",
                entry && "shadow-sm"
              )}
            >
              <span className={cn(
                "text-[10px] font-bold",
                entry ? "text-black/70" : "text-gray-300"
              )}>
                {format(day, "d")}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}