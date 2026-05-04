// src/components/ChainView.tsx — FILE COMPLETO (immagini fixate)
import { useMemo, useState, useRef } from "react";
import { useChains, useSales, useCollection, formatCurrency, computeChainStats, type InvestmentChain, type ChainStep } from "@/lib/collection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, Plus, Trash2, ArrowRight, Target, Rocket, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ChainView() {
  const { chains, createChain, addStepToChain, removeChain } = useChains();
  const { sales } = useSales();
  const { cards } = useCollection();
  const [showNewChain, setShowNewChain] = useState(false);
  const [showAddStep, setShowAddStep] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const unassignedSales = useMemo(() => {
    const assignedIds = new Set(chains.flatMap((c) => c.steps.flatMap((s) => s.flipIds)));
    return sales.filter((s) => !assignedIds.has(s.id));
  }, [sales, chains]);

  const scrollChains = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: direction === "left" ? -400 : 400, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Rocket className="size-4 text-violet-400" /><h3 className="text-xs font-semibold uppercase tracking-widest font-mono text-white">Investment Chains</h3><span className="text-[10px] text-white/70 font-mono">({chains.length})</span></div>
        <div className="flex items-center gap-2">
          {chains.length > 1 && (
            <div className="flex gap-1">
              <Button onClick={() => scrollChains("left")} variant="outline" size="icon" className="size-8 border-white/10 text-white/70 hover:text-white"><ChevronLeft className="size-4" /></Button>
              <Button onClick={() => scrollChains("right")} variant="outline" size="icon" className="size-8 border-white/10 text-white/70 hover:text-white"><ChevronRight className="size-4" /></Button>
            </div>
          )}
          <Button onClick={() => setShowNewChain(true)} className="bg-violet-500 text-white hover:bg-violet-600 font-mono uppercase text-xs tracking-widest"><Plus className="size-3 mr-2" /> New Chain</Button>
        </div>
      </div>

      {chains.length === 0 && !showNewChain ? (
        <div className="glass-card-analytics text-center">
          <Rocket className="size-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/70 mb-2">No investment chains yet</p>
          <p className="text-[10px] text-white/40 font-mono uppercase">Track your flip ladders and see your capital grow</p>
        </div>
      ) : (
        <div className="relative">
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {chains.map((chain) => (
              <div key={chain.id} className="snap-center shrink-0 w-full max-w-[600px]">
                <ChainCard chain={chain} sales={sales} cards={cards} onAddStep={(id) => setShowAddStep(id)} onRemove={removeChain} hasUnassigned={unassignedSales.length > 0} />
              </div>
            ))}
          </div>
          {chains.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {chains.map((chain, i) => (
                <button key={chain.id} onClick={() => { if (!scrollRef.current) return; scrollRef.current.children[i]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); }} className="size-2 rounded-full bg-white/10 border border-white/10 hover:bg-violet-400/50 transition-colors" title={chain.name} />
              ))}
            </div>
          )}
        </div>
      )}

      <NewChainDialog open={showNewChain} onClose={() => setShowNewChain(false)} onCreate={createChain} unassignedSales={unassignedSales} />
      {showAddStep && <AddStepDialog chainId={showAddStep} onClose={() => setShowAddStep(null)} onAdd={addStepToChain} unassignedSales={unassignedSales} sales={sales} />}
    </div>
  );
}

