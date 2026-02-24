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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startPickerFlow();
    }
  }, [isOpen]);

  const startPickerFlow = async () => {
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) throw new Error("Token introuvable. Reconnecte-toi avec Google.");

      // 1. Créer la session
      const sessionRes = await fetch("https://photospicker.googleapis.com/v1/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({}) // Toujours envoyer un objet vide !
      });

      if (!sessionRes.ok) throw new Error("Erreur de création du Picker Google");
      
      const sessionData = await sessionRes.json();
      const sessionId = sessionData.id;
      
      // L'ASTUCE MAGIQUE : On force Google à fermer sa fenêtre automatiquement à la fin
      const pickerUri = sessionData.pickerUri + "/autoclose";

      // 2. Ouvrir la popup
      const popup = window.open(pickerUri, "GooglePhotoPicker", "width=800,height=600");
      if (!popup) throw new Error("Ton navigateur a bloqué la fenêtre pop-up Google ! Autorise-la.");

      let isFinished = false;

      // Fonction finale qui récupère vraiment les photos
      const fetchPhotosAndClose = async () => {
        if (isFinished) return;
        isFinished = true;
        
        try {
          const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const itemsData = await itemsRes.json();
          
          if (itemsData.mediaItems && itemsData.mediaItems.length > 0) {
            // On extrait les identifiants
            const newIds = itemsData.mediaItems.map((item: any) => item.id);
            onSelect([...selectedIds, ...newIds]); // On les envoie à Entry.tsx !
          }
        } catch (err) {
          console.error("Erreur de récupération des images:", err);
        } finally {
          onClose(); // On ferme notre modale de chargement
        }
      };

      // 3. On surveille toutes les 2 secondes
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
            await fetchPhotosAndClose();
          }
        } catch (e) {
          // On ignore les erreurs réseau temporaires
        }
      }, 2000);

      // 4. Sécurité ultime si l'utilisateur ferme la croix OU si l'autoclose s'active
      const closeInterval = setInterval(async () => {
        if (isFinished) {
          clearInterval(closeInterval);
          return;
        }
        if (popup.closed) {
          clearInterval(closeInterval);
          clearInterval(pollInterval);
          
          // Ultime vérification : peut-être qu'il a fini juste avant la fermeture ?
          try {
            const finalPoll = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            const finalData = await finalPoll.json();
            
            if (finalData.mediaItemsSet) {
              await fetchPhotosAndClose();
            } else {
              onClose(); // Il a vraiment annulé
            }
          } catch (e) {
            onClose();
          }
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-md w-full text-center border-4 border-black shadow-brutal">
        <h2 className="text-xl font-black uppercase mb-4 flex items-center justify-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-500" />
          Google Photos
        </h2>

        {error ? (
          <div className="text-red-500 font-bold mb-4 border-2 border-red-500 bg-red-50 p-3">
            {error}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 my-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="font-bold text-gray-700 text-lg">
              Choisis tes photos dans la fenêtre Google...
            </p>
          </div>
        )}

        <button onClick={onClose} className="btn-brutal bg-black text-white px-6 py-3 font-bold w-full uppercase hover:bg-gray-800">
          Annuler
        </button>
      </div>
    </div>
  );
}