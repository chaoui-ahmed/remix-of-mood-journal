import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
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
  
  // Récupère la date de l'URL ou utilise aujourd'hui
  const urlDate = searchParams.get("date");
  const [date, setDate] = useState(urlDate || new Date().toISOString().split('T')[0]);

  // ✅ CORRECTION MAJEURE : Réinitialisation du formulaire
  useEffect(() => {
    if (existingEntry) {
      // Si on modifie un pixel existant, on remplit les champs
      setContent(existingEntry.content || "");
      setMoodScore(existingEntry.mood_score || 3);
      setHashtags(existingEntry.hashtags || []);
      // On s'assure que la date affichée est celle de l'entrée
      if (existingEntry.date) setDate(existingEntry.date);
    } else {
      // Si c'est une nouvelle entrée (ou changement de date), ON VIDE TOUT
      setContent("");
      setMoodScore(3);
      setHashtags([]);
      // On remet la date de l'URL ou d'aujourd'hui
      if (urlDate) setDate(urlDate);
    }
  }, [existingEntry, id, urlDate]);

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
    // ✅ CORRECTION : Suppression de 'bg-background' pour voir la couleur du thème
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