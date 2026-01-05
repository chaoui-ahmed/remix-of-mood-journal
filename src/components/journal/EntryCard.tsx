import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, Hash } from "lucide-react";

interface EntryCardProps {
  entry: {
    id: string;
    content: string;
    mood_score: number;
    hashtags: string[];
    // On accepte les deux noms de variables pour éviter le crash
    date?: string;       
    created_at?: string; 
  };
  onClick?: () => void;
}

// Couleurs douces pour la bordure gauche
const moodClasses: Record<number, string> = {
  1: "border-l-mood-1",
  2: "border-l-mood-2",
  3: "border-l-mood-3",
  4: "border-l-mood-4",
  5: "border-l-mood-5",
};

// Les nouveaux emojis "Cute"
const moodEmojis: Record<number, string> = {
  1: "⛈️", 
  2: "☔️", 
  3: "😐", 
  4: "😊", 
  5: "😁",
};



export function EntryCard({ entry, onClick }: EntryCardProps) {
  // 1. Sécurisation de la date (prend 'date' ou 'created_at')
  const rawDate = entry.date || entry.created_at;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const isDateSafe = dateObj && isValid(dateObj);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: -2, y: -2 }}
      onClick={onClick}
      className={cn(
        "bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm p-4 cursor-pointer transition-all duration-300 rounded-2xl",
        "hover:shadow-md hover:bg-white/80 border-l-4",
        // Application de la couleur d'humeur
        moodClasses[entry.mood_score] || "border-l-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {isDateSafe 
              ? format(dateObj!, "d MMMM yyyy", { locale: fr }) 
              : "Date inconnue"}
          </span>
        </div>
        <span className="text-2xl filter drop-shadow-sm">
          {moodEmojis[entry.mood_score] || "😶"}
        </span>
      </div>

      <p className="text-gray-700 line-clamp-3 mb-3 text-sm leading-relaxed font-medium">
        {entry.content || "Contenu vide..."}
      </p>

      {entry.hashtags && entry.hashtags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Hash className="w-3 h-3 text-pink-400" />
          {entry.hashtags.map((tag) => (
            <span key={tag} className="text-[10px] font-bold uppercase tracking-wide text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}