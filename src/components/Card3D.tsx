import { useRef, useState, type MouseEvent } from "react";
import type { CollectionCard } from "@/lib/collection";
import { conditionLabel, formatCurrency, languageLabel } from "@/lib/collection";
import { Eye, Trash2 } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CardDetailsDialog } from "@/components/CardItem";

interface Props {
  card: CollectionCard;
  onDelete?: (id: string) => void;
  accent?: "cyan" | "magenta";
}

export function Card3D({ card, onDelete, accent = "cyan" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 50, my: 50, lift: 0 });
  const accentClass =
    accent === "magenta"
      ? "shadow-[0_0_40px_-10px_color-mix(in_oklab,var(--laser-magenta)_60%,transparent)]"
      : "shadow-[0_0_40px_-10px_color-mix(in_oklab,var(--laser-cyan)_60%,transparent)]";

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    const ry = (x - 0.5) * 18;
    const rx = (0.5 - y) * 18;
    setTilt({ rx, ry, mx: x * 100, my: y * 100, lift: 14 });
  };

  const handleLeave = () => setTilt({ rx: 0, ry: 0, mx: 50, my: 50, lift: 0 });
  const fallback = card.game === "pokemon" ? "PKMN" : "OP";

  return (
    <Dialog>
      <div className="group flex flex-col gap-2" style={{ perspective: "1200px" }}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="block text-left"
            aria-label={`Open market details for ${card.name}`}
          >
            <div
              ref={wrapRef}
              onMouseMove={handleMove}
              onMouseLeave={handleLeave}
              className={`relative aspect-[2.5/3.5] overflow-hidden rounded-md border border-vault-border bg-surface-elevated transition-[transform,box-shadow] duration-200 ease-out ${accentClass}`}
              style={{
                transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${tilt.lift}px)`,
                transformStyle: "preserve-3d",
              }}
            >
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface-elevated to-surface">
                  <span className="font-mono text-2xl text-muted-foreground/60">{fallback}</span>
                </div>
              )}

              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/40 to-transparent pointer-events-none" />
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-70 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.05) 35%, transparent 60%)`,
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(${tilt.ry * 4 + 120}deg, transparent 30%, ${
                    accent === "magenta" ? "var(--laser-magenta)" : "var(--laser-cyan)"
                  } 50%, transparent 70%)`,
                }}
              />

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background via-background/78 to-transparent">
                <div className="text-sm font-medium truncate" title={card.name}>
                  {card.name}
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] font-mono uppercase text-muted-foreground">
                    {card.setName}
                  </span>
                  <span className="ml-2 shrink-0 text-xs font-mono tabular-nums text-laser-cyan">
                    {formatCurrency(card.currentPrice)}
                  </span>
                </div>
              </div>

              <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                <span className="rounded border border-vault-border bg-background/80 px-1.5 py-0.5 text-[9px] font-mono uppercase text-laser-cyan backdrop-blur">
                  {conditionLabel(card.condition)}
                </span>
                <span className="rounded border border-vault-border bg-background/80 px-1.5 py-0.5 text-[9px] font-mono uppercase text-laser-magenta backdrop-blur">
                  {languageLabel(card.language)}
                </span>
              </div>

              {card.quantity > 1 && (
                <div className="absolute top-2 left-2 rounded border border-vault-border bg-background/80 px-1.5 py-0.5 text-[10px] font-mono backdrop-blur">
                  ×{card.quantity}
                </div>
              )}
            </div>
          </button>
        </DialogTrigger>

        <div className="min-h-16 rounded-md border border-vault-border bg-surface/70 p-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold leading-tight">{card.name}</div>
            <div className="mt-1 truncate text-xs font-mono uppercase text-muted-foreground">
              {card.setName}
              {card.cardNumber ? ` · ${card.cardNumber}` : ""}
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded border border-vault-border bg-surface-elevated p-2 text-muted-foreground hover:text-laser-cyan"
                aria-label={`Open details for ${card.name}`}
              >
                <Eye className="size-4" />
              </button>
            </DialogTrigger>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                className="inline-flex items-center justify-center rounded border border-vault-border bg-surface-elevated p-2 text-muted-foreground hover:text-laser-red"
                aria-label={`Remove ${card.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <CardDetailsDialog card={card} />
    </Dialog>
  );
}
