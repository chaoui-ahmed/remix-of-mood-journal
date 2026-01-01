import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { PixelGrid } from "@/components/journal/PixelGrid";
import { EntryCard } from "@/components/journal/EntryCard";
import { useEntries } from "@/hooks/useEntries";
import { Button } from "@/components/ui/button";

export default function Index() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: entries = [], isLoading } = useEntries(year);
  const navigate = useNavigate();

  const recentEntries = entries.slice(0, 3);

  const handleDayClick = (date: Date, entry?: { id: string }) => {
    if (entry) {
      navigate(`/entry/${entry.id}`);
    } else {
      navigate(`/entry?date=${format(date, "yyyy-MM-dd")}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Ta Grille de Pixels</h1>
            <p className="text-muted-foreground">Chaque carré représente une journée. Clique pour voir ou écrire.</p>
          </div>

          <div className="bg-card border border-border shadow-brutal p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" size="icon" onClick={() => setYear(year - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xl font-bold">{year}</span>
              <Button variant="outline" size="icon" onClick={() => setYear(year + 1)} disabled={year >= currentYear}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground">Chargement...</div>
            ) : (
              <PixelGrid entries={entries} year={year} onDayClick={handleDayClick} />
            )}

            <div className="flex gap-4 mt-6 flex-wrap">
              {[1, 2, 3, 4, 5].map((score) => (
                <div key={score} className="flex items-center gap-2">
                  <div className={`w-4 h-4 border border-border mood-${score}`} />
                  <span className="text-xs text-muted-foreground">{score}</span>
                </div>
              ))}
            </div>
          </div>

          {recentEntries.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Entrées récentes</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recentEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} onClick={() => navigate(`/entry/${entry.id}`)} />
                ))}
              </div>
            </div>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
