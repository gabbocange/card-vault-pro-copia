// src/components/ShareCard.tsx — FILE COMPLETO (html2canvas con allowTaint)
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatCurrency, conditionLabel, type SaleRecord } from "@/lib/collection";
import { TrendingUp, Camera, X, Share2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  sale: SaleRecord;
  cardImage?: string;
  cardCondition?: string;
}

export function ShareCard({ sale, cardImage, cardCondition }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const roi = sale.totalCosts > 0 ? ((sale.netProfit / sale.totalCosts) * 100) : 0;
  const isPositive = sale.netProfit >= 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const imageToShow = cardImage || sale.imageUrl || "";
  const condition = sale.condition || cardCondition || "raw";
  const conditionDisplay = conditionLabel(condition as any);

  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: "#0f1219",
      scale: 2,
      allowTaint: true,
      useCORS: true,
    });
    return new Promise(resolve => canvas.toBlob(blob => resolve(blob), "image/png"));
  };

  const handleDownload = async () => {
    setDownloading(true);
    const blob = await generateBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `cardvault-${sale.cardName.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    setSharing(true);
    const blob = await generateBlob();
    if (blob) {
      const file = new File([blob], `cardvault-${sale.cardName}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: `Card Vault Pro — ${sale.cardName}`,
            text: `Just flipped ${sale.cardName} with ${isPositive ? "+" : ""}${roi.toFixed(1)}% ROI! 📈 #CardVaultPro #TCG`,
            files: [file],
          });
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          handleDownload();
        }
      } else {
        handleDownload();
      }
    }
    setSharing(false);
  };

  const overlay = showPreview && mounted ? (
    <div
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => setShowPreview(false)}
    >
      <div className="relative w-full max-w-[380px] my-auto" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShowPreview(false)} className="absolute -top-12 right-0 text-white/60 hover:text-white z-10 p-2">
          <X className="size-6" />
        </button>

        <div className="space-y-4">
          <div
            ref={cardRef}
            style={{
              aspectRatio: "9/16",
              background: "#0f1219",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "24px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "150%",
              height: "150%",
              borderRadius: "50%",
              filter: "blur(60px)",
              opacity: 0.3,
              background: "radial-gradient(circle, rgba(124,107,201,0.35) 0%, transparent 70%)",
            }} />

            <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "32px" }}>
              <div style={{ width: "176px", height: "240px", borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", background: "#1a1f2e", position: "relative" }}>
                {imageToShow ? (
                  <img src={imageToShow} alt={sale.cardName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)" }}>
                    <span style={{ fontSize: "48px" }}>{sale.game === "pokemon" ? "⚡" : "⚓"}</span>
                  </div>
                )}
                <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: "8px", padding: "2px 8px", fontSize: "10px", fontWeight: 700, color: "#fff" }}>SOLD</div>
                <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: "8px", padding: "2px 8px", fontSize: "9px", fontWeight: 700, color: "#fff", textTransform: "uppercase" }}>{conditionDisplay}</div>
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: 0 }}>{sale.cardName}</p>
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", marginTop: "4px",
                  background: condition === "raw" ? "rgba(156,163,175,0.2)" : "rgba(124,107,201,0.2)",
                  color: condition === "raw" ? "#d1d5db" : "#c4b5fd",
                }}>{conditionDisplay}</span>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", marginTop: "4px", fontFamily: "monospace", margin: "4px 0 0 0" }}>{formatCurrency(sale.salePrice)}</p>
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", fontWeight: 700, margin: "0 0 12px 0" }}>Return on Investment</p>
                <div style={{ display: "inline-flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "72px", fontWeight: 900, letterSpacing: "-0.04em", color: isPositive ? "#4ade80" : "#ef4444", lineHeight: 1 }}>
                    {isPositive ? "+" : ""}{roi.toFixed(0)}
                  </span>
                  <span style={{ fontSize: "36px", fontWeight: 900, color: isPositive ? "#4ade80" : "#ef4444" }}>%</span>
                </div>
              </div>

              <div style={{
                padding: "8px 20px", borderRadius: "9999px",
                background: isPositive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                border: isPositive ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(239,68,68,0.2)",
              }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: isPositive ? "#4ade80" : "#ef4444" }}>
                  {isPositive ? "+" : ""}{formatCurrency(sale.netProfit)}
                </span>
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 10, paddingBottom: "24px", textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "9999px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#7c6bc9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp className="size-3.5" style={{ color: "#fff" }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase" }}>CardVaultPro</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-4">
            <button onClick={handleDownload} disabled={downloading} className="flex-1 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {downloading ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4" /> : <Camera className="size-4" />}
              {done ? "Saved!" : "Download"}
            </button>
            <button onClick={handleShare} disabled={sharing} className="flex-1 py-3 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {sharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setShowPreview(true)} className="text-white/40 hover:text-violet-400 transition-colors" title="Share performance">
        <Share2 className="size-3.5" />
      </Button>
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}