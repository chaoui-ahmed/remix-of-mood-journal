import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { HashtagInput } from "@/components/journal/HashtagInput";
import { useEntry, useCreateEntry } from "@/hooks/useEntries";

export default function Entry() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { data: existingEntry, isLoading } = useEntry(id);
  const createEntry = useCreateEntry();

  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(3);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [date] = useState(searchParams.get("date") || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content || "");
      setMoodScore(existingEntry.mood_score || 3);
      setHashtags(existingEntry.hashtags || []);
    }
  }, [existingEntry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      // ✅ Utilise upsert via useCreateEntry (gère ID existant ou date existante)
      await createEntry.mutateAsync({ content, mood_score: moodScore, hashtags, date });
      navigate("/");
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  if (isLoading) return <div className="p-8 text-center font-black">CHARGEMENT...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate(-1)} className="btn-brutal p-2 bg-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-4xl font-black text-orange-500 uppercase tracking-tighter">
              {id && id !== "new" ? "Modifier" : "Nouveau Pixel"}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <span className="inline-block px-4 py-1 border-2 border-black font-black shadow-brutal-sm bg-white uppercase">
                📅 {date}
              </span>
            </div>

            <div className="card-brutal p-6 bg-white">
              <MoodSelector value={moodScore} onChange={setMoodScore} />
            </div>

            <div className="card-brutal p-6 bg-white">
              <label className="block text-sm font-black uppercase mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" /> Ton histoire
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full bg-white border-2 border-black p-4 focus:outline-none font-bold shadow-brutal-sm"
                required
              />
            </div>

            <div className="card-brutal p-6 bg-white">
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <button 
              type="submit" 
              className="btn-brutal w-full py-6 text-xl bg-black text-white hover:bg-gray-900"
              disabled={createEntry.isPending}
            >
              <Save className="w-5 h-5 inline mr-2" /> 
              {createEntry.isPending ? "ENREGISTREMENT..." : "SAUVEGARDER MON PIXEL"}
            </button>
          </form>
        </main>
      </PageTransition>
    </div>
  );
}