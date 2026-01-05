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

export function PixelGrid({ entries, currentDate, onDayClick }: PixelGridProps) {
  // 1. Calcul des jours du mois
  const days = useMemo(() => {
    const baseDate = isValid(currentDate) ? currentDate : new Date();
    return eachDayOfInterval({
      start: startOfMonth(baseDate),
      end: endOfMonth(baseDate),
    });
  }, [currentDate]);

  // 2. Map des entrées pour un accès rapide par date
  const entryMap = useMemo(() => {
    const map = new Map<string, Entry>();
    entries.forEach((entry) => {
      if (!entry.date) return;
      // ✅ CORRECTION : On utilise la date string directe (YYYY-MM-DD) comme clé
      // Cela évite les décalages de fuseau horaire qui empêchaient l'affichage des couleurs
      map.set(entry.date, entry);
    });
    return map;
  }, [entries]);

  return (
    <div className="w-full">
      {/* Grille des jours de la semaine */}
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

        {/* Affichage de chaque jour */}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd"); // Format local correspondant à la DB
          const entry = entryMap.get(dateKey);
          const isToday = isSameDay(day, new Date());
          const score = entry ? Number(entry.mood_score) : null;

          return (
            <motion.button
              key={dateKey}
              whileHover={{ scale: 1.1, zIndex: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDayClick(day, entry)}
              className={cn(
                "pixel-cell aspect-square flex items-center justify-center relative transition-colors",
                // ✅ Applique la couleur si 'score' existe, sinon blanc
                score ? `mood-${score}` : "bg-white",
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