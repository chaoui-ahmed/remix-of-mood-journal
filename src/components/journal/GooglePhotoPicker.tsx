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
  const [statusText, setStatusText] = useState("En attente de Google...");

  useEffect(() => {
    if (isOpen) {
      startPickerFlow();
    }
  }, [isOpen]);

  const startPickerFlow = async () => {
    setError(null);
    setStatusText("Connexion sécurisée en cours...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;
      
      if (!token) throw new Error("Token introuvable. Reconnecte-toi avec Google.");

      const sessionRes = await fetch("https://photospicker.googleapis.com/v1/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!sessionRes.ok) throw new Error("Erreur de création du Picker Google");
      
      const sessionData = await sessionRes.json();
      const sessionId = sessionData.id;
      // On utilise l'URL stricte donnée par Google (sans modifier avec /autoclose)
      const pickerUri = sessionData.pickerUri; 

      const popup = window.open(pickerUri, "GooglePhotoPicker", "width=800,height=600");
      if (!popup) throw new Error("Ton navigateur a bloqué la fenêtre pop-up Google ! Autorise-la.");

      let isFinished = false;

      // Fonction finale de téléchargement et d'upload
      const fetchPhotosAndClose = async () => {
        if (isFinished) return;
        isFinished = true;
        
        try {
          setStatusText("Analyse des photos sélectionnées...");
          const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const itemsData = await itemsRes.json();
          
          if (itemsData.mediaItems && itemsData.mediaItems.length > 0) {
            const finalUrls = [];

            for (let i = 0; i < itemsData.mediaItems.length; i++) {
              const item = itemsData.mediaItems[i];
              setStatusText(`Transfert de la photo ${i + 1} vers ton coffre...`);
              
              // Lien direct Google (optimisé)
              const googleOptimizedUrl = `${item.mediaFile.baseUrl}=w1080`;

              try {
                // 1. Essai de téléchargement
                const imageResponse = await fetch(googleOptimizedUrl);
                if (!imageResponse.ok) throw new Error("Google a bloqué la récupération du fichier image.");
                const imageBlob = await imageResponse.blob();
                
                // 2. Upload dans Supabase
                const fileName = `pixel-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                const { data, error: uploadError } = await supabase.storage
                  .from('journal-photos')
                  .upload(fileName, imageBlob, { contentType: 'image/jpeg' });

                if (uploadError) {
                   console.error("Détails de l'erreur Supabase:", uploadError);
                   throw new Error(`Erreur Supabase: ${uploadError.message}`);
                }

                // 3. Récupération URL Supabase
                const { data: publicUrlData } = supabase.storage
                  .from('journal-photos')
                  .getPublicUrl(fileName);

                finalUrls.push(publicUrlData.publicUrl);

              } catch (err: any) {
                console.error("Échec pour cette image :", err);
                alert(`Le transfert a échoué : ${err.message}\n\nOn va utiliser le lien temporaire Google pour te dépanner !`);
                // PLAN B : Si ça plante, on sauve le lien direct Google pour ne pas casser l'expérience !
                finalUrls.push(googleOptimizedUrl);
              }
            }

            // On envoie le résultat !
            onSelect([...selectedIds, ...finalUrls]);
          }
        } catch (err: any) {
          setError(`Erreur globale: ${err.message}`);
        } finally {
          onClose();
        }
      };

      // Le "Radar" qui vérifie toutes les 2 secondes
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
          
          // L'utilisateur a cliqué sur DONE !
          if (pollData.mediaItemsSet) {
            clearInterval(pollInterval);
            if (!popup.closed) popup.close(); // On ferme la fenêtre Google pour lui !
            await fetchPhotosAndClose();
          }
        } catch (e) {
          console.error("Erreur de Polling", e);
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
          // On vérifie une dernière fois au cas où il a cliqué sur Done 0.5 sec avant de fermer
          try {
            const finalPoll = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            const finalData = await finalPoll.json();
            if (finalData.mediaItemsSet) {
              await fetchPhotosAndClose();
            } else {
              onClose(); // Il a annulé
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
              {statusText}
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