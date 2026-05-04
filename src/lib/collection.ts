// src/lib/collection.ts — FILE COMPLETO (merge sicuro, no duplicati)
import { useCallback, useEffect, useState } from "react";
import type {
  CardCondition, CardGame, CardLanguage, CollectionCard,
  CollectionSnapshot, PriceSnapshot, SaleRecord, SaleKind,
  InvestmentChain, ChainStep,
} from "./collection-types";
import { syncOnLogin, saveData, loadData, supabase } from "./supabase-storage";

export type {
  CardCondition, CardGame, CardLanguage, CollectionCard,
  CollectionSnapshot, PriceSnapshot, SaleRecord, SaleKind,
  InvestmentChain, ChainStep,
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function forceRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cardvault-update"));
  }
}

const CARDS_KEY = "card-vault-pro-cards";
const SALES_KEY = "card-vault-pro-sales";
const CHAINS_KEY = "card-vault-pro-chains";
const SUBMISSIONS_KEY = "card-vault-pro-submissions";
const TIMELINE_KEY = "card-vault-pro-timeline";

function readKey(key: string): any[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function writeKey(key: string, data: any[]) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(data));
}

let isSyncing = false;

async function autoSync() {
  if (isSyncing) return;
  isSyncing = true;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { isSyncing = false; return; }
  await Promise.all([
    saveData("cards", readKey(CARDS_KEY)),
    saveData("sales", readKey(SALES_KEY)),
    saveData("chains", readKey(CHAINS_KEY)),
    saveData("submissions", readKey(SUBMISSIONS_KEY)),
    saveData("timeline", readKey(TIMELINE_KEY)),
  ]).catch(() => {});
  isSyncing = false;
}

const listeners = new Set<() => void>();
const timelineListeners = new Set<() => void>();
const salesListeners = new Set<() => void>();
const chainListeners = new Set<() => void>();
const submissionListeners = new Set<() => void>();

function notifyAll() { listeners.forEach(l => l()); }
function notifyTimeline() { timelineListeners.forEach(l => l()); }
function notifySales() { salesListeners.forEach(l => l()); }

// ============ COLLECTION ============
export function useCollection() {
  const [cards, setCards] = useState<CollectionCard[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setCards(readKey(CARDS_KEY));
    sync();
    setHydrated(true);
    listeners.add(sync);
    window.addEventListener("cardvault-update", sync);
    return () => {
      listeners.delete(sync);
      window.removeEventListener("cardvault-update", sync);
    };
  }, []);

  const persist = useCallback(async (next: CollectionCard[]) => {
    writeKey(CARDS_KEY, next);
    notifyAll();
    forceRefresh();
    await autoSync();
  }, []);

  const addCard = useCallback(async (card: Omit<CollectionCard, "id" | "acquiredAt" | "history"> & { acquiredAt?: string }) => {
    const now = new Date().toISOString();
    const currentCards = readKey(CARDS_KEY);
    const duplicate = currentCards.find((c: CollectionCard) => 
      c.name === card.name && c.setName === card.setName && 
      c.cardNumber === card.cardNumber && c.condition === card.condition && c.language === card.language
    );
    if (duplicate) {
      const updated = currentCards.map((c: CollectionCard) => 
        c.id === duplicate.id ? { ...c, quantity: c.quantity + (card.quantity || 1), currentPrice: card.currentPrice || c.currentPrice } : c
      );
      await persist(updated);
      return duplicate;
    }
    const next: CollectionCard = { ...card, id: uid(), acquiredAt: card.acquiredAt ?? now, history: [{ date: now, price: card.currentPrice, source: "manual" }] };
    const updated = [next, ...currentCards];
    await persist(updated);
    return next;
  }, [persist]);

  const updateCard = useCallback(async (id: string, patch: Partial<CollectionCard>) => {
    const updated = readKey(CARDS_KEY).map((c: CollectionCard) => (c.id === id ? { ...c, ...patch } : c));
    await persist(updated);
  }, [persist]);

  const removeCard = useCallback(async (id: string) => {
    await persist(readKey(CARDS_KEY).filter((c: CollectionCard) => c.id !== id));
  }, [persist]);

  const recordPrice = useCallback(async (id: string, snapshot: PriceSnapshot) => {
    const currentCards = readKey(CARDS_KEY);
    const updated = currentCards.map((c: CollectionCard) => {
      if (c.id !== id) return c;
      const history = [...(c.history ?? []), snapshot].sort((a, b) => +new Date(a.date) - +new Date(b.date));
      return { ...c, currentPrice: snapshot.price, history, lastEbayUpdate: snapshot.source.startsWith("ebay") ? snapshot.date : c.lastEbayUpdate };
    });
    await persist(updated);
    recordCollectionSnapshot(updated);
  }, [persist]);

  return { cards, hydrated, addCard, updateCard, removeCard, recordPrice };
}

