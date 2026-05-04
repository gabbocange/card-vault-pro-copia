// src/components/CollectionHeatmap.tsx — FILE COMPLETO (Gen→Dic, sinistra→destra)
import { useMemo } from "react";
import type { CollectionCard } from "@/lib/collection";

interface Props {
  cards: CollectionCard[];
}

export function CollectionHeatmap({ cards }: Props) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const months: { label: string; count: number; value: number; acquisitions: number }[] = [];

    // Da Gennaio (0) a Dicembre (11)
    for (let month = 0; month < 12; month++) {
      const d = new Date(currentYear, month, 1);
      const label = d.toLocaleDateString(undefined, { month: "short" });
      const monthStart = new Date(currentYear, month, 1).getTime();
      const monthEnd = new Date(currentYear, month + 1, 0, 23, 59, 59).getTime();

      const acquired = cards.filter((c) => {
        const t = +new Date(c.acquiredAt);
        return t >= monthStart && t <= monthEnd;
      });

      months.push({
        label,
        count: acquired.length,
        value: acquired.reduce((s, c) => s + c.acquisitionPrice * c.quantity, 0),
        acquisitions: acquired.length,
      });
    }
    return months;
  }, [cards]);

  const maxValue = Math.max(...heatmapData.map((m) => m.value), 1);

  return (
    <div className="glass-card p-4 sm:p-6 rounded">
      <h3 className="text-xs font-semibold uppercase tracking-widest font-mono mb-4">
        Acquisition Heatmap ({new Date().getFullYear()})
      </h3>
      <div className="grid grid-cols-12 gap-1">
        {heatmapData.map((month) => {
          const intensity = month.value / maxValue;
          const bgOpacity = Math.max(0.05, intensity * 0.8);
          return (
            <div
              key={month.label}
              className="aspect-square rounded flex flex-col items-center justify-center text-[8px] font-mono relative group"
              style={{
                backgroundColor: `rgba(6, 182, 212, ${bgOpacity})`,
                border: month.count > 0 ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid var(--vault-border)",
              }}
            >
              <span className="text-muted-foreground">{month.label}</span>
              {month.count > 0 && (
                <span className="text-laser-cyan font-bold">{month.count}</span>
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-surface border border-vault-border rounded px-2 py-1 text-[10px] whitespace-nowrap z-10 text-white">
                {month.label}: {month.acquisitions} cards · ${month.value.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end text-[9px] text-muted-foreground font-mono">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0.05, 0.2, 0.4, 0.6, 0.8].map((op) => (
            <div
              key={op}
              className="size-3 rounded"
              style={{ backgroundColor: `rgba(6, 182, 212, ${op})`, border: "1px solid rgba(6, 182, 212, 0.3)" }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}