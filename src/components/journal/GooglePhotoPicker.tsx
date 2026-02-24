import { useState, useEffect } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GooglePhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

export function GooglePhotoPicker({ isOpen, onClose, selectedIds, onSelect }: GooglePhotoPickerProps) {
  const [isDone, setIsDone] = useState(false);
  const [sessionIdCache, setSessionIdCache] = useState<string | null>(null);
  const [tokenCache, setTokenCache] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsDone(false);
      startPickerFlow();
    }
  }, [isOpen]);

  const startPickerFlow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) throw new Error("Token introuvable.");
      setTokenCache(token);

      const sessionRes = await fetch("https://photospicker.googleapis.com/v1/sessions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      const sessionData = await sessionRes.json();
      setSessionIdCache(sessionData.id);
      
      const pickerUri = sessionData.pickerUri + "/autoclose"; 
      const popup = window.open(pickerUri, "GooglePhotoPicker", "width=800,height=600");

      let isFinished = false;

      const fetchPhotos = async () => {
        if (isFinished) return;
        isFinished = true;
        
        try {
          const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionData.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const itemsData = await itemsRes.json();
          
          if (itemsData.mediaItems) {
             // On récupère juste le lien direct de Google !
             const urls = itemsData.mediaItems.map((item: any) => `${item.mediaFile.baseUrl}=w1080`);
             onSelect([...selectedIds, ...urls]);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsDone(true);
          onClose();
        }
      };

      const pollInterval = setInterval(async () => {
        if (isFinished) { clearInterval(pollInterval); return; }
        try {
          const pollRes = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionData.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const pollData = await pollRes.json();
          if (pollData.mediaItemsSet) {
            clearInterval(pollInterval);
            if (popup && !popup.closed) popup.close(); 
            await fetchPhotos();
          }
        } catch (e) {}
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setIsDone(true);
    }
  };

  const manualCheck = async () => {
    if (!sessionIdCache || !tokenCache) return;
    try {
      const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionIdCache}`, {
        headers: { "Authorization": `Bearer ${tokenCache}` }
      });
      const itemsData = await itemsRes.json();
      if (itemsData.mediaItems) {
         const urls = itemsData.mediaItems.map((item: any) => `${item.mediaFile.baseUrl}=w1080`);
         onSelect([...selectedIds, ...urls]);
         onClose();
      }
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-sm w-full text-center border-4 border-black shadow-brutal">
        <h2 className="text-xl font-black uppercase mb-4 flex items-center justify-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-500" />
          Importation
        </h2>
        
        <div className="flex flex-col items-center gap-4 my-8">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="font-bold text-gray-700">Fenêtre Google ouverte...</p>
        </div>

        <button onClick={manualCheck} className="btn-brutal px-4 py-2 font-bold uppercase bg-blue-500 text-white w-full mb-2">
          Forcer la vérification
        </button>
        <button onClick={onClose} className="btn-brutal px-4 py-2 font-bold uppercase bg-black text-white w-full">
          Annuler
        </button>
      </div>
    </div>
  );
}