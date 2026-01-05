import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { PixelGrid } from "@/components/journal/PixelGrid";
import { EntryCard } from "@/components/journal/EntryCard";
import { useEntries } from "@/hooks/useEntries";
import { format } from "date-fns";

export default function Index() {
  // On récupère toutes les entrées, plus besoin de filtrer par année ici car PixelGrid gère le mois
  const { data: entries = [], isLoading } = useEntries();
  const navigate = useNavigate();

  const recentEntries = entries.slice(0, 3);

  const handleDayClick = (date: Date, entry?: { id: string }) => {
    if (entry) {
      navigate(`/entry/${entry.id}`);
    } else {
      // On envoie la date sélectionnée à la page de création
      navigate(`/entry?date=${format(date, "yyyy-MM-dd")}`);
    }
  };

  return (
    // ❌ "bg-background" retiré
    <div className="min-h-screen">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Mes Pixels ✨
            </h1>
            <p className="text-muted-foreground font-medium italic">
               Chaque carré est un souvenir. Remplis-les de couleurs ! 🎨
            </p>
          </div>
          
          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-muted-foreground">Chargement...</div>
          ) : (
            // On a retiré la prop 'year' car PixelGrid gère le mois actuel maintenant
            <PixelGrid entries={entries} onDayClick={handleDayClick} />
          )}

          {recentEntries.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>📝</span> Derniers souvenirs
              </h2>
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