// src/lib/ebay-scraper.ts — FILE COMPLETO
import type { Browser, BrowserContext, Page } from "playwright";
import { isExcluded } from "./excluded-listings";

export interface ScrapedSoldItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  image?: string;
  soldAt?: string;
}

interface CacheEntry {
  expiresAt: number;
  items: ScrapedSoldItem[];
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

let exchangeRates: Record<string, number> | null = null;
let ratesLastFetched = 0;

async function getExchangeRates(): Promise<Record<string, number>> {
  if (exchangeRates && Date.now() - ratesLastFetched < 24 * 60 * 60 * 1000) return exchangeRates;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    exchangeRates = data.rates || {};
    ratesLastFetched = Date.now();
    return exchangeRates!;
  } catch (err) {
    return { USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.53, CAD: 1.36, JPY: 149.5, CHF: 0.88 };
  }
}

async function convertToUSD(price: number, currency: string): Promise<number> {
  if (currency === "USD") return price;
  const rates = await getExchangeRates();
  const rate = rates[currency];
  if (!rate) return price;
  const usdRate = rate > 0 ? 1 / rate : 1;
  return Number((price * usdRate).toFixed(2));
}

function buildSoldUrl(query: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
}

function buildActiveUrl(query: string): string {
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_BIN=1`;
}

function isRawCard(query: string): boolean {
  const normalized = query.toLowerCase();
  const gradedTerms = /\b(psa\s*\d+|bgs\s*\d+|cgc\s*\d+|sgc\s*\d+|ace|tag|ccg|aog|gma|graded)\b/i;
  return !gradedTerms.test(normalized);
}

async function scrapeWithBrowser(query: string, type: "sold" | "active", isRaw: boolean): Promise<ScrapedSoldItem[]> {
  const { chromium } = await import("playwright");
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ["--incognito", "--disable-blink-features=AutomationControlled"],
  });
  
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1920, height: 1080 },
    locale: "en-US",
  });
  
  const page = await context.newPage();

  try {
    const url = type === "sold" ? buildSoldUrl(query) : buildActiveUrl(query);
    console.log(`[ebay] Searching ${type}...`);
    
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(4000);

    const rawItems = await page.evaluate(({ type, isRaw }: { type: string; isRaw: boolean }) => {
      const results: Array<{
        id: string; title: string; price: number; currency: string;
        url: string; image?: string; soldAt?: string; _currency: string;
      }> = [];

      const allLinks = document.querySelectorAll("a[href*='/itm/']");
      const seen = new Set<string>();

      for (const link of allLinks) {
        if (results.length >= 20) break;
        const rawUrl = (link as HTMLAnchorElement).href;
        if (!rawUrl.includes("/itm/")) continue;

        const itemIdMatch = rawUrl.match(/itm\/(\d+)/);
        if (!itemIdMatch) continue;
        const itemId = itemIdMatch[1];
        if (seen.has(itemId)) continue;
        seen.add(itemId);

        const parent = link.closest("li") || link.closest("div[class*='item']") || link.parentElement;
        if (!parent) continue;

        const titleEl = parent.querySelector(".s-item__title, [class*='title'], h3");
        const title = titleEl?.textContent?.trim() || "";
        if (!title || title.length < 3) continue;
        if (/shop on ebay/i.test(title)) continue;

        if (isRaw) {
          if (/\b(PSA|BGS|ACE|TAG|CCG|AOG|CGC|SGC|GMA|graded)\b/i.test(title)) continue;
        }

        const priceEl = parent.querySelector(".s-item__price, [class*='price']");
        const priceText = priceEl?.textContent?.trim() || "";
        const priceMatch = priceText.match(/\$?\s*([\d,]+\.?\d{0,2})/);
        if (!priceMatch) continue;
        const price = Number(priceMatch[1].replace(/,/g, ""));
        if (price <= 0) continue;

        let currency = "USD";
        if (priceText.includes("AU $") || priceText.includes("AUD")) currency = "AUD";
        else if (priceText.includes("EUR") || priceText.includes("€")) currency = "EUR";
        else if (priceText.includes("GBP") || priceText.includes("£")) currency = "GBP";
        else if (priceText.includes("CAD") || priceText.includes("C$")) currency = "CAD";
        else if (priceText.includes("JPY") || priceText.includes("¥")) currency = "JPY";

        const imgEl = parent.querySelector("img");
        const imgUrl = imgEl?.getAttribute("src") || "";

        let soldAt: string | undefined;
        if (type === "sold") {
          const text = parent.textContent || "";
          const dateMatch = text.match(/Sold\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/);
          if (dateMatch) {
            const parsed = new Date(dateMatch[1]);
            if (!isNaN(+parsed)) soldAt = parsed.toISOString();
          }
        }

        results.push({
          id: itemId, title, price, currency: "USD",
          url: rawUrl, image: imgUrl || undefined,
          soldAt, _currency: currency,
        });
      }
      return results;
    }, { type, isRaw });

    const items: ScrapedSoldItem[] = [];
    for (const item of rawItems) {
      if (item.price < 2) continue;
      if (isExcluded(item.id)) continue;
      const currency = item._currency || "USD";
      const price = await convertToUSD(item.price, currency);
      items.push({
        id: item.id, title: item.title, price, currency: "USD",
        url: item.url, image: item.image, soldAt: item.soldAt,
      });
    }

    console.log(`[ebay] Found ${items.length} ${type} items`);
    return items;
  } catch (err) {
    console.error("[ebay] Error:", err);
    return [];
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export interface ScrapeResult {
  items: ScrapedSoldItem[];
  source: "browser" | "cache" | "empty";
  cacheAge?: number;
}

export async function scrapeEbaySold(query: string): Promise<ScrapeResult> {
  const key = "sold-" + query.trim().toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return { items: cached.items, source: "cache", cacheAge: Math.round((now - (cached.expiresAt - CACHE_TTL_MS)) / 1000) };
  }
  const items = await scrapeWithBrowser(query, "sold", isRawCard(query));
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, items });
  return { items, source: items.length > 0 ? "browser" : "empty" };
}

export async function scrapeEbayActive(query: string): Promise<ScrapeResult> {
  const key = "active-" + query.trim().toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return { items: cached.items, source: "cache", cacheAge: Math.round((now - (cached.expiresAt - CACHE_TTL_MS)) / 1000) };
  }
  const items = await scrapeWithBrowser(query, "active", isRawCard(query));
  cache.set(key, { expiresAt: now + CACHE_TTL_MS, items });
  return { items, source: items.length > 0 ? "browser" : "empty" };
}