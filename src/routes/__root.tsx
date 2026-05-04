// src/routes/__root.tsx — FILE COMPLETO (con polling)
import { Outlet, Link, createRootRoute, HeadContent, Scripts, useLocation, useNavigate } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { syncOnLogin, startPolling, stopPolling } from "@/lib/collection";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold font-mono text-laser-cyan">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Asset not catalogued</h2>
        <p className="mt-2 text-sm text-muted-foreground">This route is not in the vault index.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded bg-laser-cyan px-4 py-2 text-sm font-bold font-mono uppercase text-background hover:opacity-90">
            Return to Vault
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Card Vault Pro — TCG Collection Tracker" },
      { name: "description", content: "Track your Pokémon and One Piece TCG collection." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center">
        <div className="size-8 rounded-xl bg-violet-500 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-sm">CV</span>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AuthRedirect />
    </AuthProvider>
  );
}

function AuthRedirect() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (user && !synced) {
      syncOnLogin().then(() => {
        console.log("✅ Data synced from Supabase");
        setSynced(true);
      }).catch(err => {
        console.error("Sync failed:", err);
        setSynced(true);
      });
    }
  }, [user, synced]);

  // Avvia polling dopo il sync
  useEffect(() => {
    if (user && synced) {
      startPolling();
      return () => stopPolling();
    }
  }, [user, synced]);

  useEffect(() => {
    if (!loading && !user && location.pathname !== "/login") {
      navigate({ to: "/login" });
    }
  }, [user, loading, location.pathname]);

  if (loading || (user && !synced)) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center">
        <div className="text-center">
          <div className="size-8 rounded-xl bg-violet-500 flex items-center justify-center animate-pulse mx-auto mb-4">
            <span className="text-white font-bold text-sm">CV</span>
          </div>
          <p className="text-sm text-white/50">
            {user ? "Syncing your data..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}