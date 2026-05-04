import type { CollectionCard } from "./collection-types";

export function filterCollectionCards(cards: CollectionCard[], mode: "all" | "pokemon" | "onepiece") {
  if (mode === "all") return cards;
  return cards.filter((card) => card.game === mode);
}

export function groupShowroomCards(cards: CollectionCard[]) {
  const pokemon = cards.filter((card) => card.game === "pokemon");
  const onepiece = cards.filter((card) => card.game === "onepiece");

  return [
    {
      key: "pokemon",
      title: "Pokémon TCG",
      subtitle: "Pokédex",
      cards: pokemon,
      accent: "cyan" as const,
    },
    {
      key: "onepiece",
      title: "One Piece TCG",
      subtitle: "Crews",
      cards: onepiece,
      accent: "magenta" as const,
    },
  ].filter((section) => section.cards.length > 0);
}