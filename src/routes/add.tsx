
// src/routes/add.tsx — FILE COMPLETO (con CardSelector EN/JP)
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardCondition, CardGame, CardLanguage, useCollection } from "@/lib/collection";
import { CardSelector } from "@/components/CardSelector";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/add")({
  head: () => ({ meta: [{ title: "Add Card · Card Vault Pro" }, { name: "description", content: "Add a new card to your TCG portfolio." }] }),
  component: AddPage,
});

function AddPage() {
  const navigate = useNavigate();
  const { addCard } = useCollection();
  const [game, setGame] = useState<CardGame>("pokemon");
  const [language, setLanguage] = useState<CardLanguage>("en");
  const [condition, setCondition] = useState<CardCondition>("raw");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const setName = String(fd.get("setName") || "").trim();
    if (!name || !setName) { toast.error("Name and Set are required"); setSubmitting(false); return; }
    const acquisitionPrice = Number(fd.get("acquisitionPrice") || 0);
    const currentPrice = Number(fd.get("currentPrice") || acquisitionPrice);
    const acquiredAtRaw = String(fd.get("acquiredAt") || "").trim();
    const acquiredAt = acquiredAtRaw ? new Date(acquiredAtRaw).toISOString() : new Date().toISOString();

    addCard({
      game, language, condition, name, setName,
      cardNumber: String(fd.get("cardNumber") || "").trim() || undefined,
      rarity: String(fd.get("rarity") || "").trim() || undefined,
      imageUrl: String(fd.get("imageUrl") || "").trim() || undefined,
      acquisitionPrice, currentPrice,
      quantity: Math.max(1, Number(fd.get("quantity") || 1)),
      acquiredAt,
      notes: String(fd.get("notes") || "").trim() || undefined,
    });
    toast.success(`${name} added to vault`);
    navigate({ to: game === "pokemon" ? "/collection/pokemon" : "/collection/onepiece" });
  };

  return (
    <AppShell>
      <Toaster />
      <div className="p-6 lg:p-8 max-w-3xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="size-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Plus className="size-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Add Card</h1>
            <p className="text-sm text-white/70 mt-0.5">New gem into your collection</p>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="glass-card-analytics space-y-6">
          {/* Game */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest font-medium text-white/70">Game</Label>
            <div className="flex gap-2">
              {(["pokemon", "onepiece"] as const).map((g) => (
                <button key={g} type="button" onClick={() => setGame(g)} className={`flex-1 px-4 py-3 rounded-xl border font-medium text-xs uppercase tracking-widest transition-all ${game === g ? "border-violet-400 text-violet-400 bg-violet-400/10 shadow-sm" : "border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}>
                  {g === "pokemon" ? "Pokémon TCG" : "One Piece TCG"}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest font-medium text-white/70">Language</Label>
            <div className="flex gap-2">
              {(["en", "jp"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLanguage(l)} className={`flex-1 px-4 py-3 rounded-xl border font-medium text-xs uppercase tracking-widest transition-all ${language === l ? "border-violet-400 text-violet-400 bg-violet-400/10" : "border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}>
                  {l === "en" ? "English" : "Japanese (日本語)"}
                </button>
              ))}
            </div>
          </div>

          {/* Card Selector con auto-completamento EN/JP */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest font-medium text-white/70">Search Card</Label>
            <CardSelector 
              game={game} 
              language={language}
              onSelect={(card) => {
                const form = document.querySelector("form")!;
                (form.elements.namedItem("name") as HTMLInputElement).value = card.name;
                (form.elements.namedItem("setName") as HTMLInputElement).value = card.setName;
                (form.elements.namedItem("cardNumber") as HTMLInputElement).value = card.cardNumber;
                (form.elements.namedItem("rarity") as HTMLInputElement).value = card.rarity || "";
                (form.elements.namedItem("imageUrl") as HTMLInputElement).value = card.imageUrl || "";
              }} 
            />
          </div>

          {/* Card details (auto-compilati dal selettore) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Card Name" name="name" required placeholder="Charizard ex" />
            <Field label="Set" name="setName" required placeholder="Obsidian Flames" />
            <Field label="Card Number" name="cardNumber" placeholder="223/197" />
            <Field label="Rarity" name="rarity" placeholder="Special Illustration Rare" />
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest font-medium text-white/70">Condition / Grade</Label>
            <div className="flex flex-wrap gap-2">
              {(["raw", "psa10", "psa9", "bgs10", "tag10", "graded-other"] as const).map((val) => (
                <button key={val} type="button" onClick={() => setCondition(val)} className={`px-3 py-1.5 rounded-xl border font-medium text-[10px] uppercase tracking-widest transition-all ${condition === val ? "border-violet-400 text-violet-400 bg-violet-400/10" : "border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}>
                  {val === "raw" ? "Raw" : val === "psa10" ? "PSA 10" : val === "psa9" ? "PSA 9" : val === "bgs10" ? "BGS 10" : val === "tag10" ? "TAG 10" : "Other Graded"}
                </button>
              ))}
            </div>
          </div>

          {/* Prices */}
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Acquisition $" name="acquisitionPrice" type="number" step="0.01" defaultValue="0" />
            <Field label="Current $" name="currentPrice" type="number" step="0.01" defaultValue="0" />
            <Field label="Quantity" name="quantity" type="number" min="1" defaultValue="1" />
          </div>

          {/* Acquisition Date */}
          <Field label="Acquired On (used by retroactive timeline)" name="acquiredAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />

          <Field label="Image URL (optional)" name="imageUrl" placeholder="https://…" />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[10px] uppercase tracking-widest font-medium text-white/70">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Any details about this specimen…" className="bg-surface border-white/10 rounded-xl focus:border-violet-400/50 transition-all" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/" })} className="font-medium text-sm text-white/50 hover:text-white">Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-violet-500 text-white hover:bg-violet-600 font-medium text-sm rounded-xl px-5 py-2.5 shadow-lg shadow-violet-500/20 transition-all">Commit to Vault</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({ label, name, type = "text", ...rest }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string; defaultValue?: string; step?: string; min?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-[10px] uppercase tracking-widest font-medium text-white/70">{label}</Label>
      <Input id={name} name={name} type={type} className="bg-surface border-white/10 rounded-xl focus:border-violet-400/50 transition-all" {...rest} />
    </div>
  );
}