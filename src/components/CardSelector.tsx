// src/components/CardSelector.tsx — FILE COMPLETO (con loading state)
import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CardEntry {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  game: "pokemon" | "onepiece";
}

interface Props {
  game: "pokemon" | "onepiece";
  language: "en" | "jp";
  onSelect: (card: CardEntry) => void;
}

export function CardSelector({ game, language, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardEntry[]>([]);
  const [allCards, setAllCards] = useState<CardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setAllCards([]);

    let dbFile = "";
    if (game === "pokemon" && language === "en") {
      dbFile = "/data/pokemon-cards.json";
    } else if (game === "pokemon" && language === "jp") {
      dbFile = "/data/pokemon-jp-cards.json";
    } else if (game === "onepiece") {
      dbFile = "/data/one-piece-cards.json";
    }

    if (!dbFile) {
      setLoading(false);
      return;
    }

    fetch(dbFile)
      .then(res => res.json())
      .then(data => {
        console.log(`Loaded ${data.length} cards from ${dbFile}`);
        setAllCards(data || []);
        setLoading(false);
      })
      .catch(() => {
        console.warn(`Could not load ${dbFile}`);
        setLoading(false);
      });
  }, [game, language]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const filtered = allCards
      .filter(card => 
        card.name.toLowerCase().includes(q) ||
        card.cardNumber.toLowerCase().includes(q) ||
        card.setName.toLowerCase().includes(q)
      )
      .slice(0, 12);
    setResults(filtered);
  }, [query, allCards]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={
            loading
              ? "Loading database..."
              : game === "pokemon"
                ? language === "en"
                  ? "Search Pokémon card (EN)..."
                  : "ポケモンカードを検索 (JP)..."
                : "Search One Piece card..."
          }
          className="pl-10 pr-4 bg-surface border-white/10 rounded-xl focus:border-violet-400/50 transition-all"
          disabled={loading}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-white/40 animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showDropdown && !loading && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {results.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                onSelect(card);
                setQuery(card.name);
                setShowDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              <div className="size-12 shrink-0 rounded-lg bg-surface-elevated border border-white/5 overflow-hidden">
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">
                    {game === "onepiece" ? "⚓" : "⚡"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{card.name}</p>
                <p className="text-[10px] text-white/50 font-mono">
                  {card.setName} · {card.cardNumber}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && !loading && query.length >= 2 && results.length === 0 && allCards.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-surface border border-white/10 rounded-xl shadow-2xl p-4 text-center">
          <p className="text-sm text-white/50">No cards found</p>
        </div>
      )}

      {showDropdown && loading && (
        <div className="absolute z-50 mt-2 w-full bg-surface border border-white/10 rounded-xl shadow-2xl p-4 text-center">
          <Loader2 className="size-5 text-violet-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-white/50">Loading card database...</p>
        </div>
      )}
    </div>
  );
}