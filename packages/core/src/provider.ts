import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import type { LanguageModel, EmbeddingModel } from "ai";

export type ProviderName = "google" | "groq" | "mock";

export interface ProviderEnv {
  AI_PROVIDER?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  GROQ_API_KEY?: string;
}

export function pickProvider(env: ProviderEnv): ProviderName {
  const override = env.AI_PROVIDER?.toLowerCase();
  if (override === "mock") return "mock";
  if (override === "google") {
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error(
        "AI_PROVIDER=google is set but GOOGLE_GENERATIVE_AI_API_KEY is missing"
      );
    }
    return "google";
  }
  if (override === "groq") {
    if (!env.GROQ_API_KEY) {
      throw new Error(
        "AI_PROVIDER=groq is set but GROQ_API_KEY is missing"
      );
    }
    return "groq";
  }
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  if (env.GROQ_API_KEY) return "groq";
  throw new Error("no AI provider configured: set GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY");
}

/** Ordered list: primary first, then failover targets. */
export function providerOrder(env: ProviderEnv): ProviderName[] {
  const primary = pickProvider(env);
  const all: ProviderName[] = ["google", "groq"];
  const available = all.filter((p) =>
    p === "google" ? env.GOOGLE_GENERATIVE_AI_API_KEY : env.GROQ_API_KEY
  );
  if (primary === "mock") return ["mock"];
  return [primary, ...available.filter((p) => p !== primary)];
}

export function createChatModel(provider: ProviderName): LanguageModel {
  switch (provider) {
    case "google":
      return google("gemini-2.0-flash");
    case "groq":
      return groq("llama-3.3-70b-versatile");
    case "mock":
      throw new Error("mock chat model must be injected in tests/e2e");
  }
}

/**
 * Output dimension requested from the embedding model. MUST match the
 * pgvector `embedding` column (vector(768)). Both ingest and retrieval pass
 * this via providerOptions so stored and query vectors are comparable.
 */
export const EMBEDDING_DIMENSIONS = 768;

export function createEmbeddingModel(): EmbeddingModel {
  // Gemini's current embedding model (free tier). Its default output is 3072
  // dims; callers pass `outputDimensionality: EMBEDDING_DIMENSIONS` to reduce
  // it to 768. (text-embedding-004 was retired from the v1beta API.)
  return google.embeddingModel("gemini-embedding-001");
}
