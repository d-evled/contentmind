import { tool } from "ai";
import { z } from "zod";

export interface SearchHit {
  chunkId: string;
  documentId: string;
  documentName: string;
  quote: string;
}

export interface ToolContext {
  search: (query: string, k: number) => Promise<SearchHit[]>;
  extract: (documentId: string, fields: string[]) => Promise<Record<string, string>>;
}

// Export raw schemas so tests can call .parse() directly (FlexibleSchema union
// does not expose .parse() in v6 type signatures, even though the underlying
// Zod schema does at runtime).
export const searchDocumentsInputSchema = z.object({
  query: z.string().describe("What to look for in the user's documents")
});

export const extractFieldsInputSchema = z.object({
  documentId: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1)
});

export function searchDocumentsTool(ctx: ToolContext) {
  return tool({
    description:
      "Semantic search across the user's uploaded documents. Returns the most relevant passages.",
    inputSchema: searchDocumentsInputSchema,
    // Fixed k=4: a single string parameter is far more reliable for
    // function-calling models (especially Groq/Llama) than a constrained
    // integer argument, which can trigger "failed to call a function" errors.
    execute: async ({ query }) => ctx.search(query, 4)
  });
}

export function extractFieldsTool(ctx: ToolContext) {
  return tool({
    description:
      "Extract specific structured fields (e.g. parties, dates, amounts) from one document as JSON.",
    inputSchema: extractFieldsInputSchema,
    execute: async ({ documentId, fields }) => ctx.extract(documentId, fields)
  });
}

export function buildTools(ctx: ToolContext) {
  return {
    searchDocuments: searchDocumentsTool(ctx),
    extractFields: extractFieldsTool(ctx)
  };
}
