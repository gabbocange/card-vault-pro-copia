// src/lib/collection-types.ts — FILE COMPLETO (con pokewalletId e source aggiornato)
export type CardGame = "pokemon" | "onepiece";
export type CardLanguage = "en" | "jp";
export type CardCondition =
  | "raw"
  | "psa10"
  | "psa9"
  | "bgs10"
  | "tag10"
  | "graded-other";

export interface PriceSnapshot {
  date: string;
  price: number;
  source: "manual" | "ebay-active" | "ebay-sold" | "seed" | "pokewallet" | "pokewallet-auto";
  sampleSize?: number;
}

export interface CollectionCard {
  id: string;
  game: CardGame;
  language: CardLanguage;
  name: string;
  setName: string;
  cardNumber?: string;
  rarity?: string;
  condition: CardCondition;
  imageUrl?: string;
  acquisitionPrice: number;
  currentPrice: number;
  quantity: number;
  acquiredAt: string;
  notes?: string;
  history?: PriceSnapshot[];
  lastEbayUpdate?: string;
  pokewalletId?: string;
}

export interface CollectionSnapshot {
  date: string;
  totalValue: number;
  totalCost: number;
}

export type SaleKind = "cash" | "trade";

export interface SaleRecord {
  id: string;
  cardId: string;
  cardName: string;
  game: CardGame;
  language: CardLanguage;
  imageUrl?: string;
  quantity: number;
  soldAt: string;
  saleKind: SaleKind;
  salePrice: number;
  acquisitionCost: number;
  gradingCost: number;
  shippingCost: number;
  totalCosts: number;
  netProfit: number;
  notes?: string;
  chainId?: string;
  condition?: string;
}

export type GradingCompany = "PSA" | "BGS" | "TAG";

export interface GradingSubmission {
  id: string;
  cardId: string;
  cardName: string;
  game: CardGame;
  condition: CardCondition;
  gradingCompany: GradingCompany;
  submissionDate: string;
  returnDate?: string;
  costPerCard: number;
  quantity: number;
  totalCost: number;
  expectedGrade?: string;
  actualGrade?: string;
  expectedValue?: number;
  actualValue?: number;
  status: "submitted" | "graded" | "returned";
  notes?: string;
}

export interface GradingAnalysis {
  cardId: string;
  cardName: string;
  rawValue: number;
  psa10Value: number | null;
  ratio: number | null;
  isWorthGrading: boolean;
  reason: string;
}

export interface ChainStep {
  id: string;
  description: string;
  investedAmount: number;
  flipIds: string[];
  date: string;
}

export interface InvestmentChain {
  id: string;
  name: string;
  initialInvestment: number;
  createdAt: string;
  steps: ChainStep[];
}