function NewChainDialog({ open, onClose, onCreate, unassignedSales }: { open: boolean; onClose: () => void; onCreate: (name: string, initial: number, step?: ChainStep) => void; unassignedSales: any[] }) {
  const [name, setName] = useState(""); const [initial, setInitial] = useState(""); const [description, setDescription] = useState(""); const [selectedFlips, setSelectedFlips] = useState<string[]>([]);
  const handleSubmit = () => { if (!name || !initial || isNaN(Number(initial)) || Number(initial) <= 0) return; const step: ChainStep | undefined = selectedFlips.length > 0 ? { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), description: description || "Initial investment", investedAmount: Number(initial), flipIds: selectedFlips, date: new Date().toISOString() } : undefined; onCreate(name, Number(initial), step); onClose(); setName(""); setInitial(""); setDescription(""); setSelectedFlips([]); };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] bg-surface border-vault-border">
        <DialogHeader><DialogTitle className="font-mono text-base">New Investment Chain</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Chain Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Charizard Flip Ladder" className="bg-surface border-vault-border font-mono text-sm" /></div>
          <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Initial Investment ($)</Label><Input value={initial} onChange={(e) => setInitial(e.target.value)} type="number" step="0.01" placeholder="85.00" className="bg-surface border-vault-border font-mono text-sm" /></div>
          <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Description (optional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bought 2 Charizard singles" className="bg-surface border-vault-border font-mono text-sm" /></div>
          {unassignedSales.length > 0 && (
            <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Link existing flips (optional)</Label>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {unassignedSales.map((s: any) => <label key={s.id} className="flex items-center gap-2 text-xs font-mono cursor-pointer hover:bg-surface-elevated rounded px-2 py-1"><input type="checkbox" checked={selectedFlips.includes(s.id)} onChange={(e) => { if (e.target.checked) setSelectedFlips([...selectedFlips, s.id]); else setSelectedFlips(selectedFlips.filter(f => f !== s.id)); }} />{s.cardName} — {formatCurrency(s.salePrice)}</label>)}
              </div>
            </div>
          )}
          <Button onClick={handleSubmit} className="w-full bg-violet-500 text-white hover:bg-violet-600 font-mono uppercase text-xs tracking-widest">Create Chain</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddStepDialog({ chainId, onClose, onAdd, unassignedSales, sales }: { chainId: string; onClose: () => void; onAdd: (chainId: string, step: ChainStep) => void; unassignedSales: any[]; sales: any[] }) {
  const [description, setDescription] = useState(""); const [invested, setInvested] = useState(""); const [selectedFlips, setSelectedFlips] = useState<string[]>([]);
  const handleSubmit = () => { if (!invested || isNaN(Number(invested))) return; const step: ChainStep = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), description: description || `Step with ${selectedFlips.length} flip(s)`, investedAmount: Number(invested), flipIds: selectedFlips, date: new Date().toISOString() }; onAdd(chainId, step); onClose(); };
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] bg-surface border-vault-border">
        <DialogHeader><DialogTitle className="font-mono text-base">Add Step to Chain</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Amount Reinvested ($)</Label><Input value={invested} onChange={(e) => setInvested(e.target.value)} type="number" step="0.01" placeholder="How much did you reinvest?" className="bg-surface border-vault-border font-mono text-sm" /></div>
          <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bought Borsalino OP09" className="bg-surface border-vault-border font-mono text-sm" /></div>
          <div className="space-y-2"><Label className="text-[10px] uppercase font-mono text-muted-foreground">Select flips from this reinvestment</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {unassignedSales.map((s: any) => <label key={s.id} className="flex items-center gap-2 text-xs font-mono cursor-pointer hover:bg-surface-elevated rounded px-2 py-1"><input type="checkbox" checked={selectedFlips.includes(s.id)} onChange={(e) => { if (e.target.checked) setSelectedFlips([...selectedFlips, s.id]); else setSelectedFlips(selectedFlips.filter(f => f !== s.id)); }} />{s.cardName} — Sold: {formatCurrency(s.salePrice)} | Profit: {formatCurrency(s.netProfit)}</label>)}
              {unassignedSales.length === 0 && <p className="text-xs text-muted-foreground p-2">No unassigned flips.</p>}
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-violet-500 text-white hover:bg-violet-600 font-mono uppercase text-xs tracking-widest">Add Step</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChainCard({ chain, sales, cards, onAddStep, onRemove, hasUnassigned }: { chain: InvestmentChain; sales: any[]; cards: any[]; onAddStep: (id: string) => void; onRemove: (id: string) => void; hasUnassigned: boolean }) {
  const stats = computeChainStats(chain, sales);
  const roiClass = stats.totalROI >= 0 ? "text-green-400" : "text-red-400";

  const getCardImage = (saleId: string): string | undefined => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return undefined;
    if (sale.cardId) {
      const card = cards.find((c: any) => c.id === sale.cardId);
      if (card?.imageUrl) return card.imageUrl;
    }
    return sale.imageUrl;
  };

  const getCardName = (saleId: string): string => {
    const sale = sales.find((s) => s.id === saleId);
    return sale?.cardName ?? "";
  };

  return (
    <div className="glass-card-analytics space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><Rocket className="size-5 text-violet-400" /></div>
          <div><h4 className="font-mono text-sm font-semibold text-white">{chain.name}</h4><p className="text-[9px] text-white/70 font-mono uppercase">Started {new Date(chain.createdAt).toLocaleDateString()} · {chain.steps.length} step{chain.steps.length !== 1 ? "s" : ""}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onAddStep(chain.id)} disabled={!hasUnassigned} variant="outline" size="sm" className="border-white/10 font-mono text-[10px] uppercase tracking-widest h-8 text-white/70"><Plus className="size-3 mr-1" /> Add Step</Button>
          <Button onClick={() => onRemove(chain.id)} variant="ghost" size="icon" className="size-8 text-white/50 hover:text-red-400"><Trash2 className="size-3.5" /></Button>
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        <div className="flex flex-col items-center min-w-[80px]"><div className="size-10 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center mb-1.5"><Target className="size-4 text-gray-400" /></div><span className="text-[9px] font-mono uppercase text-white/70 tracking-wider">Initial</span><span className="text-xs font-mono font-bold text-white mt-0.5">{formatCurrency(chain.initialInvestment)}</span></div>
        {stats.stepsData.map((stepData, i) => (
          <div key={stepData.step.id} className="flex items-center gap-2">
            <ArrowRight className="size-4 text-violet-400/50 shrink-0" />
            <div className="flex flex-col items-center min-w-[140px] bg-surface-elevated rounded-xl p-3 border border-white/5 hover:border-violet-400/40 transition-all">
              <div className="flex items-center gap-1 mb-1"><Layers className="size-3 text-violet-400" /><span className="text-[8px] font-mono uppercase text-white/70 tracking-wider">Step {i + 1}</span></div>
              <span className="text-[10px] font-mono text-white text-center leading-tight">{stepData.step.description}</span>
              <div className="flex items-center gap-2 mt-1.5 text-[9px] font-mono"><span className="text-white/70">Invested:</span><span className="text-white font-bold">{formatCurrency(stepData.totalInvested)}</span></div>
              <div className="flex items-center gap-2 text-[9px] font-mono"><span className="text-white/70">Returned:</span><span className="text-green-400 font-bold">{formatCurrency(stepData.totalReturned)}</span></div>
              {stepData.step.flipIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {stepData.step.flipIds.map((fid) => {
                    const img = getCardImage(fid);
                    const name = getCardName(fid);
                    return (
                      <div key={fid} className="flex flex-col items-center gap-1">
                        <div className="size-12 rounded-lg bg-surface border border-white/5 overflow-hidden shadow-md hover:scale-110 transition-transform">
                          {img ? (
                            <img src={img} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20"><Layers className="size-5" /></div>
                          )}
                        </div>
                        <span className="text-[7px] font-mono text-white/70 truncate max-w-[50px] text-center leading-tight">{name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <span className="text-[10px] font-mono font-bold text-white mt-1">→ {formatCurrency(stepData.capitalAfter)}</span>
            </div>
          </div>
        ))}
        <ArrowRight className="size-4 text-green-400/50 shrink-0" />
        <div className="flex flex-col items-center min-w-[90px] bg-green-500/5 rounded-xl p-3 border border-green-500/30">
          <div className="size-10 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mb-1.5"><TrendingUp className="size-5 text-green-400" /></div>
          <span className="text-[9px] font-mono uppercase text-green-400 tracking-wider">Final</span>
          <span className="text-sm font-mono font-bold text-white mt-0.5">{formatCurrency(stats.finalCapital)}</span>
          <span className={`text-xs font-mono font-bold mt-0.5 ${roiClass}`}>{stats.totalROI >= 0 ? "+" : ""}{stats.totalROI.toFixed(1)}%</span>
          <span className="text-[9px] font-mono text-white/70">×{stats.multiplier.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}