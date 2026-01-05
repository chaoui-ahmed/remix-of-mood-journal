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
  date: string;
  mood_score: number;
}

interface PixelGridProps {
  entries: Entry[];
  currentDate: Date; // ✅ On ajoute cette prop
  onDayClick: (date: Date, entry?: Entry) => void;
}

const moodClasses: Record<number, string> = {
  1: "bg-mood-1",
  2: "bg-mood-2",
  3: "bg-mood-3",
  4: "bg-mood-4",
  5: "bg-mood-5",
};

const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function PixelGrid({ entries, currentDate, onDayClick }: PixelGridProps) {
  // 1. Calcul des jours basé sur currentDate (le mois choisi)
  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate), // ✅ Utilise currentDate au lieu de new Date()
      end: endOfMonth(currentDate),
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
      {/* J'ai retiré le titre du mois ici car on l'a mis dans Index.tsx avec les flèches */}
      
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {weekDays.map(day => (
          <div key={day} className="text-[10px] font-bold text-center uppercase text-muted-foreground mb-2">
            {day}
          </div>
        ))}

        {/* Espaces vides pour le début du mois */}
        {Array.from({ length: getDay(days[0]) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const entry = entryMap.get(dateKey);
          const isToday = isSameDay(day, new Date()); // Reste vrai "aujourd'hui" même si on regarde un autre mois
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
                isToday && !entry && "ring-2 ring-pink-400 ring-offset-2 ring-offset-white/0", // Anneau rose si c'est aujourd'hui
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