import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildEbayQuery,
  formatCurrency,
  useCollection,
  type CollectionCard,
} from "@/lib/collection";
import { searchEbay } from "@/lib/ebay.functions";

interface Props {
  cards: CollectionCard[];
  label?: string;
}

export function BulkEbayUpdate({ cards, label = "Refresh all from eBay" }: Props) {
  const ebay = useServerFn(searchEbay);
  const { recordPrice } = useCollection();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const run = async () => {
    if (running) return;
    setRunning(true);
    setProgress({ done: 0, total: cards.length });
    let updated = 0;
    let totalDelta = 0;
    for (const card of cards) {
      try {
        const query = buildEbayQuery(card);
        const res = await ebay({ data: { query } });
        if (!res.error && res.consensusPrice != null) {
          const rounded = Number(res.consensusPrice.toFixed(2));
          totalDelta += (rounded - card.currentPrice) * card.quantity;
          recordPrice(card.id, {
            date: new Date().toISOString(),
            price: rounded,
            source: "ebay-active",
            sampleSize: res.sampleSize,
          });
          updated++;
        }
      } catch {
        /* skip card */
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
      // Be polite to eBay rate limits
      await new Promise((r) => setTimeout(r, 250));
    }
    setRunning(false);
    toast.success(
      `Updated ${updated}/${cards.length} cards · Δ ${formatCurrency(totalDelta)}`,
    );
  };

  return (
    <Button
      onClick={run}
      disabled={running || cards.length === 0}
      variant="outline"
      className="border-vault-border font-mono uppercase text-xs tracking-widest"
    >
      {running ? (
        <>
          <Loader2 className="size-3 mr-2 animate-spin" />
          {progress.done}/{progress.total}
        </>
      ) : (
        <>
          <RefreshCw className="size-3 mr-2" /> {label}
        </>
      )}
    </Button>
  );
}
