import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
// J'ai supprimé l'import de Confetti qui causait l'erreur

export function ScratchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  useEffect(() => {
    const today = new Date();
    // Active du 8 au 15 Février
    const isValentineWeek = today.getMonth() === 1 && today.getDate() >= 8 && today.getDate() <= 15;
    
    // On enlève la vérification du localStorage pour que tu puisses tester
    if (isValentineWeek) {
       setIsOpen(true);
    }
  }, []);

  // --- Initialisation du Canvas ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !isOpen) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      ctx.fillStyle = "#CCCCCC"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      // Vérification progression
      if (Math.random() > 0.1) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentPixels = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) transparentPixels++;
      }
      if ((transparentPixels / (pixels.length / 4)) * 100 > 40) {
        setIsRevealed(true);
        canvas.style.opacity = "0";
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
      {isRevealed && <Confetti numberOfPieces={200} recycle={false} />}
      <div className="bg-white p-2 card-brutal max-w-md w-full relative">
        <button onClick={() => setIsOpen(false)} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 border-2 border-black shadow-brutal-sm z-50">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center mb-4 mt-2">
            <h2 className="text-2xl font-black uppercase text-pink-600">Veux-tu être ma valentine ? 💖</h2>
            <p className="text-xs font-mono uppercase text-gray-500">GRATTE LA ZONE CI-DESSOUS</p>
        </div>
        <div ref={containerRef} className="relative w-full h-64 border-2 border-black bg-yellow-100 overflow-hidden cursor-crosshair">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none">
            <h3 className="text-3xl font-black uppercase text-red-500 mb-2 transform -rotate-2">T'as pas le choix !</h3>
            <p className="text-lg font-bold">❤️</p>
            <button onClick={() => setIsOpen(false)} className="mt-4 btn-brutal bg-black text-white px-6 py-2 text-sm">J'accepte mon sort</button>
          </div>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full transition-opacity duration-700 ease-out z-10" />
        </div>
      </div>
    </div>
  );
}