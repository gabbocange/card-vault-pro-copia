// scripts/scrape-one-piece-promos.ts — FILE COMPLETO (SOLO PROMO)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://www.optcgapi.com/api";
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const CARDS_FILE = path.join(DATA_DIR, "one-piece-cards.json");

async function main() {
  console.log("🃏 Card Vault Pro — One Piece Promo Cards\n");

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Carica esistenti
  let existingCards: any[] = [];
  if (fs.existsSync(CARDS_FILE)) {
    existingCards = JSON.parse(fs.readFileSync(CARDS_FILE, "utf-8"));
    console.log(`📂 ${existingCards.length} cards already saved\n`);
  }

  const existingIds = new Set(existingCards.map((c: any) => c.id));

  // Scarica solo promo
  console.log("  📥 Promo Cards...");
  const res = await fetch(`${BASE_URL}/allPromos/`);
  if (!res.ok) { console.error(`HTTP ${res.status}`); return; }

  const promos = await res.json();
  console.log(`    Found ${promos.length} cards`);

  let added = 0;
  for (const card of promos) {
    const cardSetId = card.card_set_id || card.id || "";
    if (!cardSetId) continue;
    const localId = `optcg-${cardSetId.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (existingIds.has(localId)) continue;

    existingCards.push({
      id: localId,
      name: card.card_name || "",
      setName: card.set_name || "",
      cardNumber: cardSetId,
      rarity: card.rarity || "",
      imageUrl: "",
      localImage: "",
      game: "onepiece",
    });
    existingIds.add(localId);
    added++;
  }

  fs.writeFileSync(CARDS_FILE, JSON.stringify(existingCards, null, 2));
  console.log(`\n✅ Added ${added} new promo cards`);
  console.log(`✅ One Piece Total: ${existingCards.length} cards`);
}

main().catch(console.error);