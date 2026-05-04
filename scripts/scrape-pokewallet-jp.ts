// scripts/scrape-pokewallet-jp.ts — FILE COMPLETO (POKÉWALLET API)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = "pk_live_4630bf824d160d18f2a13d3169556f0c742fb87893e70685";
const BASE_URL = "https://api.pokewallet.io";
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const IMG_DIR = path.join(__dirname, "..", "public", "images", "cards");

interface CardEntry {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  rarity: string;
  imageUrl: string;
  localImage: string;
  game: "pokemon";
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  if (!url || fs.existsSync(destPath)) return fs.existsSync(destPath);
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch { return false; }
}

async function fetchJPSets(): Promise<CardEntry[]> {
  console.log("[pokemon JP] Fetching Japanese sets from PokéWallet...");

  // Prendi la lista dei set giapponesi
  const setsRes = await fetch(`${BASE_URL}/sets?language=jap`, {
    headers: { "X-API-Key": API_KEY },
  });

  if (!setsRes.ok) throw new Error(`Sets HTTP ${setsRes.status}`);

  const setsData = await setsRes.json();
  const jpSets = setsData.data || [];
  console.log(`  Found ${jpSets.length} JP sets`);

  const allCards: CardEntry[] = [];

  for (const set of jpSets) {
    const setCode = set.set_id || set.set_code;
    if (!setCode) continue;

    try {
      const url = `${BASE_URL}/sets/${setCode}?limit=200`;
      console.log(`  Fetching ${set.name} (${setCode})...`);

      const res = await fetch(url, {
        headers: { "X-API-Key": API_KEY },
      });

      if (!res.ok) { console.warn(`    HTTP ${res.status}`); continue; }

      const data = await res.json();

      if (data.disambiguation) {
        // Scegli il primo match
        const firstMatch = data.matches[0];
        if (!firstMatch) continue;
        const res2 = await fetch(`${BASE_URL}/sets/${firstMatch.set_id}?limit=200`, {
          headers: { "X-API-Key": API_KEY },
        });
        if (!res2.ok) continue;
        const data2 = await res2.json();
        data.cards = data2.cards;
      }

      const cards = data.cards || [];
      for (const card of cards) {
        const cardId = card.id || `jp-${setCode}-${allCards.length}`;
        const localId = `pokewallet-jp-${cardId.replace(/[^a-zA-Z0-9]/g, "-")}`;

        allCards.push({
          id: localId,
          name: card.card_info?.name || "",
          setName: card.card_info?.set_name || set.name || "",
          cardNumber: card.card_info?.card_number || "",
          rarity: card.card_info?.rarity || "",
          imageUrl: `https://api.pokewallet.io/images/${cardId}?size=high`,
          localImage: `/images/cards/${localId}.jpg`,
          game: "pokemon",
        });
      }

      console.log(`    ${cards.length} cards (total: ${allCards.length})`);

      // Salva ogni 5 set per sicurezza
      if (jpSets.indexOf(set) % 5 === 0) {
        fs.writeFileSync(
          path.join(DATA_DIR, "pokemon-jp-cards.json"),
          JSON.stringify(allCards, null, 2)
        );
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.warn(`    Failed: ${set.name}`);
    }
  }

  return allCards;
}

async function main() {
  console.log("🃏 Card Vault Pro — Pokémon JP (PokéWallet API)\n");

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  const cards = await fetchJPSets();
  fs.writeFileSync(path.join(DATA_DIR, "pokemon-jp-cards.json"), JSON.stringify(cards, null, 2));
  console.log(`\n✅ Pokémon JP: ${cards.length} cards saved`);

  // Scarica immagini
  console.log(`\n📸 Downloading ${cards.length} images...`);
  let downloaded = 0;
  for (const card of cards) {
    if (!card.imageUrl) continue;
    const destPath = path.join(IMG_DIR, `${card.id}.jpg`);
    if (await downloadImage(card.imageUrl, destPath)) {
      downloaded++;
      if (downloaded % 100 === 0) console.log(`  Downloaded ${downloaded} images...`);
    }
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n✅ Images: ${downloaded}`);
  console.log(`🎉 Database completato!`);
}

main().catch(console.error);