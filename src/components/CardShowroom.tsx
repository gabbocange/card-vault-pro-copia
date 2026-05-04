// src/components/CardShowroom.tsx — FILE COMPLETO (con formatCurrency per EUR)
import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useCollection, formatCurrency, type CollectionCard } from "@/lib/collection";
import { CardDetailsDialog, ConditionBadge } from "./CardItem";
import { Dialog } from "@/components/ui/dialog";

interface Props {
  cards: CollectionCard[];
  title: string;
  emptyMessage: string;
  accentColor: string;
}

export function CardShowroom({ cards, title, emptyMessage, accentColor }: Props) {
  const { removeCard } = useCollection();
  const [orderedCards, setOrderedCards] = useState<CollectionCard[]>(() => [...cards]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const prevCardsLength = useRef(cards.length);
  if (cards.length !== prevCardsLength.current) {
    prevCardsLength.current = cards.length;
    setOrderedCards([...cards]);
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "0.4";
  };
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverIndex(index); };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("text/plain"));
    if (isNaN(dragIndex) || dragIndex === dropIndex) { setDraggedIndex(null); setDragOverIndex(null); return; }
    const newOrder = [...orderedCards];
    const [removed] = newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    setOrderedCards(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = (e: React.DragEvent) => { if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = "1"; setDraggedIndex(null); setDragOverIndex(null); };
  const handleDelete = (e: React.MouseEvent, cardId: string) => { e.stopPropagation(); if (confirm("Remove this card from your collection?")) removeCard(cardId); };
  const handleCardClick = (card: CollectionCard) => { setSelectedCard(card); setDialogOpen(true); };

  const bestPerformer = orderedCards.reduce<CollectionCard | null>((best, card) => {
    if (card.acquisitionPrice <= 0) return best;
    const roi = ((card.currentPrice - card.acquisitionPrice) / card.acquisitionPrice) * 100;
    if (!best) return card;
    const bestRoi = ((best.currentPrice - best.acquisitionPrice) / best.acquisitionPrice) * 100;
    return roi > bestRoi ? card : best;
  }, null);

  const glares = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [, setTick] = useState(0);
  const handleMouseMove = (id: string, e: React.MouseEvent<HTMLDivElement>) => { const rect = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; glares.current.set(id, { x, y }); setTick((t) => t + 1); };
  const handleMouseLeaveCard = (id: string) => { glares.current.set(id, { x: 0, y: 0 }); setTick((t) => t + 1); };
  const getGlare = (id: string) => glares.current.get(id) ?? { x: 0, y: 0 };

  const borderColor = accentColor === "cyan" ? "border-laser-cyan/30 hover:border-laser-cyan/50" : "border-laser-magenta/30 hover:border-laser-magenta/50";
  const glowColor = accentColor === "cyan" ? "shadow-laser-cyan/20" : "shadow-laser-magenta/20";
  const badgeBg = accentColor === "cyan" ? "bg-laser-cyan/20 text-laser-cyan" : "bg-laser-magenta/20 text-laser-magenta";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-light tracking-tight font-mono uppercase">{title}</h2>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          {orderedCards.length} card{orderedCards.length !== 1 ? "s" : ""} in showroom
          {bestPerformer && orderedCards.length > 1 && (
            <span className="ml-3 text-laser-cyan">⭐ Best: {bestPerformer.name} (+{(((bestPerformer.currentPrice - bestPerformer.acquisitionPrice) / bestPerformer.acquisitionPrice) * 100).toFixed(1)}%)</span>
          )}
        </p>
      </div>
      {orderedCards.length === 0 ? (
        <div className="glass-card p-12 text-center rounded">
          <p className="text-sm text-muted-foreground mb-4">{emptyMessage}</p>
          <Link to="/add" className="inline-flex items-center px-4 py-2 bg-laser-cyan text-background rounded font-mono text-xs uppercase tracking-widest hover:bg-laser-cyan/90">+ Add your first card</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {orderedCards.map((card, index) => {
            const { x, y } = getGlare(card.id);
            const rotateY = (x * 18).toFixed(1);
            const rotateX = (-y * 18).toFixed(1);
            const glareX = (50 + x * 30).toFixed(0);
            const glareY = (50 + y * 30).toFixed(0);
            const isBestPerformer = bestPerformer?.id === card.id && orderedCards.length > 1;
            const isDragOver = dragOverIndex === index;
            return (
              <div key={card.id} className={`group relative cursor-pointer transition-all duration-200 ${draggedIndex === index ? "opacity-40 scale-95" : ""} ${isDragOver ? "scale-105 ring-2 ring-laser-cyan rounded-xl" : ""}`} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd} onMouseMove={(e) => handleMouseMove(card.id, e)} onMouseLeave={() => handleMouseLeaveCard(card.id)} onClick={() => handleCardClick(card)} style={{ perspective: "600px" }}>
                {isBestPerformer && <div className="absolute -top-2 -right-2 z-10 bg-laser-cyan text-background text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase shadow-lg">⭐ Best</div>}
                <button onClick={(e) => handleDelete(e, card.id)} className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/90 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg" title="Remove card"><svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                <ConditionBadge condition={card.condition} className="absolute top-2 left-2 z-10" />
                <div className={`relative rounded-xl border ${borderColor} bg-surface-elevated overflow-hidden shadow-lg ${glowColor} transition-all duration-200 hover:scale-[1.02]`} style={{ transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`, transformStyle: "preserve-3d", transition: "transform 0.15s ease-out, box-shadow 0.2s" }}>
                  <div className="aspect-[2.5/3.5] relative overflow-hidden">
                    {card.imageUrl ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center bg-surface"><span className="font-mono text-5xl font-bold text-muted-foreground/20">{card.game === "pokemon" ? "⚡" : "⚓"}</span></div>}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{ background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)` }} />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full p-1.5"><svg className="size-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></div>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="text-sm font-medium truncate font-mono">{card.name}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${badgeBg}`}>{card.game === "pokemon" ? "PKMN" : "OP"}</span>
                      <span className="text-[12px] font-mono tabular-nums font-semibold">{formatCurrency(card.currentPrice)}</span>
                    </div>
                    {card.cardNumber && <p className="text-[9px] text-muted-foreground/60 font-mono truncate">{card.setName} · {card.cardNumber}</p>}
                    <div className="flex justify-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex gap-1"><div className="size-1 rounded-full bg-muted-foreground/40" /><div className="size-1 rounded-full bg-muted-foreground/40" /><div className="size-1 rounded-full bg-muted-foreground/40" /></div></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedCard && <CardDetailsDialog card={selectedCard} />}
      </Dialog>
    </div>
  );
}