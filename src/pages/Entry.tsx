import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom"; // ✅ useSearchParams ajouté
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { HashtagInput } from "@/components/journal/HashtagInput";
import { Button } from "@/components/ui/button";
import { useEntry, useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";

export default function Entry() {
  const { id } = useParams();
  const [searchParams] = useSearchParams(); // ✅ Pour lire ?date=2024-01-01
  const navigate = useNavigate();
  
  const { data: existingEntry, isLoading } = useEntry(id);
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(3);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  // ✅ On prend la date de l'URL ou aujourd'hui par défaut
  const [date, setDate] = useState(
    searchParams.get("date") || new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content || "");
      setMoodScore(existingEntry.mood_score || 3);
      setHashtags(existingEntry.hashtags || []);
      setDate(existingEntry.date);
    }
  }, [existingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const payload = { content, mood_score: moodScore, hashtags, date };

    try {
      if (id) {
        await updateEntry.mutateAsync({ id, ...payload });
      } else {
        await createEntry.mutateAsync(payload);
      }
      navigate("/");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    // ❌ "bg-background" retiré pour voir la couleur perso
    <div className="min-h-screen">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-white/50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
              {id ? "Modifier le souvenir" : "Nouveau Pixel"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <span className="inline-block px-4 py-1 rounded-full bg-white/50 text-sm font-medium border border-white/60">
                📅 {date}
              </span>
            </div>

            {/* Carte Humeur */}
            <div className="bg-white/60 backdrop-blur-md border border-white/50 p-6 rounded-3xl shadow-sm">
              <MoodSelector value={moodScore} onChange={setMoodScore} />
            </div>

            {/* Zone de texte */}
            <div className="bg-white/60 backdrop-blur-md border border-white/50 p-6 rounded-3xl shadow-sm">
              <label className="block text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Raconte-moi ta journée...
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Aujourd'hui, j'ai..."
                className="w-full bg-transparent border-none p-0 resize-none focus:outline-none text-lg text-gray-700 placeholder:text-gray-400/70"
                required
              />
            </div>

            {/* Hashtags */}
            <div className="bg-white/60 backdrop-blur-md border border-white/50 p-6 rounded-3xl shadow-sm">
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-full bg-black hover:bg-gray-800 text-white font-bold py-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1" 
              disabled={createEntry.isPending || updateEntry.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer mon pixel
            </Button>
          </form>
        </main>
      </PageTransition>
    </div>
  );
}