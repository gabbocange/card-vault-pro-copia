// src/components/CurrencySwitcher.tsx — FILE COMPLETO (PIÙ VISIBILE)
import { useState } from "react";
import { getCurrency, setCurrency } from "@/lib/collection";

export function CurrencySwitcher() {
  const [currency, setCurrencyState] = useState<"USD" | "EUR">(getCurrency());

  const toggle = () => {
    const next = currency === "USD" ? "EUR" : "USD";
    setCurrency(next);
    setCurrencyState(next);
    window.location.reload();
  };

  return (
  <>
    
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-sm font-bold hover:bg-violet-500/20 transition-all"
      title={`Switch to ${currency === "USD" ? "EUR" : "USD"}`}
    >
      <span className={currency === "USD" ? "text-violet-400" : "text-white/40"}>$</span>
      <span className="text-white/20">/</span>
      <span className={currency === "EUR" ? "text-violet-400" : "text-white/40"}>€</span>
      <span className="text-[10px] ml-1 text-violet-400 font-mono">{currency}</span>
    </button>
  </>
);
}