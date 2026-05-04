// scripts/scrape-cards.ts — FILE COMPLETO (DOWNLOAD DA DATASET GITHUB)
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "public", "data");
const IMG_DIR = path.join(__dirname, "..", "public", "images", "cards");

// ========== DOWNLOAD IMMAGINI ==========
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

// ========== MAIN ==========
async function main() {
  console.log("🃏 Card Vault Pro — Database Builder (da GitHub)\n");
  
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  // ====== POKÉMON JP ======
  console.log("[pokemon JP] Downloading from GitHub dataset...");
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/cards/jp/cards.json"
    );
    const pcJP = await res.json();
    
    const localPC = pcJP.map((c: any, i: number) => ({
      id: `pkmn-jp-${i}`,
      name: c.name || "",
      setName: c.set?.name || "",
      cardNumber: c.number || "",
      rarity: c.rarity || "",
      imageUrl: c.images?.small || c.images?.large || "",
      localImage: `/images/cards/pkmn-jp-${i}.jpg`,
      game: "pokemon",
    }));

    fs.writeFileSync(path.join(DATA_DIR, "pokemon-jp-cards.json"), JSON.stringify(localPC, null, 2));
    console.log(`  ✅ Pokémon JP: ${localPC.length} cards`);

    // Scarica immagini
    let downloaded = 0;
    for (const c of localPC) {
      if (!c.imageUrl) continue;
      const dest = path.join(IMG_DIR, `pkmn-jp-${c.id.split("-").pop()}.jpg`);
      if (await downloadImage(c.imageUrl, dest)) downloaded++;
    }
    console.log(`  ✅ Images: ${downloaded}`);
  } catch (err) {
    console.warn("  Pokémon JP failed:", err);
  }

  // ====== ONE PIECE ======
  console.log("\n[one piece] Downloading from GitHub dataset...");
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/one-piece-tcg/one-piece-tcg-data/main/cards.json"
    );
    const opData = await res.json();
    
    const localOP = opData.map((c: any, i: number) => ({
      id: `op-${i}`,
      name: c.name || "",
      setName: c.set || "",
      cardNumber: c.number || "",
      rarity: c.rarity || "",
      imageUrl: c.image || "",
      localImage: `/images/cards/op-${i}.jpg`,
      game: "onepiece",
    }));

    fs.writeFileSync(path.join(DATA_DIR, "one-piece-cards.json"), JSON.stringify(localOP, null, 2));
    console.log(`  ✅ One Piece: ${localOP.length} cards`);

    // Scarica immagini
    let downloaded = 0;
    for (const c of localOP) {
      if (!c.imageUrl) continue;
      const dest = path.join(IMG_DIR, `op-${c.id.split("-").pop()}.jpg`);
      if (await downloadImage(c.imageUrl, dest)) downloaded++;
    }
    console.log(`  ✅ Images: ${downloaded}`);
  } catch (err) {
    console.warn("  One Piece failed:", err);
  }

  console.log("\n🎉 Database completato!");
  console.log("   pokemon-jp-cards.json e one-piece-cards.json salvati.");
}

main().catch(console.error);