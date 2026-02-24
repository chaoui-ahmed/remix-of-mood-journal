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
      addLog("1. Connexion...");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) throw new Error("Token introuvable. Reconnecte-toi avec Google.");
      setTokenCache(token);

      addLog("2. Création de la session Google...");
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
      setSessionIdCache(sessionId);
      
      // LA MAGIE EST ICI : On ajoute /autoclose pour que Google gère la fermeture
      const pickerUri = sessionData.pickerUri + "/autoclose"; 

      addLog("3. Fenêtre ouverte ! Choisis tes photos, valide, et NE FERME PAS la fenêtre toi-même.");
      const popup = window.open(pickerUri, "GooglePhotoPicker", "width=800,height=600");
      if (!popup) throw new Error("Ton navigateur a bloqué la popup !");

      let isFinished = false;

      const fetchPhotos = async () => {
        if (isFinished) return;
        isFinished = true;
        
        try {
          addLog("5. Google a validé ! Récupération des photos...");
          const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const itemsData = await itemsRes.json();
          
          if (!itemsData.mediaItems || itemsData.mediaItems.length === 0) {
            addLog("❌ Bizarre, Google dit OK mais n'envoie aucune photo.");
            setIsDone(true);
            return;
          }

          addLog(`✅ ${itemsData.mediaItems.length} photo(s) trouvée(s) ! Transfert en cours...`);
          const finalUrls = [];

          for (const item of itemsData.mediaItems) {
            const googleUrl = `${item.mediaFile.baseUrl}=w1080`;
            try {
               // On tente d'uploader dans ton Supabase
               const imageResponse = await fetch(googleUrl);
               const imageBlob = await imageResponse.blob();
               const fileName = `pixel-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
               
               const { error: uploadError } = await supabase.storage
                 .from('journal-photos')
                 .upload(fileName, imageBlob, { contentType: 'image/jpeg' });

               if (uploadError) throw uploadError;

               const { data: publicUrlData } = supabase.storage
                 .from('journal-photos')
                 .getPublicUrl(fileName);

               finalUrls.push(publicUrlData.publicUrl);
            } catch (err) {
               addLog("⚠️ Echec transfert Supabase, utilisation du lien Google de secours.");
               finalUrls.push(googleUrl);
            }
          }

          addLog("6. Envoi au Pixel...");
          onSelect([...selectedIds, ...finalUrls]);
          addLog("🎉 SUCCÈS ! Tu peux fermer et enregistrer ton Pixel !");
          setIsDone(true);

        } catch (err: any) {
          addLog(`❌ ERREUR: ${err.message}`);
          setIsDone(true);
        }
      };

      // On vérifie toutes les 5 secondes (Recommandation officielle Google)
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
            if (!popup.closed) popup.close(); // Sécurité
            addLog("4. Signal reçu de Google !");
            await fetchPhotos();
          }
        } catch (e) {
          // Ignorer erreurs réseau
        }
      }, 5000);

      // Si l'utilisateur ferme avec la croix
      const closeInterval = setInterval(() => {
        if (isFinished) {
          clearInterval(closeInterval);
          return;
        }
        if (popup.closed) {
          clearInterval(closeInterval);
          clearInterval(pollInterval);
          addLog("⚠️ La fenêtre a été fermée manuellement.");
          addLog("Si tu avais bien cliqué sur 'Done', clique sur 'Forcer la vérification' ci-dessous.");
          setIsDone(true); // On arrête le chargement, mais on laisse les boutons
        }
      }, 1000);

    } catch (err: any) {
      addLog(`❌ ERREUR: ${err.message}`);
      setIsDone(true);
    }
  };

  // Fonction manuelle au cas où la fenêtre se ferme mal
  const manualCheck = async () => {
    if (!sessionIdCache || !tokenCache) return;
    addLog("🔍 Vérification forcée en cours...");
    setIsDone(false);
    try {
      const pollRes = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionIdCache}`, {
        headers: { "Authorization": `Bearer ${tokenCache}` }
      });
      const pollData = await pollRes.json();
      
      if (pollData.mediaItemsSet) {
        addLog("✅ Google confirme la sélection ! Récupération...");
        // Dupliquer la logique de fetch ici pour le forçage
        const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionIdCache}`, {
          headers: { "Authorization": `Bearer ${tokenCache}` }
        });
        const itemsData = await itemsRes.json();
        
        if (itemsData.mediaItems) {
           const urls = itemsData.mediaItems.map((item: any) => `${item.mediaFile.baseUrl}=w1080`);
           onSelect([...selectedIds, ...urls]);
           addLog("🎉 SUCCÈS FORCÉ ! Tu peux fermer.");
        }
      } else {
        addLog("❌ Google dit que rien n'a été sélectionné.");
      }
    } catch (e: any) {
      addLog(`❌ Erreur: ${e.message}`);
    }
    setIsDone(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-lg w-full border-4 border-black shadow-brutal flex flex-col max-h-[90vh]">
        <h2 className="text-xl font-black uppercase mb-4 flex items-center justify-center gap-2 border-b-2 border-black pb-4">
          <ImageIcon className="w-6 h-6 text-blue-500" />
          Importation Google
        </h2>

        <div className="flex-1 overflow-y-auto bg-gray-50 border-2 border-gray-200 p-4 mb-6 font-mono text-sm space-y-2 text-left">
          {logs.map((log, i) => (
            <p key={i} className={`${log.includes('❌') ? 'text-red-600 font-bold' : log.includes('✅') || log.includes('🎉') ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
              {log}
            </p>
          ))}
          {!isDone && (
             <div className="flex items-center gap-2 mt-4 text-blue-500 font-bold">
               <Loader2 className="w-4 h-4 animate-spin" /> Patience...
             </div>
          )}
        </div>

        <div className="flex gap-2 flex-col sm:flex-row">
          {isDone && logs.some(l => l.includes('fermée manuellement')) && (
            <button onClick={manualCheck} className="btn-brutal flex-1 px-4 py-3 font-bold uppercase bg-blue-500 text-white hover:bg-blue-600">
              Forcer la vérification
            </button>
          )}
          <button 
            onClick={onClose} 
            className={`btn-brutal flex-1 px-4 py-3 font-bold uppercase transition-colors ${isDone && logs.some(l => l.includes('SUCCÈS')) ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            {isDone && logs.some(l => l.includes('SUCCÈS')) ? "Fermer & Continuer" : "Annuler"}
          </button>
        </div>
      </div>
    </div>
  );
}