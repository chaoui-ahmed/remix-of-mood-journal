import { useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScratchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [scratchProgress, setScratchProgress] = useState(0);

  useEffect(() => {
    const today = new Date();
    // Période d'activation : du 8 au 15 Février
    const isValentineWeek = today.getMonth() === 1 && today.getDate() >= 9 && today.getDate() <= 15;
    
    // VÉRIFICATION : Est-ce qu'on a déjà joué ?
    const hasPlayed = localStorage.getItem("scratch_card_played");

    // Si c'est la semaine ET qu'on n'a pas encore joué, on ouvre !
    if (isValentineWeek && !hasPlayed) {
       setIsOpen(true);
    }
  }, []);

  // --- Initialisation du Canvas (Gris à gratter) ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !isOpen) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      
      // Couche grise
      ctx.fillStyle = "#CCCCCC"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Texte sur le gris
      ctx.font = "bold 24px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "#999999";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ GRATTE ICI ✨", canvas.width / 2, canvas.height / 2);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isOpen]);

  // --- Logique de Grattage ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    let isDrawing = false;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = "destination-out"; // Efface le gris
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      // Vérification de la progression pour gagner
      if (Math.random() > 0.1) return; // Optimisation perf
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) transparentPixels++;
      }
      
      const percent = (transparentPixels / (pixels.length / 4)) * 100;
      setScratchProgress(percent);

      if (percent > 40) {
        // VICTOIRE !
        setIsRevealed(true);
        // C'EST ICI QU'ON SAUVEGARDE : On ne réaffichera plus le jeu
        localStorage.setItem("scratch_card_played", "true");
        
        canvas.style.opacity = "0"; // Disparition douce
        canvas.style.pointerEvents = "none";
      }
    };

    const start = (e: any) => { isDrawing = true; const {x,y} = getPos(e); scratch(x,y); };
    const stop = () => isDrawing = false;
    const draw = (e: any) => { if(!isDrawing) return; e.preventDefault(); const {x,y} = getPos(e); scratch(x,y); };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stop);
    };
  }, [isRevealed, isOpen]);

  // Fonction pour fermer la fenêtre
  const handleClose = () => {
    setIsOpen(false);
    // On peut recharger la page pour forcer l'affichage du thème si besoin, 
    // mais normalement ThemeLoader le gère déjà.
    window.location.reload(); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white p-2 card-brutal max-w-md w-full relative">
        <button 
          onClick={handleClose}
          className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 border-2 border-black shadow-brutal-sm z-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-4 mt-2">
            <h2 className="text-2xl font-black uppercase text-pink-600">Veux-tu être ma valentine ? 💖</h2>
            <p className="text-xs font-mono uppercase text-gray-500">GRATTE LA ZONE CI-DESSOUS</p>
        </div>

        <div ref={containerRef} className="relative w-full h-64 border-2 border-black bg-yellow-100 overflow-hidden cursor-crosshair">
          {/* CE QUI EST CACHÉ */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none">
            <h3 className="text-3xl font-black uppercase text-red-500 mb-2 transform -rotate-2">
              T'as pas le choix !
            </h3>
            <p className="text-4xl animate-pulse">❤️</p>
            <button 
                onClick={handleClose}
                className="mt-6 btn-brutal bg-black text-white px-6 py-3 text-lg hover:scale-105 transition-transform"
            >
                J'accepte mon sort
            </button>
          </div>

          {/* LA SURFACE À GRATTER */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out z-10"
          />
        </div>
      </div>
    </div>
  );
}