import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getDay, isValid } from "date-fns";
import { Navigation } from "@/components/layout/Navigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { useEntries } from "@/hooks/useEntries";

const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const moodColors = ["#FECACA", "#FED7AA", "#FEF08A", "#BBF7D0", "#E9D5FF"];

export default function Trends() {
  const { data: entries = [], isLoading } = useEntries();

  const weekdayData = useMemo(() => {
    const totals: Record<number, { sum: number; count: number }> = {};
    for (let i = 0; i < 7; i++) totals[i] = { sum: 0, count: 0 };

    entries.forEach((entry) => {
      // --- CORRECTION CRITIQUE ICI ---
      if (!entry.created_at) return; // Ignore si pas de date

      const dateObj = new Date(entry.created_at);
      
      // Si la date est invalide, on passe à l'entrée suivante
      if (!isValid(dateObj)) return; 

      const day = getDay(dateObj);
      // -------------------------------
      
      totals[day].sum += entry.mood_score;
      totals[day].count += 1;
    });

    return dayNames.map((name, i) => ({
      day: name,
      average: totals[i].count > 0 ? totals[i].sum / totals[i].count : 0,
      count: totals[i].count,
    }));
  }, [entries]);

  const overallAverage = useMemo(() => {
    if (entries.length === 0) return 0;
    return entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length;
  }, [entries]);

  const getMoodColor = (value: number) => {
    const index = Math.min(Math.floor(value) - 1, 4);
    return moodColors[Math.max(0, index)];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Tendances</h1>
          <p className="text-muted-foreground mb-8">Analyse de ton humeur au fil du temps</p>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="bg-card border border-border shadow-brutal p-6">
              <p className="text-sm text-muted-foreground mb-1">Entrées totales</p>
              <p className="text-4xl font-bold">{entries.length}</p>
            </div>
            <div className="bg-card border border-border shadow-brutal p-6">
              <p className="text-sm text-muted-foreground mb-1">Moyenne générale</p>
              <p className="text-4xl font-bold">{overallAverage.toFixed(1)}</p>
            </div>
            <div className="bg-card border border-border shadow-brutal p-6" style={{ backgroundColor: getMoodColor(overallAverage) }}>
              <p className="text-sm text-foreground/70 mb-1">Humeur dominante</p>
              <p className="text-4xl font-bold">{Math.round(overallAverage)}/5</p>
            </div>
          </div>

          <div className="bg-card border border-border shadow-brutal p-6">
            <h2 className="text-xl font-bold mb-6">Humeur par jour de la semaine</h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Chargement...</div>
            ) : entries.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Pas encore de données. Commence à écrire !
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekdayData}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 5]} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border shadow-brutal p-3">
                            <p className="font-semibold">{data.day}</p>
                            <p className="text-sm">Moyenne: {data.average.toFixed(1)}</p>
                            <p className="text-sm text-muted-foreground">{data.count} entrées</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="average" radius={0}>
                    {weekdayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getMoodColor(entry.average || 3)} stroke="#000" strokeWidth={1} />
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