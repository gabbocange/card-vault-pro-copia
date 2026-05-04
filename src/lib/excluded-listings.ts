// src/lib/excluded-listings.ts — FILE COMPLETO (NUOVO)
function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem("card-vault-device-id");
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem("card-vault-device-id", id);
  }
  return id;
}

function storageKey(base: string): string {
  return `card-vault-pro-${getDeviceId()}-${base}`;
}

const EXCLUDED_KEY = () => storageKey("excluded-ids-v1");

export function readExcluded(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(EXCLUDED_KEY());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addExcluded(id: string) {
  if (typeof window === "undefined") return;
  const current = readExcluded();
  if (!current.includes(id)) {
    current.push(id);
    window.localStorage.setItem(EXCLUDED_KEY(), JSON.stringify(current));
  }
}

export function isExcluded(id: string): boolean {
  return readExcluded().includes(id);
}