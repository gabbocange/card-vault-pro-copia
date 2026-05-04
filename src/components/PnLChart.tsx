// src/components/PnLChart.tsx — FILE COMPLETO (LINEE VISIBILI)
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, type SaleRecord } from "@/lib/collection";

type TimeRange = "1D" | "7D" | "1M" | "6M" | "1Y" | "ALL";

interface Props {
  sales: SaleRecord[];
}

export function PnLChart({ sales }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>("ALL");

  const data = useMemo(() => {
    if (sales.length === 0) return [];
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
    const sorted = [...sales].filter((s) => +new Date(s.soldAt) >= cutoff).sort((a, b) => +new Date(a.soldAt) - +new Date(b.soldAt));
    let cumulativeProfit = 0;
    let cumulativeRevenue = 0;
    return sorted.map((sale) => {
      cumulativeProfit += sale.netProfit;
      cumulativeRevenue += sale.salePrice;
      return {
        date: new Date(sale.soldAt).getTime(),
        label: new Date(sale.soldAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        profit: Number(cumulativeProfit.toFixed(2)),
        revenue: Number(cumulativeRevenue.toFixed(2)),
        cardName: sale.cardName,
        singleProfit: sale.netProfit,
      };
    });
  }, [sales, timeRange]);

  if (data.length < 1) {
    return (
      <div className="space-y-3">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        <div className="text-center text-[10px] uppercase font-medium text-white/50 py-8">Not enough data for selected range</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Cumulative P&L</h2>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#ffffff" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#ffffff" }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} width={56} />
            <Tooltip
              contentStyle={{ background: "#131720", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "var(--font-mono)", fontSize: "12px", borderRadius: "8px", color: "#ffffff" }}
              labelStyle={{ color: "#cbd5e1" }}
              formatter={(v: number, name: string) => [formatCurrency(v), name === "profit" ? "Cumulative Profit" : "Cumulative Revenue"]}
            />
            {/* Revenue - viola */}
            <Area type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={2} fill="url(#revenueFill)" isAnimationActive={false} dot={{ r: 3, fill: "#a78bfa" }} />
            {/* Profit - verde */}
            <Area type="monotone" dataKey="profit" stroke="#4ade80" strokeWidth={3} fill="url(#profitFill)" isAnimationActive={false} dot={{ r: 4, fill: "#4ade80", stroke: "#4ade80", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 justify-center">
        <div className="flex items-center gap-2 text-[10px] font-medium text-white/70">
          <div className="size-2.5 rounded-full bg-[#4ade80]" /> Cumulative Profit
        </div>
        <div className="flex items-center gap-2 text-[10px] font-medium text-white/70">
          <div className="size-2.5 rounded-full bg-[#a78bfa]" /> Cumulative Revenue
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