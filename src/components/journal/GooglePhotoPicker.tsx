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
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [sessionDataCache, setSessionDataCache] = useState<any>(null);
  const [tokenCache, setTokenCache] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
  };

  useEffect(() => {
    if (isOpen) {
      setLogs([]);
      setIsDone(false);
      startPickerFlow();
    }
  }, [isOpen]);

  const startPickerFlow = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) throw new Error("Token introuvable. Reconnecte-toi.");
      setTokenCache(token);

      addLog("PIKS LOADING");
      const sessionRes = await fetch("https://photospicker.googleapis.com/v1/sessions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      if (!sessionRes.ok) throw new Error("Erreur de création de session Google.");
      const sessionData = await sessionRes.json();
      setSessionDataCache(sessionData);
      
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
          
          if (!itemsData.mediaItems) throw new Error("Aucune photo reçue de Google.");

          const finalUrls = [];
          
          for (const item of itemsData.mediaItems) {
            // Demander la qualité originale pour éviter certains blocages
            const googleUrl = `${item.mediaFile.baseUrl}=d`;
            

            try {
              // LA MAGIE EST ICI : On passe le Token et on cache l'origine !
              const imgRes = await fetch(googleUrl, {
                method: "GET",
                headers: {
                  "Authorization": `Bearer ${token}` // Badge VIP
                },
                referrerPolicy: "no-referrer" // Cape d'invisibilité
              });

              if (!imgRes.ok) throw new Error(`Google bloque encore (Code ${imgRes.status})`);
              const blob = await imgRes.blob();
              
              
              const fileName = `pixel-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              const { error: uploadError } = await supabase.storage
                .from('journal-photos')
                .upload(fileName, blob, { contentType: 'image/jpeg' });

              if (uploadError) {
                throw new Error(`Supabase a refusé: ${uploadError.message}`);
              }

              const { data: publicUrlData } = supabase.storage
                .from('journal-photos')
                .getPublicUrl(fileName);

              finalUrls.push(publicUrlData.publicUrl);
              

            } catch (uploadErr: any) {
               
            }
          }

          if (finalUrls.length > 0) {
            onSelect([...selectedIds, ...finalUrls]);
            
          } else {
            
          }
          setIsDone(true);

        } catch (err: any) {
          
          setIsDone(true);
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
      addLog(`❌ ERREUR FATALE: ${err.message}`);
      setIsDone(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-sm w-full text-left border-4 border-black shadow-brutal flex flex-col max-h-[90vh]">
        <h2 className="text-xl font-black uppercase mb-4 flex items-center justify-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-500" /> Transfert
        </h2>
        
        <div className="flex-1 overflow-y-auto bg-gray-50 border-2 border-gray-200 p-4 mb-4 font-mono text-xs space-y-2">
          {logs.map((log, i) => (
            <p key={i} className={`${log.includes('❌') ? 'text-red-600 font-bold' : log.includes('✅') || log.includes('🎉') ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
              {log}
            </p>
          ))}
          {!isDone && <Loader2 className="w-4 h-4 animate-spin mt-2 text-blue-500" />}
        </div>

        <button 
          onClick={onClose} 
          className={`btn-brutal px-4 py-3 font-bold uppercase transition-colors ${isDone && logs.some(l => l.includes('SUCCÈS')) ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-black text-white hover:bg-gray-800'}`}
        >
          {isDone ? "Fermer" : "Annuler"}
        </button>
      </div>
    </div>
  );
}