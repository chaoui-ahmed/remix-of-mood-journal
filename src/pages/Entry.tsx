import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { HashtagInput } from "@/components/journal/HashtagInput";
import { Button } from "@/components/ui/button";
import { useEntry, useCreateEntry, useUpdateEntry, useDeleteEntry } from "@/hooks/useEntries";

const DRAFT_KEY = "journal_draft";

export default function Entry() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: existingEntry, isLoading } = useEntry(id);
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState(3);
  const [hashtags, setHashtags] = useState<string[]>([]);

  // Load draft or existing entry
  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content);
      setMoodScore(existingEntry.mood_score);
      setHashtags(existingEntry.hashtags || []);
    } else if (!id) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setContent(parsed.content || "");
        setMoodScore(parsed.mood_score || 3);
        setHashtags(parsed.hashtags || []);
      }
    }
  }, [existingEntry, id]);

  // Auto-save draft
  useEffect(() => {
    if (!id) {
      const draft = { content, mood_score: moodScore, hashtags };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [content, moodScore, hashtags, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (id && existingEntry) {
      await updateEntry.mutateAsync({ id, content, mood_score: moodScore, hashtags });
    } else {
      await createEntry.mutateAsync({ content, mood_score: moodScore, hashtags });
      localStorage.removeItem(DRAFT_KEY);
    }
    navigate("/");
  };

  const handleDelete = async () => {
    if (id && confirm("Supprimer cette entrée ?")) {
      await deleteEntry.mutateAsync(id);
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">{id ? "Modifier l'entrée" : "Nouvelle entrée"}</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card border border-border shadow-brutal p-6">
              <MoodSelector value={moodScore} onChange={setMoodScore} />
            </div>

            <div className="bg-card border border-border shadow-brutal p-6">
              <label className="block text-sm font-semibold mb-2">Qu'as-tu en tête ?</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écris ici..."
                rows={8}
                className="input-brutal resize-none"
                required
              />
            </div>

            <div className="bg-card border border-border shadow-brutal p-6">
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={createEntry.isPending || updateEntry.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {id ? "Mettre à jour" : "Sauvegarder"}
              </Button>
              {id && (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteEntry.isPending}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </form>
        </main>
      </PageTransition>
    </div>
  );
}
