// src/routes/transactions.tsx — FILE COMPLETO (con condition salvata)
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCollection, useSales, formatCurrency, computeSalesStats, type SaleRecord } from "@/lib/collection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Plus, TrendingUp, DollarSign, Receipt, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PnLChart } from "@/components/PnLChart";
import { ChainView } from "@/components/ChainView";
import { ShareCard } from "@/components/ShareCard";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transaction Log · Card Vault Pro" }, { name: "description", content: "Track your card flips and P&L." }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { cards } = useCollection();
  const { sales, addSale, removeSale } = useSales();
  const stats = computeSalesStats(sales);

  return (
    <AppShell>
      <Toaster />
      <div className="p-6 lg:p-8 space-y-8 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Transaction Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sales.length} flip{sales.length !== 1 ? "s" : ""} · Profit:{" "}
              <span className={stats.totalProfit >= 0 ? "text-green-400" : "text-red-400"}>{formatCurrency(stats.totalProfit)}</span>
            </p>
          </div>
          <AddSaleDialog cards={cards} onAdd={addSale} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card-analytics !p-4"><SummaryCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="size-4" />} /></div>
          <div className="glass-card-analytics !p-4"><SummaryCard label="Total Costs" value={formatCurrency(stats.totalCosts)} icon={<Receipt className="size-4" />} /></div>
          <div className="glass-card-analytics !p-4"><SummaryCard label="Net Profit" value={formatCurrency(stats.totalProfit)} icon={<TrendingUp className="size-4" />} accent={stats.totalProfit >= 0 ? "green" : "red"} /></div>
          <div className="glass-card-analytics !p-4"><SummaryCard label="Cash Profit" value={formatCurrency(stats.cashProfit)} icon={<DollarSign className="size-4" />} accent="green" /></div>
        </div>

        {sales.length > 0 && (
          <div className="glass-card-analytics"><PnLChart sales={sales} /></div>
        )}

        <ChainView />

        <div className="glass-card-analytics !p-0 overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
            <div className="col-span-3">Card</div>
            <div className="col-span-2">Sold Date</div>
            <div className="col-span-1">Kind</div>
            <div className="col-span-2 text-right">Sale Price</div>
            <div className="col-span-1 text-right">Costs</div>
            <div className="col-span-1 text-right">Profit</div>
            <div className="col-span-1 text-right">ROI</div>
            <div className="col-span-1" />
          </div>
          {sales.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">No transactions yet.</p>
              <AddSaleDialog cards={cards} onAdd={addSale}>
                <Button className="bg-violet-500 text-white hover:bg-violet-600 font-mono uppercase text-xs"><Plus className="size-3 mr-2" /> Record your first flip</Button>
              </AddSaleDialog>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {sales.map((sale) => (
                <SaleRow key={sale.id} sale={sale} onDelete={removeSale} cards={cards} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value, icon, accent = "default" }: { label: string; value: string; icon: React.ReactNode; accent?: "default" | "green" | "red" }) {
  const cls = accent === "green" ? "text-green-400" : accent === "red" ? "text-red-400" : "text-white";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-white/70"><span className="text-[10px] uppercase tracking-widest font-mono">{label}</span>{icon}</div>
      <span className={`text-xl font-light font-mono tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

function SaleRow({ sale, onDelete, cards }: { sale: SaleRecord; onDelete: (id: string) => void; cards: any[] }) {
  const roi = sale.totalCosts > 0 ? ((sale.netProfit / sale.totalCosts) * 100) : 0;
  const matchedCard = cards.find(c => c.id === sale.cardId);
  const cardImage = matchedCard?.imageUrl;
  const cardCondition = sale.condition || matchedCard?.condition;

  return (
    <div className="grid grid-cols-12 gap-4 items-center px-4 sm:px-6 py-4 hover:bg-white/5 transition-colors">
      <div className="col-span-12 sm:col-span-3 flex items-center gap-3 min-w-0">
        <div className="size-10 shrink-0 rounded-xl bg-surface-elevated border border-white/10 overflow-hidden flex items-center justify-center">
          {sale.imageUrl ? <img src={sale.imageUrl} alt={sale.cardName} className="w-full h-full object-cover" /> : <span className="font-mono text-[9px] text-white/50">{sale.game === "pokemon" ? "PKMN" : "OP"}</span>}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{sale.cardName}</p>
          <p className="text-[10px] text-white/50 font-mono uppercase">×{sale.quantity} · {sale.saleKind}</p>
        </div>
      </div>
      <div className="col-span-4 sm:col-span-2 text-[11px] font-mono text-white/70">{new Date(sale.soldAt).toLocaleDateString()}</div>
      <div className="col-span-3 sm:col-span-1"><span className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded font-mono uppercase text-white/70">{sale.saleKind}</span></div>
      <div className="col-span-3 sm:col-span-2 text-right font-mono text-sm tabular-nums">{formatCurrency(sale.salePrice)}</div>
      <div className="col-span-3 sm:col-span-1 text-right font-mono text-xs tabular-nums text-white/70">{formatCurrency(sale.totalCosts)}</div>
      <div className="col-span-3 sm:col-span-1 text-right font-mono text-xs tabular-nums"><span className={sale.netProfit >= 0 ? "text-green-400" : "text-red-400"}>{formatCurrency(sale.netProfit)}</span></div>
      <div className="col-span-2 sm:col-span-1 text-right font-mono text-xs tabular-nums font-bold"><span className={roi >= 0 ? "text-green-400" : "text-red-400"}>{roi >= 0 ? "+" : ""}{roi.toFixed(1)}%</span></div>
      <div className="col-span-1 sm:col-span-1 flex justify-end gap-1">
        <ShareCard sale={sale} cardImage={cardImage} cardCondition={cardCondition} />
        <Button variant="ghost" size="icon" onClick={() => onDelete(sale.id)} className="size-8 text-white/50 hover:text-red-400"><Trash2 className="size-3" /></Button>
      </div>
    </div>
  );
}

function AddSaleDialog({ cards, onAdd, children }: { cards: any[]; onAdd: (sale: any) => void; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedCard = cards.find((c: any) => c.id === selectedCardId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCard) { toast.error("Please select a card"); return; }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const salePrice = Number(fd.get("salePrice") || 0);
    const gradingCost = Number(fd.get("gradingCost") || 0);
    const shippingCost = Number(fd.get("shippingCost") || 0);
    const quantity = Math.max(1, Number(fd.get("quantity") || 1));
    onAdd({
      cardId: selectedCard.id,
      cardName: selectedCard.name,
      game: selectedCard.game,
      language: selectedCard.language,
      imageUrl: selectedCard.imageUrl,
      condition: selectedCard.condition,
      quantity,
      soldAt: String(fd.get("soldAt") || new Date().toISOString()),
      saleKind: String(fd.get("saleKind") || "cash"),
      salePrice,
      acquisitionCost: selectedCard.acquisitionPrice * quantity,
      gradingCost,
      shippingCost,
      notes: String(fd.get("notes") || "").trim() || undefined,
    });
    toast.success(`Flip recorded: ${selectedCard.name}`);
    setOpen(false); setSelectedCardId(""); setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSelectedCardId(""); }}>
      <DialogTrigger asChild>{children || <Button className="bg-violet-500 text-white hover:bg-violet-600 font-mono uppercase text-xs tracking-widest"><Plus className="size-3 mr-2" /> Record Flip</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] bg-surface border-vault-border max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-mono text-base">Record a Flip</DialogTitle><p className="text-[10px] uppercase font-mono text-muted-foreground tracking-widest">Log a completed sale</p></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Select Card</Label><select value={selectedCardId} onChange={(e) => setSelectedCardId(e.target.value)} className="w-full bg-surface border border-vault-border rounded-xl px-3 py-2 font-mono text-sm" required><option value="">— Choose a card —</option>{cards.map((card: any) => <option key={card.id} value={card.id}>{card.name} ({card.game === "pokemon" ? "PKMN" : "OP"}) — Acq: {formatCurrency(card.acquisitionPrice)} | Current: {formatCurrency(card.currentPrice)}</option>)}</select></div>
          {selectedCard && <div className="bg-surface-elevated border border-vault-border rounded-xl p-3 text-xs font-mono space-y-1 text-muted-foreground"><div>Acquisition: <span className="text-white">{formatCurrency(selectedCard.acquisitionPrice)}</span></div><div>Current: <span className="text-white">{formatCurrency(selectedCard.currentPrice)}</span></div></div>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Sale Price ($)</Label><Input name="salePrice" type="number" step="0.01" required className="bg-surface border-vault-border font-mono rounded-xl" placeholder="0.00" /></div>
            <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Quantity</Label><Input name="quantity" type="number" min="1" defaultValue="1" className="bg-surface border-vault-border font-mono rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Grading Cost ($)</Label><Input name="gradingCost" type="number" step="0.01" defaultValue="0" className="bg-surface border-vault-border font-mono rounded-xl" /></div>
            <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Shipping Cost ($)</Label><Input name="shippingCost" type="number" step="0.01" defaultValue="0" className="bg-surface border-vault-border font-mono rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Sale Date</Label><Input name="soldAt" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="bg-surface border-vault-border font-mono rounded-xl" /></div>
            <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Sale Kind</Label><select name="saleKind" className="w-full bg-surface border border-vault-border rounded-xl px-3 py-2 font-mono text-sm"><option value="cash">Cash</option><option value="trade">Trade</option></select></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="font-mono uppercase text-xs">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-violet-500 text-white hover:bg-violet-600 font-mono uppercase text-xs tracking-widest">Record Flip</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}