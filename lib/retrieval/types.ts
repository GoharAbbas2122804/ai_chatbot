import type { CatalogProduct, CatalogData } from "../catalog/schema";

export type RetrievalConfidence = "exact" | "high" | "low" | "none";

export interface RetrievalResult {
  products: CatalogProduct[];
  topScore: number;
  confidence: RetrievalConfidence;
  computedFacts: string[];
  resolvedSkus: string[];
}

export interface ChatMessageContext {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Retriever {
  retrieve(
    query: string,
    history: ChatMessageContext[],
    catalog: CatalogData
  ): Promise<RetrievalResult>;
}
