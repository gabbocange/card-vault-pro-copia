// src/components/PriceSelector.tsx — FILE COMPLETO (query migliorata)
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/collection";
import { searchCardPrices, getBestPrice, type PriceResult } from "@/lib/pokewallet";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (price: number, source: string, cardId: string) => void;
  query: string;
  cardName?: string;
  cardNumber?: string;
}

export function PriceSelector({ open, onClose, onSelect, query, cardName, cardNumber }: Props) {
  const [results, setResults] = useState<PriceResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    
    // Costruisci una query più specifica: nome carta + numero
    let searchQuery = "";
    if (cardName && cardNumber) {
      // Es: "Mega Charizard X ex 125/094"
      searchQuery = `${cardName} ${cardNumber}`;
    } else if (cardName) {
      searchQuery = cardName;
    } else {
      // Fallback: prime 3 parole della query originale
      searchQuery = query.split(" ").slice(0, 3).join(" ");
    }
    
    console.log("[PriceSelector] Searching:", searchQuery);
    
    searchCardPrices(searchQuery).then(data => {
      // Filtra risultati che contengono il nome della carta
      if (cardName && data.length > 0) {
        const nameWords = cardName.toLowerCase().split(" ");
        data = data.filter(card => 
          nameWords.some(word => card.name.toLowerCase().includes(word))
        );
      }
      setResults(data);
      setLoading(false);
    }).catch(() => {
      setResults([]);
      setLoading(false);
    });
  }, [open, query, cardName, cardNumber]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-[95vw] bg-surface border-white/10 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Select the correct card</DialogTitle>
          <p className="text-xs text-white/50 mt-1">Pick the card that matches yours to update the price</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 text-violet-400 animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <p>No results found</p>
            <p className="text-xs mt-1">Try searching with "{cardName}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result, i) => {
              const price = getBestPrice(result);
              return (
                <button
                  key={result.id || i}
                  onClick={() => {
                    if (price !== null) {
                      onSelect(price, result.source, result.id);
                    }
                  }}
                  disabled={price === null}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-elevated border border-white/5 hover:border-violet-400/30 transition-all text-left disabled:opacity-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{result.name}</p>
                    <p className="text-[10px] text-white/50 font-mono mt-0.5">
                      {result.setCode} · {result.cardNumber}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {price !== null ? (
                      <>
                        <div className="text-lg font-bold text-green-400 font-mono">
                          {formatCurrency(price)}
                        </div>
                        <div className="text-[9px] text-white/40 uppercase mt-0.5">
                          {result.source === "tcgplayer" ? "TCGPlayer" : result.source === "cardmarket" ? "CardMarket" : "Both"}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-white/30">No price</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}