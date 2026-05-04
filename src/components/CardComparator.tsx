// src/components/CardComparator.tsx — FILE COMPLETO (NUOVO)
import { useState } from "react";
import { formatCurrency, type CollectionCard } from "@/lib/collection";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  cards: CollectionCard[];
}

export function CardComparator({ cards }: Props) {
  const [cardA, setCardA] = useState<string>("");
  const [cardB, setCardB] = useState<string>("");

  const selectedA = cards.find((c) => c.id === cardA);
  const selectedB = cards.find((c) => c.id === cardB);

  const getROI = (card: CollectionCard) =>
    card.acquisitionPrice > 0
      ? ((card.currentPrice - card.acquisitionPrice) / card.acquisitionPrice) * 100
      : 0;

  return (
    <div className="glass-card p-4 sm:p-6 rounded">
      <h3 className="text-xs font-semibold uppercase tracking-widest font-mono mb-4">
        Card Comparator
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <select
          value={cardA}
          onChange={(e) => setCardA(e.target.value)}
          className="bg-surface border border-vault-border rounded px-3 py-2 font-mono text-xs"
        >
          <option value="">— Select card A —</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={cardB}
          onChange={(e) => setCardB(e.target.value)}
          className="bg-surface border border-vault-border rounded px-3 py-2 font-mono text-xs"
        >
          <option value="">— Select card B —</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {selectedA && selectedB && (
        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
          <div className="space-y-2">
            <div className="text-sm font-semibold truncate">{selectedA.name}</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Acq</span><span>{formatCurrency(selectedA.acquisitionPrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Current</span><span className="text-laser-cyan">{formatCurrency(selectedA.currentPrice)}</span></div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ROI</span>
              <span className={getROI(selectedA) >= 0 ? "text-laser-green" : "text-laser-red"}>
                {getROI(selectedA) >= 0 ? "+" : ""}{getROI(selectedA).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold truncate">{selectedB.name}</div>
            <div className="flex justify-between"><span className="text-muted-foreground">Acq</span><span>{formatCurrency(selectedB.acquisitionPrice)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Current</span><span className="text-laser-cyan">{formatCurrency(selectedB.currentPrice)}</span></div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ROI</span>
              <span className={getROI(selectedB) >= 0 ? "text-laser-green" : "text-laser-red"}>
                {getROI(selectedB) >= 0 ? "+" : ""}{getROI(selectedB).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="col-span-2 border-t border-vault-border pt-2 text-center">
            <span className="text-muted-foreground">ROI Difference: </span>
            <span className={getROI(selectedA) - getROI(selectedB) >= 0 ? "text-laser-green font-bold" : "text-laser-red font-bold"}>
              {(getROI(selectedA) - getROI(selectedB)).toFixed(1)}% in favor of {getROI(selectedA) >= getROI(selectedB) ? selectedA.name : selectedB.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}