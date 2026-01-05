import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti"; // Import de la librairie de confettis

interface MoodSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const moods = [
  { score: 1, label: "Terrible", emoji: "⛈️", color: "bg-mood-1 hover:bg-mood-1/80" },
  { score: 2, label: "Mauvais", emoji: "☔️", color: "bg-mood-2 hover:bg-mood-2/80" },
  { score: 3, label: "Neutre", emoji: "😐", color: "bg-mood-3 hover:bg-mood-3/80" },
  { score: 4, label: "Bien", emoji: "😊", color: "bg-mood-4 hover:bg-mood-4/80" },
  { score: 5, label: "Excellent", emoji: "😁", color: "bg-mood-5 hover:bg-mood-5/80" },
];

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  
  const handleMoodChange = (score: number) => {
    onChange(score);

    // Si le score est 5 (Excellent), on déclenche l'explosion d'étoiles
    if (score === 5) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = 500; // Durée de l'effet
        const particleCount = 50;

        // Configuration de l'explosion d'étoiles
        confetti({
          particleCount,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: randomInRange(0.1, 0.9),
            y: Math.random() - 0.2
          },
          colors: ['#FFD700', '#E9D5FF', '#FFFFFF'], // Or, Violet, Blanc
          shapes: ['star'], // Forme d'étoile
          scalar: 1.2, // Taille des particules
          disableForReducedMotion: true
        });

        // Arrêt de l'animation simple (un seul coup pour l'instant)
        clearInterval(interval);
      }, 250);
      
      // On lance aussi un coup immédiat centré
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#E9D5FF'],
        shapes: ['star'],
      });
    }
  };

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
            onClick={() => handleMoodChange(mood.score)}
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