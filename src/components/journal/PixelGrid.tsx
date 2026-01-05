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
  created_at: string;
  mood_score: number;
}

interface PixelGridProps {
  entries: Entry[];
  onDayClick: (date: Date, entry?: Entry) => void;
}

// Mapping des couleurs vers vos variables CSS de thème
const moodClasses: Record<number, string> = {
  1: "bg-mood-1 border-black",
  2: "bg-mood-2 border-black",
  3: "bg-mood-3 border-black",
  4: "bg-mood-4 border-black",
  5: "bg-mood-5 border-black",
};

const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function PixelGrid({ entries, onDayClick }: PixelGridProps) {
  // 1. On génère uniquement les jours du mois en cours
  const days = useMemo(() => {
    const now = new Date();
    return eachDayOfInterval({
      start: startOfMonth(now),
      end: endOfMonth(now),
    });
  }, []);

  // 2. On prépare les données (Map) avec vérification de validité
  const entryMap = useMemo(() => {
    const map = new Map<string, Entry>();
    entries.forEach((entry) => {
      if (!entry.date) return; // ✅ Utilisation de .date au lieu de .created_at
      const d = new Date(entry.date);
      if (isValid(d)) {
        map.set(format(d, "yyyy-MM-dd"), entry);
      }
    });
    return map;
  }, [entries]);

  return (
    <div className="p-6 bg-card border-2 border-black shadow-brutal mb-8">
      {/* En-tête du mois */}
      <h3 className="text-2xl font-black mb-6 uppercase italic">
        {format(new Date(), "MMMM yyyy", { locale: fr })}
      </h3>
      
      <div className="grid grid-cols-7 gap-3">
        {/* Noms des jours */}
        {weekDays.map(day => (
          <div key={day} className="text-xs font-bold text-center uppercase text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Décalage pour le premier jour du mois */}
        {Array.from({ length: getDay(days[0]) }).map((_, i) => (
          <div key={`empty-${i}`} className="w-full aspect-square border-2 border-transparent" />
        ))}

        {/* Les cases du calendrier */}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const entry = entryMap.get(dateKey);
          const isToday = isSameDay(day, new Date());
          
          // Conversion forcée en nombre pour la sécurité
          const score = entry ? Number(entry.mood_score) : null;

          return (
            <motion.button
              key={dateKey}
              whileHover={{ scale: 1.1, rotate: 1 }}
              onClick={() => onDayClick(day, entry)}
              className={cn(
                "aspect-square border-2 transition-all relative flex items-center justify-center",
                score ? moodClasses[score] : "bg-white border-dashed border-gray-200",
                isToday ? "border-black border-4 shadow-brutal-sm" : "border-black"
              )}
            >
              <span className={cn(
                "text-[10px] font-black",
                entry ? "text-black" : "text-gray-300"
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