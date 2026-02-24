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
      // ... (le reste du code au-dessus reste identique)

      // Fonction finale qui récupère et transfère les photos
      const fetchPhotosAndClose = async () => {
        if (isFinished) return;
        isFinished = true;
        
        try {
          const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const itemsData = await itemsRes.json();
          
          if (itemsData.mediaItems && itemsData.mediaItems.length > 0) {
            const finalUrls = [];

            // Pour chaque photo choisie par l'utilisateur...
            for (const item of itemsData.mediaItems) {
              try {
                // 1. On crée une URL Google optimisée (largeur max 1080px pour économiser TON stockage)
                const optimizedGoogleUrl = `${item.mediaFile.baseUrl}=w1080`;
                
                // 2. On télécharge la photo depuis Google
                const imageResponse = await fetch(optimizedGoogleUrl);
                const imageBlob = await imageResponse.blob();
                
                // 3. On crée un nom de fichier unique
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

                // 4. On l'envoie discrètement dans TON Supabase Storage
                const { data, error } = await supabase.storage
                  .from('journal-photos')
                  .upload(fileName, imageBlob, {
                    contentType: 'image/jpeg',
                  });

                if (error) throw error;

                // 5. On récupère l'URL publique et permanente de ton Supabase
                const { data: publicUrlData } = supabase.storage
                  .from('journal-photos')
                  .getPublicUrl(fileName);

                finalUrls.push(publicUrlData.publicUrl);
              } catch (uploadError) {
                console.error("Erreur lors du transfert d'une image:", uploadError);
              }
            }

            // On envoie les URLs Supabase (et non plus les IDs Google) à la page Entry.tsx !
            onSelect([...selectedIds, ...finalUrls]);
          }
        } catch (err) {
          console.error("Erreur globale de récupération:", err);
        } finally {
          onClose();
        }
      };

      // ... (le reste du code en dessous reste identique)

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