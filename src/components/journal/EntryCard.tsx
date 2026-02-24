import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // Pour récupérer le token

interface EntryCardProps {
  entry: {
    id: string;
    content: string;
    mood_score: number;
    hashtags: string[];
    date?: string;       
    created_at?: string; 
    google_photos_ids?: string[] | null; // NOUVEAU
  };
  onClick?: () => void;
}

const moodClasses: Record<number, string> = {
  1: "border-l-mood-1",
  2: "border-l-mood-2",
  3: "border-l-mood-3",
  4: "border-l-mood-4",
  5: "border-l-mood-5",
};

const moodEmojis: Record<number, string> = {
  1: "⛈️", 2: "☔️", 3: "😐", 4: "😊", 5: "😁",
};

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const rawDate = entry.date || entry.created_at;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const isDateSafe = dateObj && isValid(dateObj);

  // NOUVEAU : State pour les URLs d'images générées
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchFreshUrls = async () => {
      if (!entry.google_photos_ids || entry.google_photos_ids.length === 0) return;

      try {
        // 1. Récupérer la session actuelle pour avoir le token Google
        const { data: { session } } = await supabase.auth.getSession();
        const googleAccessToken = session?.provider_token;

        if (!googleAccessToken) {
          console.error("Token Google introuvable. L'utilisateur doit se reconnecter avec Google.");
          return;
        }

        // 2. Interroger l'API Google Photos en batch
        const queryParams = entry.google_photos_ids.map(id => `mediaItemIds=${id}`).join('&');
        const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems:batchGet?${queryParams}`, {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        });
        
        const data = await response.json();
        
        // 3. Extraire les URLs (avec le paramètre =w500 pour redimensionner la largeur à 500px)
        if (data.mediaItemResults) {
          const urls = data.mediaItemResults
            .filter((res: any) => res.mediaItem)
            .map((res: any) => `${res.mediaItem.baseUrl}=w500`);
          
          setPhotoUrls(urls);
        }
      } catch (error) {
        console.error("Erreur de récupération des images Google Photos", error);
      }
    };

    fetchFreshUrls();
  }, [entry.google_photos_ids]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: -2, y: -2 }}
      onClick={onClick}
      className={cn(
        "bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm p-4 cursor-pointer transition-all duration-300 rounded-2xl",
        "hover:shadow-md hover:bg-white/80 border-l-4",
        moodClasses[entry.mood_score] || "border-l-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          <span>
            {isDateSafe ? format(dateObj!, "d MMMM yyyy", { locale: fr }) : "Date inconnue"}
          </span>
        </div>
        <span className="text-2xl filter drop-shadow-sm">
          {moodEmojis[entry.mood_score] || "😶"}
        </span>
      </div>

      <p className="text-gray-700 line-clamp-3 mb-3 text-sm leading-relaxed font-medium">
        {entry.content || "Contenu vide..."}
      </p>

      {/* NOUVEAU : Affichage des images récupérées dynamiquement */}
      {photoUrls.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
          {photoUrls.map((url, i) => (
            <img 
              key={i} 
              src={url} 
              alt="Moment de la journée" 
              className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm flex-shrink-0"
            />
          ))}
        </div>
      )}

      {entry.hashtags && entry.hashtags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Hash className="w-3 h-3 text-pink-400" />
          {entry.hashtags.map((tag) => (
            <span key={tag} className="text-[10px] font-bold uppercase tracking-wide text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}