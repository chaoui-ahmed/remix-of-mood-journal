import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getDay, isValid, subDays, subMonths, subYears, isAfter } from "date-fns";
import { Search, Calendar, Filter } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { useEntries } from "@/hooks/useEntries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const moodColors = ["#FECACA", "#FED7AA", "#FEF08A", "#BBF7D0", "#E9D5FF"];

// Définition des types pour les filtres
type Period = "all" | "week" | "month" | "year";

export default function Trends() {
  const { data: entries = [], isLoading } = useEntries();
  
  // États pour les filtres
  const [period, setPeriod] = useState<Period>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Filtrage des données (Coeur de la logique)
  const filteredEntries = useMemo(() => {
    let data = entries;
    const now = new Date();

    // Filtre par Période
    if (period !== "all") {
      const cutoffDate = 
        period === "week" ? subDays(now, 7) :
        period === "month" ? subMonths(now, 1) :
        subYears(now, 1);

      data = data.filter(entry => {
        if (!entry.date) return false;
        return isAfter(new Date(entry.date), cutoffDate);
      });
    }

    // Filtre par Hashtag
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().replace("#", "");
      data = data.filter(entry => 
        entry.hashtags?.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return data;
  }, [entries, period, searchTerm]);

  // 2. Calcul des stats par jour (sur les données filtrées)
  const weekdayData = useMemo(() => {
    const totals: Record<number, { sum: number; count: number }> = {};
    for (let i = 0; i < 7; i++) totals[i] = { sum: 0, count: 0 };

    filteredEntries.forEach((entry) => {
      if (!entry.date) return;
      const dateObj = new Date(entry.date);
      
      if (isValid(dateObj)) {
        const day = getDay(dateObj);
        totals[day].sum += Number(entry.mood_score);
        totals[day].count += 1;
      }
    });

    return dayNames.map((name, i) => ({
      day: name,
      average: totals[i].count > 0 ? totals[i].sum / totals[i].count : 0,
      count: totals[i].count,
    }));
  }, [filteredEntries]);

  // 3. Calcul de la moyenne générale
  const overallAverage = useMemo(() => {
    if (filteredEntries.length === 0) return 0;
    return filteredEntries.reduce((sum, e) => sum + Number(e.mood_score), 0) / filteredEntries.length;
  }, [filteredEntries]);

  const getMoodColor = (value: number) => {
    const index = Math.min(Math.floor(value) - 1, 4);
    return moodColors[Math.max(0, index)];
  };

  return (
    // ❌ PAS de bg-background ici, pour laisser voir la couleur personnalisée
    <div className="min-h-screen"> 
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black mb-1">Analytics</h1>
              <p className="text-muted-foreground">Tes statistiques en temps réel</p>
            </div>
            
            {/* Barre de Recherche Hashtag */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Chercher un #tag..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Filtres de Période */}
          <div className="flex flex-wrap gap-2 mb-8 bg-card/80 p-2 rounded-lg border border-border w-fit shadow-sm">
            {[
              { id: "week", label: "7 Jours" },
              { id: "month", label: "Mois" },
              { id: "year", label: "Année" },
              { id: "all", label: "Tout" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setPeriod(filter.id as Period)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  period === filter.id 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-secondary text-muted-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Cartes de Stats */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="bg-card/90 border border-border shadow-brutal p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Filter className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Entrées</p>
              </div>
              <p className="text-4xl font-black">{filteredEntries.length}</p>
            </div>

            <div className="bg-card/90 border border-border shadow-brutal p-6 rounded-xl backdrop-blur-sm">
               <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Moyenne</p>
              </div>
              <p className="text-4xl font-black">{overallAverage.toFixed(1)}<span className="text-lg text-muted-foreground font-normal">/5</span></p>
            </div>

            <div 
              className="bg-card border border-border shadow-brutal p-6 rounded-xl transition-colors duration-500" 
              style={{ backgroundColor: getMoodColor(overallAverage) }}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-black/60 mb-2">Dominante</p>
              <p className="text-4xl font-black text-black">
                {Math.round(overallAverage) || "-"}/5
              </p>
            </div>
          </div>

          {/* Graphique */}
          <div className="bg-card/90 border border-border shadow-brutal p-6 rounded-xl backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6">Humeur par jour</h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Chargement...</div>
            ) : filteredEntries.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <p>Aucune donnée pour cette période 🤷‍♂️</p>
                {searchTerm && <p className="text-sm">Essaie un autre hashtag !</p>}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekdayData}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 5]} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border-2 border-black shadow-brutal p-3 rounded-lg">
                            <p className="font-bold mb-1">{data.day}</p>
                            <p className="text-sm">Moyenne: <span className="font-bold">{data.average.toFixed(1)}</span></p>
                            <p className="text-xs text-muted-foreground">{data.count} entrées</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                    {weekdayData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getMoodColor(entry.average || 3)} 
                        stroke="black" 
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}