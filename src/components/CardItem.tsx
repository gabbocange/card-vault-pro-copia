// src/components/CardItem.tsx — FILE COMPLETO (con API eBay + View Sold)
import { useMemo, useState } from "react";
import {
  CollectionCard,
  buildEbayQuery,
  conditionLabel,
  formatCurrency,
  gameLabel,
  languageLabel,
  useCollection,
} from "@/lib/collection";
import { Loader2, RefreshCw, TrendingDown, TrendingUp, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PriceHistoryChart } from "./PriceHistoryChart";
import {
  recomputeConsensus,
  searchEbay,
  type EbayItem,
  type EbaySearchResult,
} from "@/lib/ebay.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { addExcluded } from "@/lib/excluded-listings";

interface Props {
  card: CollectionCard;
  onDelete?: (id: string) => void;
}

export function ConditionBadge({ condition, className = "" }: { condition: string; className?: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    raw: { bg: "bg-gray-500/80", text: "text-white", label: "RAW" },
    psa10: { bg: "bg-blue-500/80", text: "text-white", label: "PSA 10" },
    psa9: { bg: "bg-blue-400/80", text: "text-white", label: "PSA 9" },
    bgs10: { bg: "bg-yellow-500/80", text: "text-black", label: "BGS 10" },
    tag10: { bg: "bg-green-500/80", text: "text-white", label: "TAG 10" },
    "graded-other": { bg: "bg-purple-500/80", text: "text-white", label: "GRADED" },
  };
  const c = config[condition] || config.raw;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold font-mono ${c.bg} ${c.text} ${className}`}>
      {c.label}
    </span>
  );
}

export function CardRow({ card, onDelete }: Props) {
  const delta = card.currentPrice - card.acquisitionPrice;
  const pct = card.acquisitionPrice ? (delta / card.acquisitionPrice) * 100 : 0;
  const positive = delta >= 0;
  const [open, setOpen] = useState(false);

  return (
    <div className="grid grid-cols-12 gap-4 items-center px-4 sm:px-6 py-4 hover:bg-foreground/[0.02] transition-colors">
      <div className="col-span-12 sm:col-span-5 flex items-center gap-4 min-w-0">
        <div className="size-12 shrink-0 rounded bg-surface-elevated border border-vault-border overflow-hidden flex items-center justify-center relative">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[10px] text-muted-foreground">
              {card.game === "pokemon" ? "PKMN" : "OP"}
            </span>
          )}
          <ConditionBadge condition={card.condition} className="absolute -bottom-1 -right-1 scale-75" />
        </div>
        <div className="min-w-0">
          <button onClick={() => setOpen(true)} className="text-sm font-medium truncate text-left hover:text-laser-cyan transition-colors">
            {card.name}
          </button>
          <div className="text-[10px] text-muted-foreground font-mono uppercase truncate">
            {card.setName}{card.cardNumber ? ` · ${card.cardNumber}` : ""}
          </div>
        </div>
      </div>
      <div className="col-span-4 sm:col-span-2 text-[10px] font-mono uppercase">
        <span className="px-2 py-1 bg-surface-elevated border border-vault-border rounded">
          {gameLabel(card.game)}
        </span>
      </div>
      <div className="col-span-4 sm:col-span-1 font-mono text-xs font-bold text-laser-cyan">
        {conditionLabel(card.condition)}
        <span className="ml-1 text-[10px] text-laser-magenta">{languageLabel(card.language)}</span>
        {card.quantity > 1 && <span className="ml-1 text-muted-foreground">×{card.quantity}</span>}
      </div>
      <div className="col-span-4 sm:col-span-2 text-right font-mono text-sm tabular-nums">
        {formatCurrency(card.currentPrice * card.quantity)}
      </div>
      <div className="col-span-8 sm:col-span-1 text-right font-mono text-xs tabular-nums">
        <span className={"inline-flex items-center gap-1 " + (positive ? "text-laser-green" : "text-laser-red")}>
          {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
        </span>
      </div>
      <div className="col-span-4 sm:col-span-1 flex justify-end gap-1">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-laser-cyan">
              <TrendingUp className="size-4" />
            </Button>
          </DialogTrigger>
          <CardDetailsDialog card={card} />
        </Dialog>
      </div>
    </div>
  );
}

export function CardDetailsDialog({ card }: { card: CollectionCard }) {
  const { recordPrice, cards } = useCollection();
  const latestCard = cards.find((c) => c.id === card.id) || card;
  const ebay = useServerFn(searchEbay);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EbaySearchResult | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const query = buildEbayQuery(latestCard);

  const live = useMemo(() => {
    if (!result) return null;
    return recomputeConsensus(result.soldItems, result.activeItems, [...excluded]);
  }, [result, excluded]);

  const refresh = async () => {
    setLoading(true); setExcluded(new Set());
    const oldPrice = latestCard.currentPrice;
    try {
      const res = await ebay({ data: { query } }); setResult(res);
      if (res.error) { toast.error(`${res.error}`); return; }
      if (res.consensusPrice == null) { toast.warning("No active listings found"); return; }
      const newPrice = Number(res.consensusPrice.toFixed(2));
      const delta = newPrice - oldPrice;
      const pct = oldPrice > 0 ? ((delta / oldPrice) * 100) : 0;
      recordPrice(latestCard.id, { date: new Date().toISOString(), price: newPrice, source: "ebay-active", sampleSize: res.sampleSize });
      toast.success(`${latestCard.name}: ${formatCurrency(oldPrice)} → ${formatCurrency(newPrice)} (${delta >= 0 ? "+" : ""}${pct.toFixed(1)}%) ${delta >= 0 ? "📈" : "📉"}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const toggleExclude = (id: string) => {
    setExcluded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else { next.add(id); addExcluded(id); } return next; });
  };

  const applyRecomputed = () => {
    if (!live || live.consensusPrice == null) return;
    const oldPrice = latestCard.currentPrice;
    const newPrice = live.consensusPrice;
    const delta = newPrice - oldPrice;
    const pct = oldPrice > 0 ? ((delta / oldPrice) * 100) : 0;
    recordPrice(latestCard.id, { date: new Date().toISOString(), price: newPrice, source: "ebay-active", sampleSize: (result?.soldItems.length ?? 0) + (result?.activeItems.length ?? 0) - excluded.size });
    toast.success(`${latestCard.name}: ${formatCurrency(oldPrice)} → ${formatCurrency(newPrice)} (${delta >= 0 ? "+" : ""}${pct.toFixed(1)}%) ${delta >= 0 ? "📈" : "📉"}`);
  };

  const delta = latestCard.currentPrice - latestCard.acquisitionPrice;
  const pct = latestCard.acquisitionPrice ? (delta / latestCard.acquisitionPrice) * 100 : 0;

  return (
    <DialogContent className="max-w-5xl w-[95vw] bg-surface border-vault-border max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <DialogTitle className="font-mono text-base">{latestCard.name}</DialogTitle>
          <ConditionBadge condition={latestCard.condition} />
        </div>
        <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest">
          {latestCard.setName}{latestCard.cardNumber ? ` · ${latestCard.cardNumber}` : ""} · {conditionLabel(latestCard.condition)} · {languageLabel(latestCard.language)}
        </p>
      </DialogHeader>
      <div className="bg-surface-elevated border border-vault-border rounded-xl p-3">
        <div className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest mb-1">eBay query</div>
        <code className="text-xs font-mono text-laser-cyan break-words">{query}</code>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Stat label="Current" value={formatCurrency(latestCard.currentPrice)} />
        <Stat label="Acquired" value={formatCurrency(latestCard.acquisitionPrice)} />
        <Stat label="ROI" value={`${delta >= 0 ? "+" : ""}${pct.toFixed(2)}%`} accent={delta >= 0 ? "green" : "red"} />
        {latestCard.lastEbayUpdate && <Stat label="Last Update" value={new Date(latestCard.lastEbayUpdate).toLocaleDateString()} />}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-mono text-muted-foreground">Price history</span>
          {latestCard.lastEbayUpdate && <span className="text-[10px] font-mono text-muted-foreground">Updated: {new Date(latestCard.lastEbayUpdate).toLocaleDateString()}</span>}
        </div>
        <PriceHistoryChart history={latestCard.history ?? []} />
      </div>
      <Button onClick={refresh} disabled={loading} className="w-full bg-violet-500 text-white hover:bg-violet-600 font-mono uppercase text-xs tracking-widest rounded-xl">
        {loading ? <><Loader2 className="size-3 mr-2 animate-spin" /> Searching...</> : <><RefreshCw className="size-3 mr-2" /> Update price from eBay</>}
      </Button>

      {/* Pulsante View Sold on eBay */}
      {result && result.ebaySoldUrl && (
        <a
          href={result.ebaySoldUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 border border-white/10 text-white/60 hover:text-white hover:bg-white/5 rounded-xl font-medium text-xs transition-all"
        >
          <ExternalLink className="size-3.5" />
          View Sold on eBay
        </a>
      )}

      {result && !result.error && result.activeItems.length > 0 && (
        <div className="border-t border-vault-border pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label={`Active median (${result.soldSource})`} value={live?.activeMedian != null ? formatCurrency(live.activeMedian) : "—"} />
            <Stat label="Min" value={result.min != null ? formatCurrency(result.min) : "—"} />
            <Stat label="Max" value={result.max != null ? formatCurrency(result.max) : "—"} />
          </div>
          {excluded.size > 0 && (
            <Button onClick={applyRecomputed} variant="outline" className="w-full border-2 border-indigo-500 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-white font-mono uppercase text-xs tracking-widest py-3 rounded-xl">
              Apply recomputed price ({excluded.size} excluded)
            </Button>
          )}
          <div>
            <ListingsBlock title={`Current active listings (${result.activeItems.length})`} items={result.activeItems} excluded={excluded} onToggle={toggleExclude} />
          </div>
        </div>
      )}
    </DialogContent>
  );
}

