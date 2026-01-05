import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { HashtagInput } from "@/components/journal/HashtagInput";
import { Button } from "@/components/ui/button";
import { useEntry, useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";

export default function Entry() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
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

  if (isLoading) return <div className="p-8 text-center font-bold">Chargement...</div>;

  return (
    <div className="min-h-screen">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="border border-black shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-4xl font-black text-orange-500 uppercase tracking-tighter">
              {id ? "Modifier le souvenir" : "Nouveau Pixel"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <span className="inline-block px-4 py-1 border-2 border-black font-bold shadow-brutal-sm bg-white">
                📅 {date}
              </span>
            </div>

            {/* Carte Humeur */}
            <div className="card-brutal p-6">
              <MoodSelector value={moodScore} onChange={setMoodScore} />
            </div>

            {/* Zone de texte */}
            <div className="card-brutal p-6">
              <label className="block text-sm font-black uppercase mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Raconte-moi ta journée...
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                placeholder="Aujourd'hui, j'ai..."
                className="w-full bg-transparent border-2 border-black p-4 focus:outline-none text-lg font-medium shadow-brutal-sm placeholder:text-gray-400"
                required
              />
            </div>

            {/* Hashtags */}
            <div className="card-brutal p-6">
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <button 
              type="submit" 
              className="btn-brutal w-full py-4 text-xl font-black uppercase bg-black text-white" 
              disabled={createEntry.isPending || updateEntry.isPending}
            >
              Enregistrer mon pixel
            </button>
          </form>
        </main>
      </PageTransition>
    </div>
  );
}