// src/components/CollectionTimeline.tsx — FILE COMPLETO (con linea Cost Basis e Portfolio Value)
import { Area, AreaChart, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Line } from "recharts";
import { useEffect, useState, useMemo } from "react";
import { useCollection, useTimeline, recordCollectionSnapshot, formatCurrency } from "@/lib/collection";

type TimeRange = "1D" | "7D" | "1M" | "6M" | "1Y" | "ALL";

export function CollectionTimeline() {
  const { cards, hydrated } = useCollection();
  const timeline = useTimeline();
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (!hydrated) return; recordCollectionSnapshot(cards); }, [hydrated, cards]);

  const filteredData = useMemo(() => {
    if (!mounted || timeline.length < 2) return [];
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
    return timeline
      .filter((s) => +new Date(s.date) >= cutoff)
      .map((s) => ({
        date: new Date(s.date).getTime(),
        value: s.totalValue,
        cost: s.totalCost,
        label: new Date(s.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      }));
  }, [timeline, timeRange, mounted]);

  if (!mounted) return <div className="h-44" />;

  if (filteredData.length < 2) {
    return (
      <div className="space-y-3">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        <div className="h-44 flex items-center justify-center text-[10px] uppercase font-medium text-white/50 border border-dashed border-white/10 rounded-xl">
          Building timeline — check back tomorrow
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      <div className="h-44 w-full">
        <ResponsiveContainer>
          <ComposedChart data={filteredData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#ffffff" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#ffffff" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} width={56} />
            <Tooltip
              contentStyle={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-mono)", fontSize: "12px", borderRadius: "8px", color: "#ffffff" }}
              labelStyle={{ color: "#cbd5e1" }}
              formatter={(v: number, name: string) => [formatCurrency(v), name === "value" ? "Portfolio Value" : "Cost Basis"]}
            />
            {/* Area: Portfolio Value (viola) */}
            <Area type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} fill="url(#valueFill)" isAnimationActive={false} />
            {/* Linea: Cost Basis (bianco tratteggiato) */}
            <Line type="monotone" dataKey="cost" stroke="#ffffff" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 justify-center">
        <div className="flex items-center gap-2 text-[10px] font-medium text-white/70">
          <div className="size-2.5 rounded-full bg-[#a78bfa]" /> Portfolio Value
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium text-white/70">
          <div className="w-4 h-0.5 bg-white rounded-full" style={{ borderTop: "2px dashed #ffffff" }} /> Cost Basis
        </div>
      </div>
    </div>
  );
}

function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const ranges: TimeRange[] = ["1D", "7D", "1M", "6M", "1Y", "ALL"];
  return (
    <div className="flex gap-1 p-0.5 bg-surface-elevated border border-white/10 rounded-lg w-fit">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-all ${
            value === range ? "bg-violet-500 text-white shadow-sm" : "text-white/50 hover:text-white"
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}