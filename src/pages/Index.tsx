import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { PixelGrid } from "@/components/journal/PixelGrid"; 
import { EntryCard } from "@/components/journal/EntryCard";
import { useEntries } from "@/hooks/useEntries";
import { Button } from "@/components/ui/button";
import { ValentineGame } from "@/components/valentine/ValentineGame"; // AJOUT ICI

export default function Index() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: entries = [], isLoading } = useEntries(); 
  const navigate = useNavigate();

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const isFuture = addMonths(currentDate, 1) > new Date();

  const handleDayClick = (date: Date, entry?: { id: string }) => {
    if (entry) {
      navigate(`/entry/${entry.id}`);
    } else {
      navigate(`/entry?date=${format(date, "yyyy-MM-dd")}`);
    }
  };

  const recentEntries = entries.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* AJOUT DU JEU ICI - Il ne s'affichera que si la logique dans le composant le décide */}
      <ValentineGame />
      
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-orange-500 mb-2">
              Mes Pixels ✨
            </h1>
            <div className="text-muted-foreground font-medium italic mb-8">
               ✨✨✨✨✨ <p>Bon courage pour demain ❤️ ❤️ ❤️</p>
            </div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-white/20 shadow-brutal p-6 mb-8 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-white/50 rounded-full">
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </Button>
              
              <span className="text-xl font-black uppercase tracking-widest text-gray-800">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
              </span>
              
              <Button variant="ghost" size="icon" onClick={nextMonth} disabled={isFuture} className="hover:bg-white/50 rounded-full disabled:opacity-30">
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </Button>
            </div>

            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Chargement...</div>
            ) : (
              <PixelGrid 
                entries={entries} 
                currentDate={currentDate} 
                onDayClick={handleDayClick} 
              />
            )}
            
            <div className="flex justify-center gap-3 mt-8 flex-wrap">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full bg-mood-${s}`} />
                </div>
              ))}
            </div>
          </div>

          {recentEntries.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>⏳</span> Récents
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