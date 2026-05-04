// src/components/PortfolioDiversification.tsx — FILE COMPLETO (tooltip testo bianco forzato)
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency, type CollectionCard } from "@/lib/collection";

interface Props {
  cards: CollectionCard[];
  groupBy: "set" | "rarity" | "condition" | "game";
}

const COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

export function PortfolioDiversification({ cards, groupBy }: Props) {
  const data = useMemo(() => {
    const groups: Record<string, number> = {};

    cards.forEach((card) => {
      let key: string;
      switch (groupBy) {
        case "set":
          key = card.setName || "Unknown Set";
          break;
        case "rarity":
          key = card.rarity || "Unknown";
          break;
        case "condition":
          key = card.condition === "raw" ? "RAW" : card.condition.toUpperCase();
          break;
        case "game":
          key = card.game === "pokemon" ? "Pokémon" : "One Piece";
          break;
        default:
          key = "Other";
      }
      groups[key] = (groups[key] || 0) + card.currentPrice * card.quantity;
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [cards, groupBy]);

  if (data.length === 0) return null;

  return (
    <div className="glass-card p-4 sm:p-6 rounded">
      <h3 className="text-xs font-semibold uppercase tracking-widest font-mono mb-4">
        Portfolio by {groupBy}
      </h3>
      <div className="h-48 [&_.recharts-tooltip-label]:!text-white [&_.recharts-tooltip-item]:!text-white [&_.recharts-tooltip-item-list]:!text-white">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={70}
              innerRadius={35}
              dataKey="value"
              isAnimationActive={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "6px",
                padding: "8px 12px",
                color: "#ffffff",
              }}
              itemStyle={{ color: "#ffffff" }}
              labelStyle={{ color: "#ffffff" }}
              formatter={(v: number) => [formatCurrency(v), ""]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1.5">
        {data.slice(0, 5).map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 text-[10px] font-mono">
            <div
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="truncate text-muted-foreground flex-1">{item.name}</span>
            <span className="tabular-nums text-white">{formatCurrency(item.value)}</span>
            <span className="text-muted-foreground w-10 text-right">
              {((item.value / data.reduce((s, d) => s + d.value, 0)) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}