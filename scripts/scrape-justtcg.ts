// scripts/scrape-justtcg.ts — FILE COMPLETO (OFFSET CORRETTO + ONE PIECE FIX)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = "tcg_944811ab3e5b44588df0efe3ebb40f92";
const BASE_URL = "https://api.justtcg.com/v1";
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const PROGRESS_FILE = path.join(DATA_DIR, "scrape-progress.json");

interface Progress {
  [key: string]: number;
}

function loadProgress(): Progress {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

interface CardEntry {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  localImage: string;
  game: "pokemon" | "onepiece";
}

async function fetchCards(
  game: string,
  language: string,
  label: string,
  saveFile: string,
  gameType: "pokemon" | "onepiece"
): Promise<CardEntry[]> {
  const progressKey = `${game}-${language || "all"}`;
  const progress = loadProgress();
  let offset = progress[progressKey] || 0;
  
  console.log(`\n📥 ${label} (offset: ${offset})...`);
  
  // Carica esistenti
  let existingCards: CardEntry[] = [];
  try {
    existingCards = JSON.parse(fs.readFileSync(saveFile, "utf-8"));
  } catch {
    existingCards = [];
  }

  const existingIds = new Set(existingCards.map((c: CardEntry) => c.id));
  let newCards = 0;

  for (let req = 1; req <= 100; req++) {
    const params = new URLSearchParams({ game, limit: "20", offset: String(offset) });
    if (language) params.set("language", language);
    
    const url = `${BASE_URL}/cards?${params.toString()}`;
    
    try {
      const res = await fetch(url, {
        headers: { "X-Api-Key": API_KEY, "Accept": "application/json" },
      });

      if (!res.ok) {
        console.warn(`  HTTP ${res.status} at offset ${offset}`);
        break;
      }

      const data = await res.json();
      
      if (!data.data || data.data.length === 0) {
        console.log(`  No more cards.`);
        break;
      }

      // Aggiungi solo carte nuove
      for (const card of data.data) {
        if (!card.name) continue;
        const cardId = `${game}-${language || "all"}-${card.id || `offset${offset}-${existingCards.length}`}`;
        if (!existingIds.has(cardId)) {
          existingCards.push({
            id: cardId,
            name: card.name,
            setName: card.set_name || card.set || "",
            cardNumber: card.number || "",
            rarity: card.rarity || "",
            imageUrl: card.image || "",
            localImage: `/images/cards/${cardId}.jpg`,
            game: gameType,
          });
          existingIds.add(cardId);
          newCards++;
        }
      }

      offset += 20;
      
      // Salva progresso
      progress[progressKey] = offset;
      saveProgress(progress);
      
      // Salva file
      fs.writeFileSync(saveFile, JSON.stringify(existingCards, null, 2));

      const remaining = data._metadata?.apiDailyRequestsRemaining ?? 0;
      console.log(`  Req ${req}: ${data.data.length} cards, ${newCards} new (total: ${existingCards.length}, remaining: ${remaining})`);

      if (!data.meta?.hasMore) {
        console.log(`  ✅ Database completo!`);
        break;
      }
      if (remaining <= 1) break;

      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.warn(`  Error at req ${req}:`, err);
      break;
    }
  }

  return existingCards;
}

async function main() {
  console.log("🃏 Card Vault Pro — Database Builder (JustTCG)\n");
  console.log("ℹ️  Riprende da dove ha smesso.\n");

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Pokémon JP
  await fetchCards("Pokemon", "Japanese", "Pokémon JP", path.join(DATA_DIR, "pokemon-jp-cards.json"), "pokemon");

  // One Piece — il nome gioco esatto è "One Piece Card Game" con gli spazi in URL encoding
  await fetchCards("One+Piece+Card+Game", "", "One Piece", path.join(DATA_DIR, "one-piece-cards.json"), "onepiece");

  console.log(`\n🎉 Done! Esegui di nuovo domani.`);
}

main().catch(console.error);