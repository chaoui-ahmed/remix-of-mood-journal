import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MoodSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const moods = [
  { score: 1, label: "Terrible", emoji: "😢", color: "bg-mood-1 hover:bg-mood-1/80" },
  { score: 2, label: "Mauvais", emoji: "😕", color: "bg-mood-2 hover:bg-mood-2/80" },
  { score: 3, label: "Neutre", emoji: "😐", color: "bg-mood-3 hover:bg-mood-3/80" },
  { score: 4, label: "Bien", emoji: "😊", color: "bg-mood-4 hover:bg-mood-4/80" },
  { score: 5, label: "Excellent", emoji: "🤩", color: "bg-mood-5 hover:bg-mood-5/80" },
];

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">Comment te sens-tu ?</label>
      <div className="flex gap-2 flex-wrap">
        {moods.map((mood) => (
          <motion.button
            key={mood.score}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(mood.score)}
            className={cn(
              "flex flex-col items-center gap-1 p-3 border border-border transition-all duration-150 min-w-[70px]",
              mood.color,
              value === mood.score
                ? "shadow-brutal -translate-x-0.5 -translate-y-0.5"
                : "shadow-brutal-sm"
            )}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-xs font-medium">{mood.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
