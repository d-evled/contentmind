import {
  createChatModel,
  createEmbeddingModel,
  providerOrder,
  type ProviderEnv,
} from "@contentmind/core";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";

const CANNED_TEXT = "Based on your document, the answer is yes [1].";

export function chatModel() {
  const env = process.env as unknown as ProviderEnv;
  const order = providerOrder(env);
  if (order[0] === "mock") {
    // Deterministic model for e2e/CI — streams a fixed canned answer.
    return new MockLanguageModelV3({
      doStream: async () => ({
        stream: simulateReadableStream({
          chunks: [
            { type: "stream-start" as const, warnings: [] },
            {
              type: "text-start" as const,
              id: "txt-1",
            },
            {
              type: "text-delta" as const,
              id: "txt-1",
              delta: CANNED_TEXT,
            },
            {
              type: "text-end" as const,
              id: "txt-1",
            },
            {
              type: "finish" as const,
              finishReason: { unified: "stop" as const, raw: "stop" },
              usage: {
                inputTokens: {
                  total: 10,
                  noCache: 10,
                  cacheRead: 0,
                  cacheWrite: 0,
                },
                outputTokens: {
                  total: 12,
                  text: 12,
                  reasoning: 0,
                },
              },
            },
          ],
          initialDelayInMs: null,
          chunkDelayInMs: null,
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      }),
    });
  }
  // Primary model; routes wrap calls in try/catch and retry with order[1].
  return createChatModel(order[0]!);
}

export function embeddingModel() {
  return createEmbeddingModel();
}

/** Returns the provider priority order so routes can implement failover. */
export function chatProviderOrder() {
  const env = process.env as unknown as ProviderEnv;
  return providerOrder(env);
}
