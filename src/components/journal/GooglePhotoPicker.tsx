import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GooglePhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

export function GooglePhotoPicker({ isOpen, onClose, selectedIds, onSelect }: GooglePhotoPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startPickerFlow();
    }
  }, [isOpen]);

  const startPickerFlow = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. On récupère ton fameux token !
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.provider_token;

      if (!token) throw new Error("Token introuvable. Reconnecte-toi avec Google.");

      // 2. On demande à Google de créer une "Session de sélection"
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
      const pickerUri = sessionData.pickerUri;

      // 3. On ouvre la fenêtre sécurisée de Google
      const popup = window.open(pickerUri, "GooglePhotoPicker", "width=800,height=600");
      
      if (!popup) {
        throw new Error("Ton navigateur a bloqué la fenêtre pop-up Google ! Autorise-la en haut de ton écran.");
      }

      // 4. On écoute toutes les 2 secondes pour voir si tu as fini de choisir
      const interval = setInterval(async () => {
        try {
          const pollRes = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const pollData = await pollRes.json();

          // Si Google nous dit "C'est bon, les photos sont sélectionnées"
          if (pollData.mediaItemsSet) {
            clearInterval(interval);
            popup.close();

            // 5. On récupère les IDs des photos sélectionnées
            const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
              headers: { "Authorization": `Bearer ${token}` }
            });
            const itemsData = await itemsRes.json();

            if (itemsData.mediaItems) {
              const newIds = itemsData.mediaItems.map((item: any) => item.id);
              onSelect([...selectedIds, ...newIds]);
            }
            onClose();
          }
        } catch (pollErr) {
          console.error("En attente de la sélection...");
        }
      }, 2000);

      // Sécurité si l'utilisateur ferme la popup avec la croix rouge
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          clearInterval(checkPopupClosed);
          setLoading(false);
          onClose();
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-md w-full text-center border-4 border-black shadow-brutal">
        <h2 className="text-xl font-black uppercase mb-4 flex items-center justify-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-500" />
          Sélection en cours
        </h2>

        {error ? (
          <div className="text-red-500 font-bold mb-4 border-2 border-red-500 bg-red-50 p-3">
            {error}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 my-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            <p className="font-bold text-gray-700 text-lg">
              Une fenêtre sécurisée s'est ouverte !
            </p>
            <p className="text-sm font-medium text-gray-500">
              Choisis tes photos dans la nouvelle fenêtre Google, cette modale se fermera toute seule.
            </p>
          </div>
        )}

        <button onClick={onClose} className="btn-brutal bg-black text-white px-6 py-3 font-bold w-full uppercase">
          Fermer / Annuler
        </button>
      </div>
    </div>
  );
}