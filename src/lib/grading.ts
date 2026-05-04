// src/lib/grading.ts — FILE COMPLETO (NUOVO)
import { useCallback, useEffect, useState } from "react";
import type { CollectionCard, GradingSubmission } from "./collection-types";
import { useCollection } from "./collection";

// Storage per le submission
function readSubmissions(): GradingSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("card-vault-submissions");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeSubmissions(subs: GradingSubmission[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("card-vault-submissions", JSON.stringify(subs));
  }
}

export function useGradingSubmissions() {
  const [submissions, setSubmissions] = useState<GradingSubmission[]>([]);

  useEffect(() => {
    setSubmissions(readSubmissions());
  }, []);

  const addSubmission = useCallback((sub: Omit<GradingSubmission, "id">) => {
    const next: GradingSubmission = {
      ...sub,
      id: crypto.randomUUID(),
    };
    const updated = [next, ...readSubmissions()];
    writeSubmissions(updated);
    setSubmissions(updated);
    return next;
  }, []);

  const updateSubmission = useCallback((id: string, patch: Partial<GradingSubmission>) => {
    const updated = readSubmissions().map(s => s.id === id ? { ...s, ...patch } : s);
    writeSubmissions(updated);
    setSubmissions(updated);
  }, []);

  const removeSubmission = useCallback((id: string) => {
    const updated = readSubmissions().filter(s => s.id !== id);
    writeSubmissions(updated);
    setSubmissions(updated);
  }, []);

  return { submissions, addSubmission, updateSubmission, removeSubmission };
}

/** Analizza se conviene gradare una carta RAW */
export function analyzeGrading(card: CollectionCard): {
  isWorthGrading: boolean;
  ratio: number | null;
  reason: string;
  estimatedPSA10Value: number;
  minRecommendedValue: number;
} {
  const rawValue = card.currentPrice;
  const gradingCost = 35; // € per carta (PSA bulk)
  
  // Stima PSA 10 come 3x del RAW (regola generale)
  const estimatedPSA10Value = rawValue * 3;
  
  if (card.condition !== "raw") {
    return {
      isWorthGrading: false,
      ratio: null,
      reason: "Card is already graded",
      estimatedPSA10Value,
      minRecommendedValue: 0,
    };
  }

  if (rawValue < 20) {
    return {
      isWorthGrading: false,
      ratio: null,
      reason: `Raw value too low (${rawValue}€). Minimum recommended: 20€`,
      estimatedPSA10Value,
      minRecommendedValue: 20,
    };
  }

  const ratio = estimatedPSA10Value / rawValue;
  
  // Vale la pena se il valore stimato PSA 10 copre almeno 3x il costo di gradazione
  const profitIfPSA10 = estimatedPSA10Value - rawValue - gradingCost;
  const isWorthGrading = profitIfPSA10 > gradingCost * 2; // Profitto almeno 2x il costo

  return {
    isWorthGrading,
    ratio,
    reason: isWorthGrading
      ? `PSA 10 estimated at ${estimatedPSA10Value}€ (${ratio.toFixed(1)}x). Potential profit: ${profitIfPSA10}€`
      : `PSA 10 estimated at ${estimatedPSA10Value}€. Not enough margin after grading costs.`,
    estimatedPSA10Value,
    minRecommendedValue: 20,
  };
}

/** Calcola ROI effettivo dopo gradazione */
export function calculateGradingROI(submission: GradingSubmission, card: CollectionCard | undefined): {
  totalCost: number;
  finalValue: number;
  profit: number;
  roi: number;
} | null {
  if (!card || !submission.actualValue) return null;

  const totalCost = card.acquisitionPrice + submission.totalCost;
  const finalValue = submission.actualValue;
  const profit = finalValue - totalCost;
  const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  return { totalCost, finalValue, profit, roi };
}