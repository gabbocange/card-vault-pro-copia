// src/routes/collection/onepiece.tsx — FILE COMPLETO (VIOLA UNIFORME + GLASS)
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CardShowroom } from "@/components/CardShowroom";
import { useCollection } from "@/lib/collection";
import { Toaster } from "@/components/ui/sonner";
import { Anchor } from "lucide-react";

export const Route = createFileRoute("/collection/onepiece")({
  head: () => ({
    meta: [
      { title: "One Piece Crews · Card Vault Pro" },
      { name: "description", content: "Virtual showroom of your One Piece TCG collection." },
    ],
  }),
  component: OnePieceShowroom,
});

function OnePieceShowroom() {
  const { cards } = useCollection();
  const opCards = cards.filter((c) => c.game === "onepiece");

  return (
    <AppShell>
      <Toaster />
      <div className="p-6 lg:p-8 space-y-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Anchor className="size-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">One Piece Crews</h1>
            <p className="text-sm text-white/70 mt-0.5">Virtual showroom · One Piece TCG</p>
          </div>
        </div>

        {/* Showroom Card */}
        <div className="glass-card-analytics">
          <CardShowroom
            cards={opCards}
            title="One Piece Collection"
            emptyMessage="No One Piece cards yet. Start your collection!"
            accentColor="magenta"
          />
        </div>
      </div>
    </AppShell>
  );
}