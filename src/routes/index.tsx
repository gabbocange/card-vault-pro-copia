// src/routes/index.tsx — FILE COMPLETO (con CurrencySwitcher)
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCollection, computeStats, formatCurrency } from "@/lib/collection";
import { CardListHeader, CardRow } from "@/components/CardItem";
import { CollectionTimeline } from "@/components/CollectionTimeline";
import { CollectionHeatmap } from "@/components/CollectionHeatmap";
import { PortfolioDiversification } from "@/components/PortfolioDiversification";
import { CardComparator } from "@/components/CardComparator";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { ArrowUpRight, Sparkles, Anchor, TrendingUp, Plus, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Card Vault Pro" },
      { name: "description", content: "Portfolio overview and analytics." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { cards, removeCard } = useCollection();
  const stats = computeStats(cards);
  const recent = [...cards].sort((a, b) => +new Date(b.acquiredAt) - +new Date(a.acquiredAt)).slice(0, 5);
  const split = stats.totalUnits > 0 ? (stats.pokemonCount / stats.totalUnits) * 100 : 0;

  return (
    <AppShell>
      <Toaster />
      <div className="p-6 lg:p-8 space-y-8 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Portfolio overview and recent activity</p>
          </div>
          <div className="flex items-center gap-3">
            <CurrencySwitcher />
            <Button asChild className="bg-violet-500 text-white hover:bg-violet-600 font-semibold text-sm rounded-xl px-5 py-2.5 shadow-lg shadow-violet-500/30">
              <Link to="/add"><Plus className="size-4 mr-2" /> Add Card</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-widget p-5">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-white uppercase tracking-wider">Portfolio Value</span><div className="size-10 rounded-xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center text-yellow-400"><Wallet className="size-5" /></div></div>
            <div className="text-2xl font-bold font-mono tabular-nums text-yellow-400">{formatCurrency(stats.totalValue)}</div>
            <div className="text-xs mt-2 font-medium text-green-400">{stats.delta >= 0 ? "+" : ""}{stats.deltaPct.toFixed(2)}%</div>
          </div>
          <div className="glass-widget p-5">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-white uppercase tracking-wider">Unrealized P/L</span><div className="size-10 rounded-xl bg-green-500/15 border border-green-500/20 flex items-center justify-center text-green-400"><TrendingUp className="size-5" /></div></div>
            <div className="text-2xl font-bold font-mono tabular-nums text-green-400">{formatCurrency(stats.delta)}</div>
            <div className="text-xs mt-2 font-medium text-green-400">{stats.delta >= 0 ? "+" : ""}{stats.deltaPct.toFixed(2)}%</div>
          </div>
          <div className="glass-widget p-5">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-white uppercase tracking-wider">Pokémon Units</span><div className="size-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400"><Sparkles className="size-5" /></div></div>
            <div className="text-2xl font-bold font-mono tabular-nums text-sky-400">{stats.pokemonCount}</div>
            <div className="text-xs mt-2 font-medium text-green-400">{split.toFixed(0)}% of portfolio</div>
          </div>
          <div className="glass-widget p-5">
            <div className="flex items-center justify-between mb-3"><span className="text-xs font-medium text-white uppercase tracking-wider">One Piece Units</span><div className="size-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400"><Anchor className="size-5" /></div></div>
            <div className="text-2xl font-bold font-mono tabular-nums text-violet-400">{stats.onepieceCount}</div>
            <div className="text-xs mt-2 font-medium text-green-400">{(100 - split).toFixed(0)}% of portfolio</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-widget p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4"><div><h2 className="text-sm font-semibold text-white">Portfolio Timeline</h2><p className="text-xs text-white/70 mt-0.5">Total value over time</p></div></div>
            <CollectionTimeline />
          </div>
          <div className="space-y-6">
            <div className="glass-widget p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Collection Density</h3>
              <div className="space-y-4">
                <div><div className="flex justify-between text-xs mb-2"><span className="text-white/70">Pokémon TCG</span><span className="text-white font-mono">{split.toFixed(0)}%</span></div><div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden"><div className="h-full bg-sky-400 rounded-full" style={{ width: `${split}%` }} /></div></div>
                <div><div className="flex justify-between text-xs mb-2"><span className="text-white/70">One Piece TCG</span><span className="text-white font-mono">{(100 - split).toFixed(0)}%</span></div><div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden"><div className="h-full bg-violet-400 rounded-full" style={{ width: `${100 - split}%` }} /></div></div>
              </div>
            </div>
            <div className="glass-widget p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Active Assets</h3>
              <div className="text-3xl font-bold text-white font-mono">{stats.totalUnits}</div>
              <p className="text-xs text-white/70 mt-1">Total cards in collection</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-surface-elevated rounded-xl p-3 text-center"><div className="text-lg font-bold text-sky-400 font-mono">{stats.pokemonCount}</div><div className="text-white/70 mt-1">Pokémon</div></div>
                <div className="bg-surface-elevated rounded-xl p-3 text-center"><div className="text-lg font-bold text-violet-400 font-mono">{stats.onepieceCount}</div><div className="text-white/70 mt-1">One Piece</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-widget overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-white/5 flex justify-between items-center">
            <div><h2 className="text-sm font-semibold text-white">Recent Acquisitions</h2><p className="text-xs text-white/70 mt-0.5">Your latest additions</p></div>
            <Link to="/transactions" className="text-xs font-medium text-violet-400 hover:text-violet-300 inline-flex items-center gap-1">View all <ArrowUpRight className="size-3" /></Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-12 text-center"><p className="text-sm text-muted-foreground mb-4">Your vault is empty.</p><Button asChild className="bg-violet-500 text-white hover:bg-violet-600 font-medium text-sm rounded-xl"><Link to="/add"><Plus className="size-4 mr-2" /> Add your first card</Link></Button></div>
          ) : (
            <div><CardListHeader /><div className="divide-y divide-white/5">{recent.map((c) => <CardRow key={c.id} card={c} onDelete={removeCard} />)}</div></div>
          )}
        </div>

        {cards.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-2"><TrendingUp className="size-5 text-violet-400" /><h2 className="text-lg font-semibold text-white">Portfolio Analytics</h2></div>
            <div className="glass-card-analytics"><CollectionHeatmap cards={cards} /></div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card-analytics"><PortfolioDiversification cards={cards} groupBy="set" /></div>
              <div className="glass-card-analytics"><PortfolioDiversification cards={cards} groupBy="condition" /></div>
            </div>
            <div className="glass-card-analytics"><CardComparator cards={cards} /></div>
          </div>
        )}
      </div>
    </AppShell>
  );
}