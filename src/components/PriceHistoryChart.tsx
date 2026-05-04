// src/components/PriceHistoryChart.tsx — FILE COMPLETO (con selettore temporale)
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMemo, useState } from "react";
import type { PriceSnapshot } from "@/lib/collection-types";
import { formatCurrency } from "@/lib/collection";

type TimeRange = "1D" | "7D" | "1M" | "6M" | "1Y" | "ALL";

interface Props {
  history: PriceSnapshot[];
  height?: number;
  color?: string;
}

export function PriceHistoryChart({ history, height = 160, color = "var(--laser-cyan)" }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  const filteredData = useMemo(() => {
    if (!history || history.length < 2) return [];

    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      "1D": 1 * 24 * 60 * 60 * 1000,
      "7D": 7 * 24 * 60 * 60 * 1000,
      "1M": 30 * 24 * 60 * 60 * 1000,
      "6M": 180 * 24 * 60 * 60 * 1000,
      "1Y": 365 * 24 * 60 * 60 * 1000,
      "ALL": Infinity,
    };
    const cutoff = now - ranges[timeRange];

    return history
      .filter((s) => +new Date(s.date) >= cutoff)
      .map((s) => ({
        date: new Date(s.date).getTime(),
        price: s.price,
        label: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      }));
  }, [history, timeRange]);

  if (!history || history.length < 2) {
    return (
      <div className="space-y-3">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        <div
          className="flex items-center justify-center text-[10px] uppercase font-mono text-muted-foreground border border-dashed border-vault-border rounded"
          style={{ height }}
        >
          Not enough data points yet
        </div>
      </div>
    );
  }

  if (filteredData.length < 2) {
    return (
      <div className="space-y-3">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        <div
          className="flex items-center justify-center text-[10px] uppercase font-mono text-muted-foreground border border-dashed border-vault-border rounded"
          style={{ height }}
        >
          No data in selected range
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <LineChart data={filteredData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--vault-border)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--vault-border)" }}
              tickFormatter={(v) => `$${Number(v).toFixed(0)}`}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--vault-border)",
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                borderRadius: 4,
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(v: number) => [formatCurrency(v), "Price"]}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 2, fill: color }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const ranges: TimeRange[] = ["1D", "7D", "1M", "6M", "1Y", "ALL"];

  return (
    <div className="flex gap-1 p-0.5 bg-surface-elevated border border-vault-border rounded w-fit">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-colors ${
            value === range
              ? "bg-laser-cyan text-background"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}