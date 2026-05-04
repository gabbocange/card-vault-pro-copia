const API_KEY = "pk_live_4630bf824d160d18f2a13d3169556f0c742fb87893e70685";
const BASE_URL = "https://api.pokewallet.io";

export interface PriceResult {
  id: string;
  name: string;
  setCode: string;
  cardNumber: string;
  marketPrice: number | null;
  cmAvgPrice: number | null;
  cmTrendPrice: number | null;
  source: "tcgplayer" | "cardmarket" | "both" | "none";
}

export async function searchCardPrices(query: string): Promise<PriceResult[]> {
  try {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url, {
      headers: { "X-API-Key": API_KEY },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || data.results.length === 0) return [];

    return data.results.map((card: any) => {
      const info = card.card_info || {};
      return {
        id: card.id || "",
        name: info.name || info.clean_name || "",
        setCode: info.set_code || "",
        cardNumber: info.card_number || "",
        marketPrice: card.tcgplayer?.prices?.[0]?.market_price || card.tcgplayer?.prices?.[0]?.mid_price || null,
        cmAvgPrice: card.cardmarket?.prices?.[0]?.avg || null,
        cmTrendPrice: card.cardmarket?.prices?.[0]?.trend || null,
        source: (card.tcgplayer && card.cardmarket) ? "both" : card.tcgplayer ? "tcgplayer" : card.cardmarket ? "cardmarket" : "none",
      };
    });
  } catch {
    return [];
  }
}

export async function getPriceById(cardId: string): Promise<number | null> {
  try {
    const url = `${BASE_URL}/cards/${cardId}`;
    const res = await fetch(url, {
      headers: { "X-API-Key": API_KEY },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const tcg = data.tcgplayer;
    const cm = data.cardmarket;

    if (tcg?.prices?.length) {
      return tcg.prices[0].market_price || tcg.prices[0].mid_price || null;
    }
    if (cm?.prices?.length) {
      return cm.prices[0].trend || cm.prices[0].avg || null;
    }
    return null;
  } catch {
    return null;
  }
}

export function getBestPrice(result: PriceResult): number | null {
  if (result.marketPrice !== null) return result.marketPrice;
  if (result.cmTrendPrice !== null) return result.cmTrendPrice * 1.08;
  if (result.cmAvgPrice !== null) return result.cmAvgPrice * 1.08;
  return null;
}