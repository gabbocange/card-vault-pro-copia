// src/lib/supabase-storage.ts — FILE COMPLETO (senza reload infinito)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StorageTable = "cards" | "sales" | "chains" | "submissions" | "timeline";

export async function loadData<T>(table: StorageTable): Promise<T[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from(table)
    .select("data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) { console.error(`Error loading ${table}:`, error); return []; }
  return (data || []).map((row: any) => row.data as T);
}

export async function saveData<T>(table: StorageTable, items: T[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from(table).delete().eq("user_id", user.id);

  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const rows = batch.map(item => ({ user_id: user.id, data: item }));
    const { error } = await supabase.from(table).insert(rows);
    if (error) console.error(`Error saving ${table}:`, error);
  }
}

export async function syncOnLogin(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Flag per evitare loop
  if (sessionStorage.getItem("sync-done")) return;
  sessionStorage.setItem("sync-done", "true");

  const cloudCards = await loadData("cards");
  const cloudSales = await loadData("sales");
  const cloudChains = await loadData("chains");
  const cloudSubmissions = await loadData("submissions");
  const cloudTimeline = await loadData("timeline");

  const localCards = JSON.parse(localStorage.getItem("card-vault-pro-cards") || "[]");
  const localSales = JSON.parse(localStorage.getItem("card-vault-pro-sales") || "[]");
  const localChains = JSON.parse(localStorage.getItem("card-vault-pro-chains") || "[]");
  const localSubmissions = JSON.parse(localStorage.getItem("card-vault-pro-submissions") || "[]");
  const localTimeline = JSON.parse(localStorage.getItem("card-vault-pro-timeline") || "[]");

  const mergedCards = mergeById([...cloudCards, ...localCards]);
  const mergedSales = mergeById([...cloudSales, ...localSales]);
  const mergedChains = mergeById([...cloudChains, ...localChains]);
  const mergedSubmissions = mergeById([...cloudSubmissions, ...localSubmissions]);
  const mergedTimeline = mergeById([...cloudTimeline, ...localTimeline]);

  await saveData("cards", mergedCards);
  await saveData("sales", mergedSales);
  await saveData("chains", mergedChains);
  await saveData("submissions", mergedSubmissions);
  await saveData("timeline", mergedTimeline);

  localStorage.setItem("card-vault-pro-cards", JSON.stringify(mergedCards));
  localStorage.setItem("card-vault-pro-sales", JSON.stringify(mergedSales));
  localStorage.setItem("card-vault-pro-chains", JSON.stringify(mergedChains));
  localStorage.setItem("card-vault-pro-submissions", JSON.stringify(mergedSubmissions));
  localStorage.setItem("card-vault-pro-timeline", JSON.stringify(mergedTimeline));
}

function mergeById(items: any[]): any[] {
  const map = new Map<string, any>();
  for (const item of items) {
    if (item.id) map.set(item.id, item);
  }
  return Array.from(map.values());
}