// ============ SALES ============
export function useSales() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  useEffect(() => {
    const sync = () => setSales(readKey(SALES_KEY));
    sync();
    salesListeners.add(sync);
    window.addEventListener("cardvault-update", sync);
    return () => { salesListeners.delete(sync); window.removeEventListener("cardvault-update", sync); };
  }, []);
  const persist = useCallback(async (next: SaleRecord[]) => { writeKey(SALES_KEY, next); notifySales(); forceRefresh(); await autoSync(); }, []);
  const addSale = useCallback(async (input: Omit<SaleRecord, "id" | "totalCosts" | "netProfit">) => {
    const totalCosts = Number((input.acquisitionCost + input.gradingCost + input.shippingCost).toFixed(2));
    const netProfit = Number((input.salePrice - totalCosts).toFixed(2));
    const next: SaleRecord = { ...input, id: uid(), totalCosts, netProfit };
    const updated = [next, ...readKey(SALES_KEY)].sort((a, b) => +new Date(b.soldAt) - +new Date(a.soldAt));
    await persist(updated);
    return next;
  }, [persist]);
  const removeSale = useCallback(async (id: string) => { await persist(readKey(SALES_KEY).filter((s: SaleRecord) => s.id !== id)); }, [persist]);
  return { sales, addSale, removeSale };
}

// ============ CHAINS ============
export function useChains() {
  const [chains, setChains] = useState<InvestmentChain[]>([]);
  useEffect(() => {
    const sync = () => setChains(readKey(CHAINS_KEY));
    sync();
    chainListeners.add(sync);
    window.addEventListener("cardvault-update", sync);
    return () => { chainListeners.delete(sync); window.removeEventListener("cardvault-update", sync); };
  }, []);
  const persist = useCallback(async (next: InvestmentChain[]) => { writeKey(CHAINS_KEY, next); forceRefresh(); await autoSync(); }, []);
  const createChain = useCallback(async (name: string, initialInvestment: number, firstStep?: ChainStep) => {
    const chain: InvestmentChain = { id: uid(), name, initialInvestment, createdAt: new Date().toISOString(), steps: firstStep ? [firstStep] : [] };
    const updated = [...readKey(CHAINS_KEY), chain]; await persist(updated); return chain;
  }, [persist]);
  const addStepToChain = useCallback(async (chainId: string, step: ChainStep) => {
    const updated = readKey(CHAINS_KEY).map((c: InvestmentChain) => (c.id !== chainId ? c : { ...c, steps: [...c.steps, step] }));
    await persist(updated);
  }, [persist]);
  const removeChain = useCallback(async (id: string) => { await persist(readKey(CHAINS_KEY).filter((c: InvestmentChain) => c.id !== id)); }, [persist]);
  return { chains, createChain, addStepToChain, removeChain };
}

