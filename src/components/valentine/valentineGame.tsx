import { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function ValentineGame() {
  const [isOpen, setIsOpen] = useState(false);
  // 5 pétales (impair) pour garantir que le dernier pétale est "OUI"
  const [petals, setPetals] = useState([1, 2, 3, 4, 5]); 
  const [pluckedCount, setPluckedCount] = useState(0);
  const [message, setMessage] = useState("Effeuille la fleur...");
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const today = new Date();
    // Activation : du 9 au 15 Février
    const isValentineWeek = today.getMonth() === 1 && today.getDate() >= 9 && today.getDate() <= 15;
    const hasDoneGame = localStorage.getItem("valentine_game_done");

    // S'ouvre automatiquement si c'est la semaine ET que le jeu n'a pas été fini
    if (isValentineWeek && !hasDoneGame) {
      setIsOpen(true);
    }
  }, []);

  const pluckPetal = (id: number) => {
    const newCount = pluckedCount + 1;
    setPluckedCount(newCount);
    
    // Animation CSS
    const petalElement = document.getElementById(`petal-${id}`);
    if (petalElement) petalElement.classList.add('petal-fall');

    // Délai pour laisser l'animation se jouer avant de retirer le pétale du DOM
    setTimeout(() => {
      setPetals(prev => prev.filter(p => p !== id));
      
      // Alternance des messages
      const currentStatus = newCount % 2 !== 0 ? "OUI ! ❤️" : "NON... 💔";
      setMessage(currentStatus);

      // Fin du jeu
      if (petals.length === 1) {
        setIsFinished(true);
        setMessage("OUI ! Tu es ma Valentine ! 💖");
        localStorage.setItem("valentine_game_done", "true");
      }
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white card-brutal max-w-md w-full p-8 text-center relative overflow-hidden">
        {!isFinished && (
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <h2 className="text-2xl font-black uppercase mb-12 text-pink-600">
          Veux-tu être ma Valentine ?
        </h2>

        <div className="relative h-56 w-56 mx-auto mb-12 flex items-center justify-center">
          {/* Cœur central de la fleur */}
          <div className="w-20 h-20 bg-yellow-400 rounded-full border-4 border-black z-20 shadow-brutal-sm flex items-center justify-center">
             <Heart className={cn("w-10 h-10 transition-colors duration-300", isFinished ? "fill-red-500 text-red-500 animate-bounce" : "text-black")} />
          </div>

          {/* Les Pétales */}
          {petals.map((id, index) => {
            // Calcul de la position en cercle
            const angle = (index * (360 / petals.length)) * (Math.PI / 180);
            return (
              <button
                key={id}
                id={`petal-${id}`}
                onClick={() => pluckPetal(id)}
                className="absolute w-14 h-24 bg-pink-200 border-2 border-black rounded-full hover:bg-pink-300 z-10 cursor-pointer shadow-brutal-sm"
                style={{
                  // Positionnement autour du centre
                  transform: `rotate(${angle * (180/Math.PI) + 90}deg) translateY(-60px)`,
                  transformOrigin: "bottom center"
                }}
              />
            );
          })}
        </div>

        <div className="bg-black text-white p-3 font-black text-xl uppercase transform -rotate-1 inline-block">
          {message}
        </div>

        {isFinished && (
          <button 
            onClick={() => setIsOpen(false)}
            className="mt-8 btn-brutal bg-pink-500 text-white w-full py-4 text-xl"
          >
            C'EST PROMIS ! 🥰
          </button>
        )}
      </div>
    </div>
  );
}