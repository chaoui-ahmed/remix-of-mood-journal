import { useRef, useEffect, useState } from "react";
import { X, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import Confetti from "react-confetti"; // Si tu n'as pas ce paquet, on fera sans ou installe-le (npm install react-confetti)

export function ScratchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  // Activation automatique (9-15 Fév)
  useEffect(() => {
    const today = new Date();
    const isValentineWeek = today.getMonth() === 1 && today.getDate() >= 9 && today.getDate() <= 15;
    const hasPlayed = localStorage.getItem("scratch_card_played");

if (isValentineWeek) { setIsOpen(true); }
    //  setIsOpen(true);
    }
    // Pour tester tout de suite, décommente la ligne ci-dessous :
    // setIsOpen(true); 
  }, []);

  // Initialisation du Canvas (la zone à gratter)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !isOpen) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajuster la taille du canvas au conteneur
    const updateSize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      
      // Remplissage de la zone à gratter (Gris argenté)
      ctx.fillStyle = "#CCCCCC"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Ajout de texte "GRATTE-MOI" sur la couche grise
      ctx.font = "bold 24px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "#999999";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✨ GRATTE ICI ✨", canvas.width / 2, canvas.height / 2);
      ctx.fillText("pour découvrir ton cadeau", canvas.width / 2, canvas.height / 2 + 30);
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, [isOpen]);

  // Logique de Grattage
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
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = "destination-out"; // Efface le contenu
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI); // Taille du "pinceau"
      ctx.fill();
      checkProgress();
    };

    const checkProgress = () => {
      // On vérifie tous les 10 coups de pinceau pour ne pas lagger
      if (Math.random() > 0.1) return; 

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) transparentPixels++;
      }

      const percent = (transparentPixels / (pixels.length / 4)) * 100;
      setScratchProgress(percent);

      if (percent > 40) { // Si 40% est gratté, on révèle tout
        setIsRevealed(true);
        localStorage.setItem("scratch_card_played", "true");
        canvas.style.opacity = "0"; // Disparition en douceur
        canvas.style.pointerEvents = "none";
      }
    };

    const startDrawing = (e: any) => { isDrawing = true; const {x, y} = getPos(e); scratch(x, y); };
    const stopDrawing = () => { isDrawing = false; };
    const draw = (e: any) => { if (!isDrawing) return; e.preventDefault(); const {x, y} = getPos(e); scratch(x, y); };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);
    
    canvas.addEventListener("touchstart", startDrawing);
    canvas.addEventListener("touchmove", draw);
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
        // Cleanup listeners
        canvas.removeEventListener("mousedown", startDrawing);
        canvas.removeEventListener("mousemove", draw);
        canvas.removeEventListener("mouseup", stopDrawing);
        canvas.removeEventListener("mouseleave", stopDrawing);
        canvas.removeEventListener("touchstart", startDrawing);
        canvas.removeEventListener("touchmove", draw);
        canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [isRevealed, isOpen]);

  const handleClose = () => setIsOpen(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
      {isRevealed && <Confetti numberOfPieces={200} recycle={false} />}
      
      <div className="bg-white p-2 card-brutal max-w-md w-full relative">
        <button 
          onClick={handleClose}
          className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 border-2 border-black shadow-brutal-sm z-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-4 mt-2">
            <h2 className="text-2xl font-black uppercase text-pink-600">Ticket Surprise 💖</h2>
            <p className="text-xs font-mono uppercase text-gray-500">GRATTE LA ZONE CI-DESSOUS</p>
        </div>

        {/* ZONE DE JEU */}
        <div 
          ref={containerRef}
          className="relative w-full h-64 border-2 border-black bg-yellow-100 overflow-hidden cursor-crosshair"
        >
          {/* CE QUI EST CACHÉ (LE GAGNANT) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none">
            <Trophy className="w-12 h-12 text-yellow-500 mb-2 animate-bounce" />
            <h3 className="text-3xl font-black uppercase text-red-500 mb-2 transform -rotate-2">
              GAGNÉ !
            </h3>
            <p className="text-lg font-bold">Tu as gagné mon ❤️ pour l'éternité.</p>
            <p className="mt-2 text-sm font-mono bg-white px-2 py-1 border border-black">
              Code promo: JE T'AIME
            </p>
            <button 
                onClick={handleClose}
                className="mt-4 btn-brutal bg-black text-white px-6 py-2 text-sm"
            >
                RÉCLAMER MON CADEAU
            </button>
          </div>

          {/* LA SURFACE À GRATTER (LE CANVAS) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out z-10"
          />
        </div>
      </div>
    </div>
  );
}