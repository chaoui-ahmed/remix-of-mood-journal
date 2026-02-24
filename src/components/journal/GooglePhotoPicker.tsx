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
  const [sessionIdCache, setSessionIdCache] = useState<string | null>(null);
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

      addLog("Création de la session Google...");
      const sessionRes = await fetch("https://photospicker.googleapis.com/v1/sessions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      
      if (!sessionRes.ok) throw new Error("Erreur de création de session Google.");
      const sessionData = await sessionRes.json();
      setSessionIdCache(sessionData.id);
      
      const pickerUri = sessionData.pickerUri + "/autoclose"; 
      const popup = window.open(pickerUri, "GooglePhotoPicker", "width=800,height=600");

      let isFinished = false;

      const fetchPhotos = async () => {
        if (isFinished) return;
        isFinished = true;
        
        try {
          addLog("Google a validé ! Demande des photos...");
          const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionData.id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const itemsData = await itemsRes.json();
          
          if (!itemsData.mediaItems) throw new Error("Aucune photo reçue de Google.");

          const finalUrls = [];
          
          for (const item of itemsData.mediaItems) {
            const googleUrl = `${item.mediaFile.baseUrl}=w1080`;
            addLog("⬇️ Téléchargement depuis Google...");

            try {
              // 1. On télécharge la photo
              const imgRes = await fetch(googleUrl);
              if (!imgRes.ok) throw new Error(`Google bloque le téléchargement (${imgRes.status})`);
              const blob = await imgRes.blob();
              
              addLog("⬆️ Envoi vers ton Supabase...");
              // 2. On upload dans Supabase
              const fileName = `pixel-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              const { error: uploadError } = await supabase.storage
                .from('journal-photos')
                .upload(fileName, blob, { contentType: 'image/jpeg' });

              if (uploadError) {
                throw new Error(`Supabase a refusé: ${uploadError.message}`);
              }

              // 3. On récupère le bon lien !
              const { data: publicUrlData } = supabase.storage
                .from('journal-photos')
                .getPublicUrl(fileName);

              finalUrls.push(publicUrlData.publicUrl);
              addLog("✅ Image sauvegardée dans TON coffre !");

            } catch (uploadErr: any) {
               addLog(`❌ ERREUR DE TRANSFERT : ${uploadErr.message}`);
               // On ne donne PAS le lien Google de secours car on sait qu'il affiche le logo interdit
            }
          }

          if (finalUrls.length > 0) {
            onSelect([...selectedIds, ...finalUrls]);
            addLog("🎉 SUCCÈS ! Tu peux fermer cette fenêtre.");
          } else {
            addLog("❌ Toutes les photos ont échoué. Regarde l'erreur au-dessus.");
          }
          setIsDone(true);

        } catch (err: any) {
          addLog(`❌ ERREUR: ${err.message}`);
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

  const manualCheck = async () => {
    // ... [Garde la fonction manualCheck d'avant si tu veux, sinon tu peux l'enlever]
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