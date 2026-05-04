// src/lib/auto-updater.ts — FILE COMPLETO (import corretto)
import { searchCardPrices, getBestPrice } from "./pokewallet";
import { buildEbayQuery } from "./collection";

const UPDATE_INTERVAL = 6 * 60 * 60 * 1000;
const BATCH_DELAY = 2000;

let isUpdating = false;
let updateTimer: any = null;

export async function updateAllPrices() {
  if (isUpdating) {
    console.log("[auto-update] Already updating, skipping");
    return;
  }

  isUpdating = true;
  console.log("[auto-update] Starting price update for all cards...");

  try {
    const rawCards = localStorage.getItem("card-vault-pro-cards");
    if (!rawCards) {
      console.log("[auto-update] No cards found");
      return;
    }

    const cards = JSON.parse(rawCards);
    let updated = 0;
    let failed = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      
      if (card.game !== "pokemon") continue;

      try {
        // Se ha un ID PokéWallet, usalo direttamente
        if (card.pokewalletId) {
          const { getPriceById } = await import("./pokewallet");
          const price = await getPriceById(card.pokewalletId);
          if (price && price !== card.currentPrice) {
            cards[i].currentPrice = price;
            cards[i].lastEbayUpdate = new Date().toISOString();
            cards[i].history = [
              ...(cards[i].history || []),
              { date: new Date().toISOString(), price, source: "pokewallet-auto" as any },
            ];
            updated++;
          }
        } else {
          // Cerca per query
          const query = buildEbayQuery(card);
          const simplified = query.split(" ").slice(0, 4).join(" ");
          const results = await searchCardPrices(simplified);
          
          if (results.length > 0) {
            const bestPrice = getBestPrice(results[0]);
            if (bestPrice && bestPrice !== card.currentPrice) {
              cards[i].currentPrice = bestPrice;
              cards[i].lastEbayUpdate = new Date().toISOString();
              cards[i].pokewalletId = results[0].id;
              cards[i].history = [
                ...(cards[i].history || []),
                { date: new Date().toISOString(), price: bestPrice, source: "pokewallet-auto" as any },
              ];
              updated++;
            }
          }
        }
      } catch (err) {
        failed++;
      }

      if (i % 10 === 0) {
        localStorage.setItem("card-vault-pro-cards", JSON.stringify(cards));
      }

      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }

    localStorage.setItem("card-vault-pro-cards", JSON.stringify(cards));
    console.log(`[auto-update] Done! Updated: ${updated}, Failed: ${failed}`);
  } catch (err) {
    console.error("[auto-update] Error:", err);
  } finally {
    isUpdating = false;
  }
}

export function startAutoUpdate() {
  console.log(`[auto-update] Auto-update every ${UPDATE_INTERVAL / 3600000} hours`);
  setTimeout(() => updateAllPrices(), 30000);
  updateTimer = setInterval(() => updateAllPrices(), UPDATE_INTERVAL);
}

export function stopAutoUpdate() {
  if (updateTimer) {
    clearInterval(updateTimer);
    updateTimer = null;
  }
}