// src/components/AppShell.tsx — FILE COMPLETO (senza CurrencySwitcher nella sidebar)
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Sparkles, Anchor, Plus, TrendingUp, Search, Beaker, LogOut, LogIn } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const navItems = [
  { to: "/", label: "Global Portfolio", icon: LayoutDashboard, group: "Inventory" },
  { to: "/collection/pokemon", label: "Pokédex", icon: Sparkles, group: "Inventory" },
  { to: "/collection/onepiece", label: "One Piece Crews", icon: Anchor, group: "Inventory" },
  { to: "/search", label: "Market Search", icon: Search, group: "Tools" },
  { to: "/grading", label: "Grading", icon: Beaker, group: "Tools" },
  { to: "/transactions", label: "Transaction Log", icon: TrendingUp, group: "Finance" },
  { to: "/add", label: "Add Card", icon: Plus, group: "Actions" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const groups = Array.from(new Set(navItems.map((i) => i.group)));
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#080b12]">
        {/* Logo + Sign In/Out */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white font-bold text-sm">CV</span>
            </div>
            <span className="font-semibold tracking-tight text-lg text-white">
              Card<span className="text-violet-400">Vault Pro</span>
            </span>
          </div>

          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              <div className="size-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <div className="text-[11px] font-medium text-white truncate">{user.email?.split("@")[0]}</div>
                <div className="text-[9px] text-white/40">Click to sign out</div>
              </div>
              <LogOut className="size-3.5 text-white/40" />
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all"
            >
              <LogIn className="size-4" />
              <span className="font-medium">Sign In</span>
            </Link>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 px-2 font-medium">
                {group}
              </div>
              <div className="space-y-1">
                {navItems
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const active = location.pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          active
                            ? "bg-violet-500/15 border border-violet-500/20 text-violet-400 shadow-sm"
                            : "text-white/60 hover:text-white hover:bg-white/5",
                        )}
                      >
                        <Icon className="size-4" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="size-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <span className="font-mono text-xs text-violet-400 font-bold">042</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">OPERATOR_042</span>
              <span className="text-[10px] text-green-400 font-medium uppercase">Local Vault</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between border-b border-white/5 bg-[#080b12] px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">CV</span>
            </div>
            <span className="font-semibold text-white text-sm">
              Card<span className="text-violet-400">Vault Pro</span>
            </span>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((i) => {
              const active = location.pathname === i.to;
              const Icon = i.icon;
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    active ? "text-violet-400 bg-violet-500/10" : "text-white/60",
                  )}
                  aria-label={i.label}
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}