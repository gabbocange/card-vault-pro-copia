// src/routes/search.tsx — FILE COMPLETO (VIOLA UNIFORME + GLASS)
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Toaster } from "sonner";
import { Search, Loader2, ExternalLink, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/collection";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { performEbaySearch } from "@/lib/ebay-search-api";

const SearchInput = z.object({ query: z.string().min(3).max(200) });
const searchEbayApi = createServerFn({ method: "POST" }).inputValidator((input: unknown) => SearchInput.parse(input)).handler(async ({ data }) => { return await performEbaySearch(data.query); });

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Market Search · Card Vault Pro" }, { name: "description", content: "Search card prices on eBay." }] }),
  component: SearchPage,
});

function SearchPage() {
  const searchFn = useServerFn(searchEbayApi);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ active: any[]; sold: any[] }>({ active: [], sold: [] });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "sold">("active");

  const handleSearch = async () => {
    if (!query.trim() || query.length < 3) return;
    setLoading(true); setError("");
    try {
      const data = await searchFn({ data: { query: query.trim() } });
      setResults({
        active: (data.activeItems || []).map((item: any) => ({ ...item, type: "active" })),
        sold: (data.soldItems || []).map((item: any) => ({ ...item, type: "sold" })),
      });
    } catch (err) { setError(err instanceof Error ? err.message : "Search failed"); }
    finally { setLoading(false); }
  };

  const currentResults = activeTab === "active" ? results.active : results.sold;
  const median = currentResults.length > 0 ? currentResults.map((r: any) => r.price).sort((a: number, b: number) => a - b)[Math.floor(currentResults.length / 2)] : null;

  return (
    <AppShell>
      <Toaster />
      <div className="p-6 lg:p-8 space-y-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Search className="size-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Market Search</h1>
            <p className="text-sm text-white/70 mt-0.5">Look up any card on eBay</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="glass-card-analytics !p-0 !bg-transparent !backdrop-filter-none !border-none !shadow-none">
          <div className="flex gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search any card on eBay... (e.g. Charizard VMAX PSA 10)"
              className="flex-1 bg-surface border-white/10 rounded-xl font-medium text-sm h-12 focus:border-violet-400/50 transition-all"
            />
            <Button
              onClick={handleSearch}
              disabled={loading || query.length < 3}
              className="bg-violet-500 text-white hover:bg-violet-600 font-medium text-sm rounded-xl px-6 h-12 shadow-lg shadow-violet-500/20 transition-all"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Results */}
        {(results.active.length > 0 || results.sold.length > 0) ? (
          <>
            {/* Tabs */}
            <div className="flex gap-2 items-center">
              <button onClick={() => setActiveTab("active")} className={`px-4 py-2 rounded-xl font-medium text-xs uppercase tracking-widest transition-all ${activeTab === "active" ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "bg-surface border border-white/10 text-white/50 hover:text-white"}`}>
                Active ({results.active.length})
              </button>
              <button onClick={() => setActiveTab("sold")} className={`px-4 py-2 rounded-xl font-medium text-xs uppercase tracking-widest transition-all ${activeTab === "sold" ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "bg-surface border border-white/10 text-white/50 hover:text-white"}`}>
                Sold ({results.sold.length})
              </button>
              {median && (
                <div className="ml-auto flex items-center gap-2 text-sm font-mono text-violet-400">
                  <DollarSign className="size-3" />
                  Median: {formatCurrency(median)}
                </div>
              )}
            </div>

            {/* Listings */}
            <div className="glass-card-analytics !p-0 overflow-hidden">
              {currentResults.length === 0 ? (
                <div className="p-12 text-center text-sm text-white/50">No {activeTab} listings found.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {currentResults.map((item: any) => (
                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-4 px-4 sm:px-6 py-3 hover:bg-white/5 transition-colors group">
                      <div className="size-14 shrink-0 rounded-xl bg-surface-elevated border border-white/5 overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><Search className="size-5" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-violet-400 transition-colors">{item.title}</p>
                        {item.soldAt && <span className="text-[10px] text-white/50 font-medium">Sold: {new Date(item.soldAt).toLocaleDateString()}</span>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-lg font-semibold tabular-nums text-white">{formatCurrency(item.price)}</div>
                        <div className="text-[9px] text-white/50 font-medium uppercase">{item.currency || "USD"}</div>
                      </div>
                      <ExternalLink className="size-4 text-white/30 group-hover:text-violet-400 transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : !loading ? (
          /* Empty state */
          <div className="glass-card-analytics text-center">
            <Search className="size-12 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-white/70 mb-2">Search for any card to see live market prices</p>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Pulls real-time data from eBay</p>
          </div>
        ) : null}

        {error && (
          <div className="glass-card-analytics !border-red-500/20 !bg-red-500/5 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
      </div>
    </AppShell>
  );
}