import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { HashtagInput } from "@/components/journal/HashtagInput";
import { Button } from "@/components/ui/button";
import { useEntry, useCreateEntry, useUpdateEntry } from "@/hooks/useEntries";

export default function Entry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: existingEntry, isLoading } = useEntry(id);
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();

  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(3);
  const [hashtags, setHashtags] = useState<string[]>([]);
  // Date du jour par défaut (format YYYY-MM-DD)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">{id ? "Modifier" : "Nouveau Pixel"}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center text-sm text-muted-foreground">
              Date : {date}
            </div>

            <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
              <MoodSelector value={moodScore} onChange={setMoodScore} />
            </div>

            <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
              <label className="block text-sm font-semibold mb-2">Ton histoire</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full bg-background border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <Button type="submit" className="w-full" disabled={createEntry.isPending || updateEntry.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </form>
        </main>
      </PageTransition>
    </div>
  );
}