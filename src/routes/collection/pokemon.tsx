// src/routes/collection/pokemon.tsx — FILE COMPLETO (VIOLA UNIFORME + GLASS)
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CardShowroom } from "@/components/CardShowroom";
import { useCollection } from "@/lib/collection";
import { Toaster } from "@/components/ui/sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/collection/pokemon")({
  head: () => ({
    meta: [
      { title: "Pokédex · Card Vault Pro" },
      { name: "description", content: "Virtual showroom of your Pokémon TCG collection." },
    ],
  }),
  component: PokemonShowroom,
});

function PokemonShowroom() {
  const { cards } = useCollection();
  const pokemonCards = cards.filter((c) => c.game === "pokemon");

  return (
    <AppShell>
      <Toaster />
      <div className="p-6 lg:p-8 space-y-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Sparkles className="size-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Pokédex</h1>
            <p className="text-sm text-white/70 mt-0.5">Virtual showroom · Pokémon TCG</p>
          </div>
        </div>

        {/* Showroom Card */}
        <div className="glass-card-analytics">
          <CardShowroom
            cards={pokemonCards}
            title="Pokémon Collection"
            emptyMessage="No Pokémon cards yet. Start your collection!"
            accentColor="cyan"
          />
        </div>
      </div>
    </AppShell>
  );
}