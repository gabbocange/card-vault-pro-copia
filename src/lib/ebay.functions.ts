// src/lib/ebay.functions.ts — FILE COMPLETO (PULITO)
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchInput = z.object({
  query: z.string().min(2).max(200),
});

const ItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  currency: z.string(),
  url: z.string(),
  image: z.string().optional(),
  soldAt: z.string().optional(),
});

const SearchOutput = z.object({
  consensusPrice: z.number().nullable(),
  soldMedian: z.number().nullable(),
  activeMedian: z.number().nullable(),
  marketDelta: z.number().nullable(),
  signal: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  sampleSize: z.number(),
  currency: z.string(),
  soldItems: z.array(ItemSchema),
  activeItems: z.array(ItemSchema),
  soldSource: z.string(),
  error: z.string().nullable(),
  ebaySoldUrl: z.string().optional(),
});

export type EbaySearchResult = z.infer<typeof SearchOutput>;
export type EbayItem = z.infer<typeof ItemSchema>;

async function fetchEbayActiveListings(query: string): Promise<EbayItem[]> {
  const token = process.env.EBAY_USER_TOKEN?.replace(/^"|"$/g, "") || "";
  console.log("[eBay] Token length:", token.length);
  
  const params = new URLSearchParams({
    q: query,
    limit: "20",
    filter: "buyingOptions:{FIXED_PRICE},priceCurrency:USD",
  });

  const res = await fetch(
    `https://api.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[eBay] Response:", text.slice(0, 300));
    throw new Error(`eBay API ${res.status}`);
  }

  const data = await res.json();
  return (data.itemSummaries || []).map((item: any) => ({
    id: item.itemId || "",
    title: item.title || "",
    price: Number(item.price?.value || 0),
    currency: item.price?.currency || "USD",
    url: item.itemWebUrl || "",
    image: item.image?.imageUrl || "",
  }));
}

export const searchEbay = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data }): Promise<EbaySearchResult> => {
    const empty: EbaySearchResult = {
      consensusPrice: null, soldMedian: null, activeMedian: null,
      marketDelta: null, signal: "none", min: null, max: null,
      sampleSize: 0, currency: "USD", soldItems: [], activeItems: [],
      soldSource: "empty", error: null,
      ebaySoldUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(data.query)}&LH_Sold=1&LH_Complete=1&_sop=13`,
    };

    try {
      const activeItems = await fetchEbayActiveListings(data.query);

      if (activeItems.length === 0) {
        return { ...empty, error: "No active listings found" };
      }

      const prices = activeItems.map(i => i.price).filter(p => p > 0).sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)];
      const min = prices[0];
      const max = prices[prices.length - 1];

      return {
        ...empty,
        consensusPrice: Number(median.toFixed(2)),
        activeMedian: Number(median.toFixed(2)),
        signal: "ebay-active",
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        sampleSize: activeItems.length,
        activeItems: activeItems.slice(0, 12),
        soldSource: "ebay-api",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[eBay] Error:", msg);
      return { ...empty, error: msg };
    }
  });

export function recomputeConsensus(
  soldItems: EbayItem[],
  activeItems: EbayItem[],
  excludedIds: string[],
) {
  const prices = activeItems
    .filter(i => !excludedIds.includes(i.id))
    .map(i => i.price)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return { consensusPrice: null, soldMedian: null, activeMedian: null, signal: "none" };
  }

  const median = prices[Math.floor(prices.length / 2)];
  return {
    consensusPrice: median,
    soldMedian: null,
    activeMedian: median,
    signal: "ebay-active",
  };
}