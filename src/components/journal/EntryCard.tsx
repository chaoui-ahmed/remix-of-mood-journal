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
    created_at: string; 
  };
  onClick?: () => void;
}

const moodClasses: Record<number, string> = {
  1: "border-l-mood-1",
  2: "border-l-mood-2",
  3: "border-l-mood-3",
  4: "border-l-mood-4",
  5: "border-l-mood-5",
};

const moodEmojis: Record<number, string> = {
  1: "😫",
  2: "😞",
  3: "😐",
  4: "😌",
  5: "🤩",
};

export function EntryCard({ entry, onClick }: EntryCardProps) {
  // Préparation sécurisée de la date pour éviter le "RangeError: Invalid time value"
  // On crée l'objet Date et on vérifie s'il est valide avant l'affichage
  const dateObj = new Date(entry.date);
  const isDateValid = entry.date && isValid(dateObj);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: -2, y: -2 }}
      onClick={onClick}
      className={cn(
        "bg-card border border-border shadow-brutal p-4 cursor-pointer transition-all duration-150",
        "hover:shadow-brutal-hover border-l-4",
        moodClasses[entry.mood_score] || "border-l-gray-400"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {isDateValid 
              ? format(new Date(entry.created_at), "d MMMM yyyy", { locale: fr }) 
              : "Date inconnue"} 
          </span>
        </div>
        <span className="text-2xl">{moodEmojis[entry.mood_score] || "❓"}</span>
      </div>

      <p className="text-foreground line-clamp-3 mb-3">
        {entry.content || "Aucun contenu écrit..."}
      </p>

      {entry.hashtags && entry.hashtags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Hash className="w-3 h-3 text-muted-foreground" />
          {entry.hashtags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium bg-mood-5/50 px-2 py-0.5 border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}