function ListingsBlock({ title, items, excluded, onToggle }: { title: string; items: EbayItem[]; excluded: Set<string>; onToggle: (id: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mb-2">
        {title} ({items.length})
      </div>
      <ul className="space-y-0.5 max-h-44 overflow-auto pr-1">
        {items.map((it) => {
          const isExcluded = excluded.has(it.id);
          return (
            <li key={it.id} className={"flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] leading-tight " + (isExcluded ? "border-laser-red/40 bg-laser-red/5 opacity-50 line-through" : "border-transparent hover:border-vault-border")}>
              <a href={it.url} target="_blank" rel="noreferrer" className="truncate flex-1 hover:text-laser-cyan min-w-0" title={it.title}>{it.title}</a>
              <span className="font-mono tabular-nums shrink-0 text-[11px]">{formatCurrency(it.price)}</span>
              <button type="button" onClick={() => onToggle(it.id)} className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-laser-red hover:bg-laser-red/10"><X className="size-3" /></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value, accent = "default" }: { label: string; value: string; accent?: "default" | "green" | "red" }) {
  const cls = accent === "green" ? "text-laser-green" : accent === "red" ? "text-laser-red" : "text-foreground";
  return (
    <div className="bg-surface-elevated border border-vault-border rounded-xl p-3">
      <div className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest">{label}</div>
      <div className={`mt-1 font-mono text-sm tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

export function CardListHeader() {
  return (
    <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-sidebar/60 border-b border-vault-border text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
      <div className="col-span-5">Asset</div>
      <div className="col-span-2">Game</div>
      <div className="col-span-1">Grade</div>
      <div className="col-span-2 text-right">Value</div>
      <div className="col-span-1 text-right">ROI</div>
      <div className="col-span-1" />
    </div>
  );
}