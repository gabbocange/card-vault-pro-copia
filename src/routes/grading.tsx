// src/routes/grading.tsx — FILE COMPLETO (con sezioni Submitted/Graded + elimina)
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCollection, formatCurrency } from "@/lib/collection";
import { useGradingSubmissions, analyzeGrading, calculateGradingROI } from "@/lib/grading";
import type { GradingSubmission } from "@/lib/collection-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Toaster, toast } from "sonner";
import { TrendingUp, Beaker, Plus, CheckCircle, XCircle, Clock, Edit3, Save, Trash2, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/grading")({
  head: () => ({ meta: [{ title: "Grading Advisor · Card Vault Pro" }] }),
  component: GradingPage,
});

function GradingPage() {
  const { cards, updateCard } = useCollection();
  const { submissions, addSubmission, updateSubmission, removeSubmission } = useGradingSubmissions();
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showNewSubmission, setShowNewSubmission] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<GradingSubmission | null>(null);

  const rawCards = cards.filter(c => c.condition === "raw" && c.currentPrice >= 20);

  // Separa submission attive (submitted) da quelle completate (graded/returned)
  const activeSubmissions = submissions.filter(s => s.status === "submitted");
  const completedSubmissions = submissions.filter(s => s.status !== "submitted");

  const handleGradeReceived = (sub: GradingSubmission) => {
    setEditingSubmission(sub);
  };

  const handleSaveGrade = (submissionId: string, grade: string, value: number) => {
    updateSubmission(submissionId, {
      actualGrade: grade,
      actualValue: value,
      status: "graded",
      returnDate: new Date().toISOString(),
    });

    const sub = submissions.find(s => s.id === submissionId);
    if (sub) {
      const conditionMap: Record<string, any> = {
        "PSA 10": "psa10",
        "PSA 9": "psa9",
        "BGS 10": "bgs10",
        "BGS 9.5": "bgs10",
        "BGS 9": "psa9",
        "TAG 10": "tag10",
        "TAG 9": "tag10",
        "TAG 8": "graded-other",
        "PSA 8": "graded-other",
        "PSA 7": "graded-other",
        "PSA 6": "graded-other",
        "BGS 8.5": "graded-other",
        "BGS 8": "graded-other",
      };
      const newCondition = conditionMap[grade] || "graded-other";
      updateCard(sub.cardId, {
        condition: newCondition,
        currentPrice: value,
      });
    }

    toast.success(`Grade recorded: ${grade}`);
    setEditingSubmission(null);
  };

  const handleDeleteSubmission = (sub: GradingSubmission) => {
    if (confirm(`Delete this submission and revert ${sub.cardName} back to RAW?`)) {
      // Riporta la carta a RAW
      updateCard(sub.cardId, {
        condition: "raw",
      });
      removeSubmission(sub.id);
      toast.success(`${sub.cardName} reverted to RAW`);
    }
  };

  return (
    <AppShell>
      <Toaster />
      <div className="p-6 lg:p-8 space-y-8 min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Beaker className="size-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Grading Advisor</h1>
            <p className="text-sm text-white/70 mt-0.5">Analyze & track card grading submissions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setShowAnalysis(!showAnalysis)} className={`px-4 py-2 rounded-xl font-medium text-xs uppercase tracking-widest transition-all ${showAnalysis ? "bg-amber-500 text-white" : "bg-surface border border-white/10 text-white/50 hover:text-white"}`}>
            <TrendingUp className="size-3 inline mr-2" /> Analysis ({rawCards.length} RAW)
          </button>
          <button onClick={() => setShowNewSubmission(!showNewSubmission)} className={`px-4 py-2 rounded-xl font-medium text-xs uppercase tracking-widest transition-all ${showNewSubmission ? "bg-amber-500 text-white" : "bg-surface border border-white/10 text-white/50 hover:text-white"}`}>
            <Plus className="size-3 inline mr-2" /> New Submission
          </button>
        </div>

        {/* Analysis */}
        {showAnalysis && (
          <div className="glass-card-analytics space-y-4">
            <h2 className="text-lg font-semibold text-white">RAW Cards Analysis</h2>
            <div className="grid gap-3">
              {rawCards.length === 0 ? (
                <p className="text-sm text-white/50 text-center py-4">No RAW cards with value ≥ 20€</p>
              ) : (
                rawCards.map(card => {
                  const analysis = analyzeGrading(card);
                  return (
                    <div key={card.id} className="flex items-center gap-4 p-4 bg-surface-elevated rounded-xl border border-white/5">
                      <div className="size-12 rounded-lg overflow-hidden bg-white/5">
                        {card.imageUrl ? <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{card.name}</p>
                        <p className="text-xs text-white/50">{card.setName} · {card.cardNumber}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="text-white/70">RAW: {formatCurrency(card.currentPrice)}</span>
                          <span className="text-amber-400">→ PSA 10 est: {formatCurrency(analysis.estimatedPSA10Value)}</span>
                          {analysis.ratio && <span className="text-white/50">({analysis.ratio.toFixed(1)}x)</span>}
                        </div>
                      </div>
                      <div className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${analysis.isWorthGrading ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                        {analysis.isWorthGrading ? <CheckCircle className="size-3 inline mr-1" /> : <XCircle className="size-3 inline mr-1" />}
                        {analysis.isWorthGrading ? "Worth It!" : "Skip"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* New Submission */}
        {showNewSubmission && (
          <NewSubmissionDialog cards={cards} onAdd={addSubmission} onClose={() => setShowNewSubmission(false)} />
        )}

        {/* ========== ACTIVE SUBMISSIONS (in attesa) ========== */}
        <div className="glass-card-analytics space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="size-5 text-amber-400" />
            Active Submissions ({activeSubmissions.length})
          </h2>
          {activeSubmissions.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-8">No cards currently out for grading.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {activeSubmissions.map(sub => (
                <div key={sub.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{sub.cardName}</p>
                    <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                      <span>{sub.gradingCompany}</span>
                      <span>·</span>
                      <span>{sub.quantity}x</span>
                      <span>·</span>
                      <span className="text-amber-400"><Clock className="size-3 inline mr-1" />Awaiting return</span>
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      Submitted: {new Date(sub.submissionDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/70">
                    <div>Cost: {formatCurrency(sub.totalCost)}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleGradeReceived(sub)}
                    className="text-white/50 hover:text-amber-400"
                    title="Record grade received"
                  >
                    <Edit3 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========== GRADED (completate) ========== */}
        <div className="glass-card-analytics space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle className="size-5 text-green-400" />
            Graded ({completedSubmissions.length})
          </h2>
          {completedSubmissions.length === 0 ? (
            <p className="text-sm text-white/50 text-center py-8">No graded cards yet.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {completedSubmissions.map(sub => {
                const card = cards.find(c => c.id === sub.cardId);
                const roi = card ? calculateGradingROI(sub, card) : null;
                return (
                  <div key={sub.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{sub.cardName}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                        <span>{sub.gradingCompany}</span>
                        <span>·</span>
                        <span>{sub.quantity}x</span>
                        <span>·</span>
                        <span className="text-green-400 font-bold">{sub.actualGrade || "Graded"}</span>
                      </div>
                      {sub.actualValue && (
                        <div className="text-xs text-white/50 mt-1">
                          Value: {formatCurrency(sub.actualValue)}
                          {sub.returnDate && ` · Returned: ${new Date(sub.returnDate).toLocaleDateString()}`}
                        </div>
                      )}
                      {roi && (
                        <div className="text-xs mt-1">
                          <span className={roi.profit >= 0 ? "text-green-400" : "text-red-400"}>
                            ROI: {roi.roi.toFixed(1)}% ({formatCurrency(roi.profit)})
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-white/70">
                      <div>Cost: {formatCurrency(sub.totalCost)}</div>
                      {sub.actualValue && <div>Value: {formatCurrency(sub.actualValue)}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubmission(sub)}
                      className="text-white/50 hover:text-red-400"
                      title="Delete and revert to RAW"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dialog voto ricevuto */}
        {editingSubmission && (
          <GradeReceivedDialog
            submission={editingSubmission}
            company={editingSubmission.gradingCompany}
            onSave={handleSaveGrade}
            onClose={() => setEditingSubmission(null)}
          />
        )}
      </div>
    </AppShell>
  );
}

function GradeReceivedDialog({
  submission,
  company,
  onSave,
  onClose,
}: {
  submission: GradingSubmission;
  company: string;
  onSave: (submissionId: string, grade: string, value: number) => void;
  onClose: () => void;
}) {
  const [selectedGrade, setSelectedGrade] = useState("");
  const [value, setValue] = useState(submission.expectedValue || 0);

  const grades: Record<string, string[]> = {
    PSA: ["PSA 10", "PSA 9", "PSA 8", "PSA 7", "PSA 6"],
    BGS: ["BGS 10", "BGS 9.5", "BGS 9", "BGS 8.5", "BGS 8"],
    TAG: ["TAG 10", "TAG 9", "TAG 8"],
  };

  const availableGrades = grades[company] || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] bg-surface border-white/10">
        <DialogHeader>
          <DialogTitle className="font-semibold text-white">Grade Received — {submission.cardName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-medium text-white/70">Grade</Label>
            <div className="flex flex-wrap gap-2">
              {availableGrades.map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${selectedGrade === grade ? "border-amber-400 text-amber-400 bg-amber-400/10" : "border-white/10 text-white/50 hover:text-white"}`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-medium text-white/70">Current Market Value (€)</Label>
            <Input
              type="number"
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              className="bg-surface border-white/10 rounded-xl"
              placeholder="0.00"
            />
          </div>
          <Button
            onClick={() => selectedGrade && onSave(submission.id, selectedGrade, value)}
            disabled={!selectedGrade}
            className="w-full bg-amber-500 text-white hover:bg-amber-600 font-medium text-sm rounded-xl"
          >
            <Save className="size-3 mr-2" /> Save Grade & Update Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewSubmissionDialog({ cards, onAdd, onClose }: { cards: any[]; onAdd: (sub: any) => void; onClose: () => void }) {
  const [selectedCardId, setSelectedCardId] = useState("");
  const [company, setCompany] = useState<"PSA" | "BGS" | "TAG">("PSA");
  const [quantity, setQuantity] = useState(1);
  const [costPerCard, setCostPerCard] = useState(35);

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const analysis = selectedCard ? analyzeGrading(selectedCard) : null;

  const handleSubmit = () => {
    if (!selectedCard) return;
    onAdd({
      cardId: selectedCard.id,
      cardName: selectedCard.name,
      game: selectedCard.game,
      condition: selectedCard.condition,
      gradingCompany: company,
      submissionDate: new Date().toISOString(),
      costPerCard,
      quantity,
      totalCost: costPerCard * quantity,
      status: "submitted",
    });
    toast.success(`${selectedCard.name} added to submission`);
    onClose();
  };

  return (
    <div className="glass-card-analytics space-y-4">
      <h3 className="text-base font-semibold text-white">New Grading Submission</h3>
      
      <div className="space-y-2">
        <Label className="text-[10px] uppercase font-medium text-white/70">Select RAW Card</Label>
        <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full bg-surface border border-white/10 rounded-xl px-3 py-2 text-sm">
          <option value="">— Choose a card —</option>
          {cards.filter(c => c.condition === "raw").map(c => (
            <option key={c.id} value={c.id}>{c.name} — {formatCurrency(c.currentPrice)}</option>
          ))}
        </select>
      </div>

      {analysis && (
        <div className={`p-3 rounded-xl text-xs ${analysis.isWorthGrading ? "bg-green-500/5 border border-green-500/20 text-green-400" : "bg-red-500/5 border border-red-500/20 text-red-400"}`}>
          {analysis.isWorthGrading ? "✅ Recommended!" : "❌ Not recommended"}
          {" "}{analysis.reason}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-medium text-white/70">Company</Label>
          <select value={company} onChange={e => setCompany(e.target.value as any)} className="w-full bg-surface border-white/10 rounded-xl px-2 py-2 text-sm">
            <option value="PSA">PSA</option>
            <option value="BGS">BGS</option>
            <option value="TAG">TAG</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-medium text-white/70">Quantity</Label>
          <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} min={1} className="bg-surface border-white/10 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-medium text-white/70">Cost/Card (€)</Label>
          <Input type="number" value={costPerCard} onChange={e => setCostPerCard(Number(e.target.value))} min={0} className="bg-surface border-white/10 rounded-xl" />
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full bg-amber-500 text-white hover:bg-amber-600 font-medium text-sm rounded-xl shadow-lg shadow-amber-500/20">
        Add to Submission
      </Button>
    </div>
  );
}