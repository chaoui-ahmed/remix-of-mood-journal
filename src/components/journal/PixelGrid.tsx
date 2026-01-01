import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, startOfYear, eachDayOfInterval, endOfYear, getDay, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Entry {
  id: string;
  created_at: string;
  mood_score: number;
}

interface PixelGridProps {
  entries: Entry[];
  year: number;
  onDayClick: (date: Date, entry?: Entry) => void;
}

const moodClasses: Record<number, string> = {
  1: "bg-mood-1",
  2: "bg-mood-2",
  3: "bg-mood-3",
  4: "bg-mood-4",
  5: "bg-mood-5",
};

const weekDays = ["D", "L", "M", "M", "J", "V", "S"];
const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export function PixelGrid({ entries, year, onDayClick }: PixelGridProps) {
  const days = useMemo(() => {
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 0, 1));
    return eachDayOfInterval({ start, end });
  }, [year]);

  const entryMap = useMemo(() => {
    const map = new Map<string, Entry>();
    entries.forEach((entry) => {
      const dateKey = format(new Date(entry.created_at), "yyyy-MM-dd");
      // Keep the entry with highest mood_score for each day
      const existing = map.get(dateKey);
      if (!existing || entry.mood_score > existing.mood_score) {
        map.set(dateKey, entry);
      }
    });
    return map;
  }, [entries]);

  // Organize days into weeks
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    // Pad the first week with nulls
    const firstDayOfWeek = getDay(days[0]);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    days.forEach((day) => {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    // Pad the last week with nulls
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    result.push(currentWeek);

    return result;
  }, [days]);

  // Get month labels and their starting column
  const monthLabels = useMemo(() => {
    const labels: { month: string; startWeek: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstDay = week.find((d) => d !== null);
      if (firstDay) {
        const month = firstDay.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: months[month], startWeek: weekIndex });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="flex mb-2 ml-8">
          {monthLabels.map(({ month, startWeek }, index) => (
            <div
              key={`${month}-${index}`}
              className="text-xs font-medium text-muted-foreground"
              style={{
                marginLeft: index === 0 ? startWeek * 14 : (startWeek - monthLabels[index - 1].startWeek) * 14 - 20,
                minWidth: 40,
              }}
            >
              {month}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2">
            {weekDays.map((day, i) => (
              <div
                key={i}
                className="w-4 h-3 text-[10px] font-medium text-muted-foreground flex items-center"
              >
                {i % 2 === 1 ? day : ""}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={`empty-${dayIndex}`} className="w-3 h-3" />;
                  }

                  const dateKey = format(day, "yyyy-MM-dd");
                  const entry = entryMap.get(dateKey);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <motion.button
                      key={dateKey}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: weekIndex * 0.005,
                        duration: 0.2,
                      }}
                      onClick={() => onDayClick(day, entry)}
                      className={cn(
                        "w-3 h-3 border transition-all duration-150 hover:scale-125",
                        entry
                          ? moodClasses[entry.mood_score]
                          : "bg-secondary",
                        isToday ? "border-primary border-2" : "border-border",
                        entry && "shadow-brutal-sm hover:shadow-brutal"
                      )}
                      title={format(day, "d MMMM yyyy", { locale: fr })}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
