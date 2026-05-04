// src/lib/ebay-search-api.ts — FILE COMPLETO
import { scrapeEbaySold, scrapeEbayActive } from "./ebay-scraper";

export interface SearchApiResult {
  activeItems: Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    image?: string;
    condition?: string;
  }>;
  soldItems: Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    image?: string;
    soldAt?: string;
  }>;
}

export async function performEbaySearch(query: string): Promise<SearchApiResult> {
  const [activeResult, soldResult] = await Promise.all([
    scrapeEbayActive(query).catch(() => ({ items: [] })),
    scrapeEbaySold(query).catch(() => ({ items: [] })),
  ]);

  return {
    activeItems: activeResult.items.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency,
      url: item.url,
      image: item.image,
      condition: undefined,
    })),
    soldItems: soldResult.items.map((item) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency,
      url: item.url,
      image: item.image,
      soldAt: item.soldAt,
    })),
  };
}