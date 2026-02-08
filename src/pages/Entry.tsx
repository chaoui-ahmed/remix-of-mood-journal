import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Sparkles, X } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { HashtagInput } from "@/components/journal/HashtagInput";
import { useEntry, useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";
import { useToast } from "@/hooks/use-toast";

export default function Entry() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: existingEntry, isLoading } = useEntry(id);
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(3);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  // État pour gérer l'affichage de la popup "Call Me Maybe"
  const [showSpecialPopup, setShowSpecialPopup] = useState(false);
  
  const urlDate = searchParams.get("date");
  const [date, setDate] = useState(urlDate || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content || "");
      setMoodScore(existingEntry.mood_score || 3);
      setHashtags(existingEntry.hashtags || []);
      if (existingEntry.date) setDate(existingEntry.date);
    } else {
      setContent("");
      setMoodScore(3);
      setHashtags([]);
      if (urlDate) setDate(urlDate);
    }
  }, [existingEntry, id, urlDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Champ vide",
        description: "Le contenu ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      content,
      mood_score: moodScore,
      hashtags,
      date,
    };

    try {
      if (id && id !== "new") {
        await updateEntry.mutateAsync({ id, ...payload });
      } else {
        await createEntry.mutateAsync(payload);
      }

      // VÉRIFICATION DU SCORE POUR L'EASTER EGG
      if (moodScore === 1) {
        setShowSpecialPopup(true);
      } else {
        toast({
          title: "Succès",
          description: "Pixel enregistré avec succès !",
        });
        navigate("/");
      }
      
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'entrée.",
        variant: "destructive",
      });
    }
  };

  // Fonction appelée quand on ferme la popup (bouton ou croix)
  const handleClosePopup = () => {
    setShowSpecialPopup(false);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-black uppercase animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      {/* POPUP SPECIAL CALL ME MAYBE */}
      {showSpecialPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white p-2 card-brutal max-w-sm w-full relative flex flex-col items-center text-center">
            
            {/* Bouton fermeture croix */}
            <button 
              onClick={handleClosePopup}
              className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 border-2 border-black shadow-brutal-sm z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Image */}
            <div className="border-2 border-black w-full mb-4">
               <img 
                src="https://i.pinimg.com/736x/74/72/0b/74720b4dc3956fff41810ab55ee192b6.jpg" 
                alt="Call me maybe"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Texte */}
            <h3 className="text-2xl font-black uppercase text-pink-600 mb-2">
              So call me maybe 💖
            </h3>
            <p className="text-xl font-mono font-bold bg-yellow-300 px-3 py-1 border-2 border-black transform -rotate-2 mb-6">
              06 35 47 70 19
            </p>

            {/* Bouton OK */}
            <button 
              onClick={handleClosePopup}
              className="w-full btn-brutal bg-black text-white hover:bg-gray-800 py-3"
            >
              C'EST NOTÉ !
            </button>
          </div>
        </div>
      )}

      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)} 
              className="btn-brutal p-2 bg-white hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-4xl font-black text-orange-500 uppercase tracking-tighter">
              {id && id !== "new" ? "Modifier" : "Nouveau Pixel"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <span className="inline-block px-4 py-1 border-2 border-black font-black shadow-brutal-sm bg-white uppercase transform -rotate-1">
                📅 {date}
              </span>
            </div>

            <div className="card-brutal p-6 bg-white">
              <MoodSelector value={moodScore} onChange={setMoodScore} />
            </div>

            <div className="card-brutal p-6 bg-white">
              <label className="block text-sm font-black uppercase mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Raconte-moi ta journée...
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Aujourd'hui, j'ai..."
                className="w-full bg-white border-2 border-black p-4 focus:outline-none font-bold shadow-brutal-sm text-lg resize-none"
                required
              />
            </div>

            <div className="card-brutal p-6 bg-white">
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <button 
              type="submit" 
              className="btn-brutal w-full py-6 text-xl font-black bg-black text-white hover:bg-gray-900 flex items-center justify-center gap-2 disabled:opacity-70"
              disabled={createEntry.isPending || updateEntry.isPending}
            >
              <Save className="w-5 h-5" />
              {createEntry.isPending || updateEntry.isPending ? "SAUVEGARDE..." : "ENREGISTRER MON PIXEL"}
            </button>
          </form>
        </main>
      </PageTransition>
    </div>
  );
}