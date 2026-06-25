import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { streamText } from "ai";

const CANNED_TEXT = "Based on your document, the answer is yes [1].";

describe("chatModel() mock provider", () => {
  let originalProvider: string | undefined;

  beforeAll(() => {
    originalProvider = process.env.AI_PROVIDER;
    process.env.AI_PROVIDER = "mock";
  });

  afterAll(() => {
    if (originalProvider === undefined) {
      delete process.env.AI_PROVIDER;
    } else {
      process.env.AI_PROVIDER = originalProvider;
    }
  });

  it("streams the fixed canned text when AI_PROVIDER=mock", async () => {
    // Dynamically import after env is set so providerOrder() picks up the override
    const { chatModel } = await import("./ai");
    const model = chatModel();

    const result = streamText({
      model,
      prompt: "What is in the document?",
    });

    let fullText = "";
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }

    expect(fullText).toBe(CANNED_TEXT);
  });
});