// ============ GRADING SUBMISSIONS ============
export function useGradingSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  useEffect(() => {
    const sync = () => setSubmissions(readKey(SUBMISSIONS_KEY));
    sync();
    submissionListeners.add(sync);
    window.addEventListener("cardvault-update", sync);
    return () => { submissionListeners.delete(sync); window.removeEventListener("cardvault-update", sync); };
  }, []);
  const persist = useCallback(async (next: any[]) => { writeKey(SUBMISSIONS_KEY, next); forceRefresh(); await autoSync(); }, []);
  const addSubmission = useCallback(async (sub: any) => { const next = { ...sub, id: uid() }; const updated = [next, ...readKey(SUBMISSIONS_KEY)]; await persist(updated); return next; }, [persist]);
  const updateSubmission = useCallback(async (id: string, patch: any) => { const updated = readKey(SUBMISSIONS_KEY).map((s: any) => s.id === id ? { ...s, ...patch } : s); await persist(updated); }, [persist]);
  const removeSubmission = useCallback(async (id: string) => { await persist(readKey(SUBMISSIONS_KEY).filter((s: any) => s.id !== id)); }, [persist]);
  return { submissions, addSubmission, updateSubmission, removeSubmission };
}

// ============ TIMELINE ============
export function useTimeline() {
  const [snaps, setSnaps] = useState<CollectionSnapshot[]>([]);
  useEffect(() => {
    const sync = () => setSnaps(readKey(TIMELINE_KEY));
    sync();
    timelineListeners.add(sync);
    window.addEventListener("cardvault-update", sync);
    return () => { timelineListeners.delete(sync); window.removeEventListener("cardvault-update", sync); };
  }, []);
  return snaps;
}

export function recordCollectionSnapshot(cards: CollectionCard[]) {
  if (typeof window === "undefined") return;
  if (cards.length === 0) { writeKey(TIMELINE_KEY, []); notifyTimeline(); forceRefresh(); return; }
  const earliest = cards.reduce((min, c) => Math.min(min, +new Date(c.acquiredAt)), Date.now());
  const startDay = new Date(earliest); startDay.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((+today - +startDay) / dayMs));
  const prepped = cards.map((c: CollectionCard) => ({ card: c, hist: (c.history ?? []).slice().sort((a, b) => +new Date(a.date) - +new Date(b.date)), acquiredAt: +new Date(c.acquiredAt) }));
  function priceAt(card: CollectionCard, hist: PriceSnapshot[], dayTs: number): number { if (hist.length === 0) return card.currentPrice; let chosen = hist[0]; for (const h of hist) { if (+new Date(h.date) <= dayTs) chosen = h; else break; } return chosen.price; }
  const snaps: CollectionSnapshot[] = [];
  for (let i = 0; i <= totalDays; i++) { const dayTs = +startDay + i * dayMs; let totalValue = 0, totalCost = 0; for (const { card, hist, acquiredAt } of prepped) { if (acquiredAt > dayTs) continue; totalValue += priceAt(card, hist, dayTs) * card.quantity; totalCost += card.acquisitionPrice * card.quantity; } snaps.push({ date: new Date(dayTs).toISOString(), totalValue: Number(totalValue.toFixed(2)), totalCost: Number(totalCost.toFixed(2)) }); }
  writeKey(TIMELINE_KEY, snaps);
  notifyTimeline();
  forceRefresh();
  autoSync();
}

// ============ STATS ============
export function computeStats(cards: CollectionCard[]) {
  const totalUnits = cards.reduce((s, c) => s + c.quantity, 0);
  const totalValue = cards.reduce((s, c) => s + c.currentPrice * c.quantity, 0);
  const totalCost = cards.reduce((s, c) => s + c.acquisitionPrice * c.quantity, 0);
  const delta = totalValue - totalCost;
  const deltaPct = totalCost > 0 ? (delta / totalCost) * 100 : 0;
  const pokemonCount = cards.filter((c) => c.game === "pokemon").reduce((s, c) => s + c.quantity, 0);
  const onepieceCount = cards.filter((c) => c.game === "onepiece").reduce((s, c) => s + c.quantity, 0);
  return { totalUnits, totalValue, totalCost, delta, deltaPct, pokemonCount, onepieceCount };
}

