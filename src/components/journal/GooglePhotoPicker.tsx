import { useState, useEffect } from "react";
import { Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg]);
    console.log("[GooglePicker]", msg);
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
      addLog("1. Vérification de ta connexion Google...");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) throw new Error("Token introuvable. Reconnecte-toi avec Google.");

      addLog("2. Création de la session Google Photos...");
      const sessionRes = await fetch("https://photospicker.googleapis.com/v1/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!sessionRes.ok) throw new Error(`Erreur API Google: ${sessionRes.status}`);
      
      const sessionData = await sessionRes.json();
      const sessionId = sessionData.id;
      const pickerUri = sessionData.pickerUri; 

      addLog("3. Ouverture de la fenêtre sécurisée (Choisis ta photo puis clique sur Done)...");
      const popup = window.open(pickerUri, "GooglePhotoPicker", "width=800,height=600");
      if (!popup) throw new Error("Ton navigateur a bloqué la popup !");

      let isFinished = false;

      // Fonction finale de récupération
      const fetchPhotos = async () => {
        if (isFinished) return;
        isFinished = true;
        
        try {
          addLog("5. Google dit que c'est fini ! Analyse des photos...");
          const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const itemsData = await itemsRes.json();
          
          if (itemsData.error) {
            throw new Error(itemsData.error.message);
          }

          if (!itemsData.mediaItems || itemsData.mediaItems.length === 0) {
            addLog("❌ AUCUNE PHOTO TROUVÉE : Tu as validé sans rien sélectionner ?");
            setIsDone(true);
            return;
          }

          addLog(`✅ ${itemsData.mediaItems.length} photo(s) récupérée(s) !`);
          const finalUrls = [];

          for (const item of itemsData.mediaItems) {
            if (item.mediaFile && item.mediaFile.baseUrl) {
               // On prend le lien direct Google pour tester
               finalUrls.push(`${item.mediaFile.baseUrl}=w1080`);
            }
          }

          addLog("6. Envoi des liens vers ton Pixel...");
          onSelect([...selectedIds, ...finalUrls]);
          addLog("🎉 SUCCÈS TOTAL ! Tu peux fermer cette fenêtre.");
          setIsDone(true);

        } catch (err: any) {
          addLog(`❌ ERREUR FATALE: ${err.message}`);
          setIsDone(true);
        }
      };

      // Le Radar qui vérifie toutes les 2 secondes
      const pollInterval = setInterval(async () => {
        if (isFinished) {
          clearInterval(pollInterval);
          return;
        }
        try {
          const pollRes = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const pollData = await pollRes.json();
          
          if (pollData.mediaItemsSet) {
            clearInterval(pollInterval);
            if (!popup.closed) popup.close(); 
            addLog("4. Fenêtre fermée automatiquement.");
            await fetchPhotos();
          }
        } catch (e) {
          // On ignore les petites erreurs réseau
        }
      }, 2000);

      // Si l'utilisateur ferme la fenêtre avec la croix rouge
      const closeInterval = setInterval(async () => {
        if (isFinished) {
          clearInterval(closeInterval);
          return;
        }
        if (popup.closed) {
          clearInterval(closeInterval);
          clearInterval(pollInterval);
          addLog("⚠️ La fenêtre a été fermée. Dernière vérification...");
          try {
            const finalPoll = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            const finalData = await finalPoll.json();
            if (finalData.mediaItemsSet) {
              await fetchPhotos();
            } else {
              addLog("❌ Annulation: Tu as fermé sans valider de photos.");
              setIsDone(true);
            }
          } catch (e) {
            addLog("❌ Annulation confirmée.");
            setIsDone(true);
          }
        }
      }, 1000);

    } catch (err: any) {
      addLog(`❌ ERREUR DE DÉMARRAGE: ${err.message}`);
      setIsDone(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-lg w-full border-4 border-black shadow-brutal flex flex-col max-h-[90vh]">
        <h2 className="text-xl font-black uppercase mb-4 flex items-center justify-center gap-2 border-b-2 border-black pb-4">
          <ImageIcon className="w-6 h-6 text-blue-500" />
          Débogage Google Photos
        </h2>

        {/* Espace où s'affichent les logs en direct */}
        <div className="flex-1 overflow-y-auto bg-gray-50 border-2 border-gray-200 p-4 mb-6 font-mono text-sm space-y-2 text-left">
          {logs.length === 0 && <p className="text-gray-400">Démarrage...</p>}
          {logs.map((log, i) => (
            <p key={i} className={`${log.includes('❌') ? 'text-red-600 font-bold' : log.includes('✅') || log.includes('🎉') ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
              {log}
            </p>
          ))}
          {!isDone && (
             <div className="flex items-center gap-2 mt-4 text-blue-500 font-bold">
               <Loader2 className="w-4 h-4 animate-spin" /> En attente...
             </div>
          )}
        </div>

        <button 
          onClick={onClose} 
          className={`btn-brutal px-6 py-3 font-bold w-full uppercase transition-colors ${isDone ? 'bg-black text-white hover:bg-gray-800' : 'bg-red-500 text-white hover:bg-red-600'}`}
        >
          {isDone ? "Fermer cette fenêtre" : "Forcer l'annulation"}
        </button>
      </div>
    </div>
  );
}