import { useState, useEffect } from "react";
import { X, Check, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GooglePhotoPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

export function GooglePhotoPicker({ isOpen, onClose, selectedIds, onSelect }: GooglePhotoPickerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen]);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer le token Google depuis la session Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const googleToken = session?.provider_token;

      if (!googleToken) {
        throw new Error("Token Google introuvable. Reconnecte-toi avec Google.");
      }

      // Appel à l'API Google Photos pour récupérer les dernières photos
      const response = await fetch("https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=50", {
        headers: {
          Authorization: `Bearer ${googleToken}`,
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la récupération des photos");

      const data = await response.json();
      setPhotos(data.mediaItems || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter(photoId => photoId !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white p-6 card-brutal max-w-2xl w-full h-[80vh] flex flex-col relative">
        <div className="flex justify-between items-center mb-4 pb-4 border-b-2 border-black">
          <h2 className="text-xl font-black uppercase flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-500" />
            Tes Google Photos
          </h2>
          <button onClick={onClose} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 border-2 border-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-full font-bold animate-pulse">
              Chargement de ta galerie...
            </div>
          ) : error ? (
            <div className="text-red-500 font-bold text-center mt-10 p-4 border-2 border-red-500 bg-red-50">
              {error}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-gray-500 font-medium text-center mt-10">
              Aucune photo trouvée dans ton compte Google.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo) => {
                const isSelected = selectedIds.includes(photo.id);
                return (
                  <div 
                    key={photo.id} 
                    onClick={() => toggleSelection(photo.id)}
                    className={`relative cursor-pointer aspect-square border-2 transition-all ${
                      isSelected ? "border-blue-500 scale-95 shadow-inner" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img 
                      src={`${photo.baseUrl}=w300-h300-c`} 
                      alt="Miniature" 
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 border-2 border-white shadow-sm">
                        <Check className="w-4 h-4 font-bold" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t-2 border-black flex justify-between items-center">
          <span className="font-bold text-sm">
            {selectedIds.length} sélectionnée(s)
          </span>
          <button onClick={onClose} className="btn-brutal bg-black text-white px-6 py-2 font-bold">
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}