export function computeSalesStats(sales: SaleRecord[]) {
  const totalRevenue = sales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalCosts = sales.reduce((sum, s) => sum + s.totalCosts, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.netProfit, 0);
  const cashProfit = sales.filter(s => s.saleKind === "cash").reduce((sum, s) => sum + s.netProfit, 0);
  const tradeProfit = sales.filter(s => s.saleKind === "trade").reduce((sum, s) => sum + s.netProfit, 0);
  return { totalRevenue, totalCosts, totalProfit, cashProfit, tradeProfit };
}

export function computeChainStats(chain: InvestmentChain, sales: SaleRecord[]) {
  let currentCapital = chain.initialInvestment;
  const stepsData: Array<{ step: ChainStep; capitalBefore: number; capitalAfter: number; totalInvested: number; totalReturned: number }> = [];
  for (const step of chain.steps) {
    const capitalBefore = currentCapital;
    const totalReturned = step.flipIds.reduce((sum, fid) => { const sale = sales.find(s => s.id === fid); return sum + (sale?.salePrice ?? 0); }, 0);
    const totalInvested = step.investedAmount;
    currentCapital = capitalBefore - totalInvested + totalReturned;
    stepsData.push({ step, capitalBefore, capitalAfter: currentCapital, totalInvested, totalReturned });
  }
  const finalCapital = currentCapital;
  const totalROI = chain.initialInvestment > 0 ? ((finalCapital - chain.initialInvestment) / chain.initialInvestment) * 100 : 0;
  const multiplier = chain.initialInvestment > 0 ? finalCapital / chain.initialInvestment : 1;
  return { stepsData, finalCapital, totalROI, multiplier };
}

// ============ CURRENCY ============
export function getCurrency(): "USD" | "EUR" {
  if (typeof window !== "undefined") return (localStorage.getItem("card-vault-currency") as "USD" | "EUR") || "USD";
  return "USD";
}

export function setCurrency(c: "USD" | "EUR") {
  if (typeof window !== "undefined") localStorage.setItem("card-vault-currency", c);
}

export function formatCurrency(n: number) {
  const currency = getCurrency();
  if (currency === "EUR") return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n * 0.92);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

export function conditionLabel(c: CardCondition): string {
  const map: Record<CardCondition, string> = { raw: "RAW", psa10: "PSA 10", psa9: "PSA 9", bgs10: "BGS 10", tag10: "TAG 10", "graded-other": "GRADED" };
  return map[c];
}

export function gameLabel(g: CardGame) { return g === "pokemon" ? "Pokémon TCG" : "One Piece TCG"; }

export function buildEbayQuery(card: { name: string; setName: string; cardNumber?: string; condition: CardCondition; language: CardLanguage }): string {
  return [card.name, card.setName, card.cardNumber, conditionToEbayKeyword(card.condition), languageToEbayKeyword(card.language)].filter(Boolean).join(" ");
}

export function conditionToEbayKeyword(c: CardCondition): string {
  switch (c) { case "psa10": return "PSA 10"; case "psa9": return "PSA 9"; case "bgs10": return "BGS 10"; case "tag10": return "TAG 10"; case "graded-other": return "graded"; default: return ""; }
}

export function languageLabel(l: CardLanguage | undefined): string { return l === "jp" ? "JP" : "EN"; }
export function languageToEbayKeyword(l: CardLanguage | undefined): string { return l === "jp" ? "Japanese" : "English"; }

// ============ POLLING (MERGE SICURO) ============
let pollingInterval: any = null;

export function startPolling() {
  if (typeof window === "undefined") return;
  if (pollingInterval) return;

  pollingInterval = setInterval(async () => {
    if (isSyncing) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cloudCards = (await loadData("cards") || []) as CollectionCard[];
    let localCards = readKey(CARDS_KEY) as CollectionCard[];

    const localIds = new Set(localCards.map(c => c.id));
    let changed = false;

    for (const cloudCard of cloudCards) {
      if (!localIds.has(cloudCard.id)) {
        localCards.push(cloudCard);
        localIds.add(cloudCard.id);
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(CARDS_KEY, JSON.stringify(localCards));
      forceRefresh();
      notifyAll();
    }
  }, 5000);
}

export function stopPolling() {
  if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
}

export { syncOnLogin };