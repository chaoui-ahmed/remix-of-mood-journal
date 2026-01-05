import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { HashtagInput } from "@/components/journal/HashtagInput";
import { Button } from "@/components/ui/button";
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
    if (!content.trim()) {
      toast({ title: "Champ vide", description: "Le contenu ne peut pas être vide.", variant: "destructive" });
      return;
    }

    const payload = { content, mood_score: moodScore, hashtags, date };

    try {
      if (id && id !== "new") {
        await updateEntry.mutateAsync({ id, ...payload });
        toast({ title: "Succès", description: "Pixel mis à jour !" });
      } else {
        await createEntry.mutateAsync(payload);
        toast({ title: "Succès", description: "Nouveau pixel enregistré !" });
      }
      navigate("/");
    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      toast({ title: "Erreur", description: error.message || "Impossible de sauvegarder.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center font-black uppercase">Chargement...</div>;

  return (
    <div className="min-h-screen">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)} 
              className="btn-brutal p-2 bg-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-4xl font-black text-orange-500 uppercase tracking-tighter">
              {id ? "Modifier le souvenir" : "Nouveau Pixel"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <span className="inline-block px-4 py-1 border-2 border-black font-black shadow-brutal-sm bg-white uppercase">
                📅 {date}
              </span>
            </div>

            {/* Carte Humeur */}
            <div className="card-brutal p-6 bg-white">
              <MoodSelector value={moodScore} onChange={setMoodScore} />
            </div>

            {/* Zone de texte */}
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
                className="w-full bg-white border-2 border-black p-4 focus:outline-none font-bold shadow-brutal-sm text-lg"
                required
              />
            </div>

            {/* Hashtags */}
            <div className="card-brutal p-6 bg-white">
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <button 
              type="submit" 
              className="btn-brutal w-full py-6 text-xl font-black bg-black text-white hover:bg-gray-900 flex items-center justify-center gap-2"
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