import { describe, it, expect, vi } from "vitest";
import { searchDocumentsTool, extractFieldsTool, searchDocumentsInputSchema } from "./tools";

describe("searchDocumentsTool", () => {
  it("validates input and delegates to ctx.search", async () => {
    const search = vi.fn().mockResolvedValue([
      { documentName: "a.pdf", quote: "hello", chunkId: "c1", documentId: "d1" }
    ]);
    const tool = searchDocumentsTool({ search, extract: vi.fn() });
    const out = await tool.execute!({ query: "hi" }, { toolCallId: "t", messages: [] });
    expect(search).toHaveBeenCalledWith("hi", 4);
    expect(out).toEqual([{ documentName: "a.pdf", quote: "hello", chunkId: "c1", documentId: "d1" }]);
  });

  it("rejects invalid input (missing query)", () => {
    // tool.inputSchema is typed as FlexibleSchema in v6, which doesn't expose
    // .parse() in the type system. Use the exported raw Zod schema instead.
    expect(() => searchDocumentsInputSchema.parse({})).toThrow();
  });
});

describe("extractFieldsTool", () => {
  it("delegates to ctx.extract with parsed args", async () => {
    const extract = vi.fn().mockResolvedValue({ party: "Acme", date: "2026-01-01" });
    const tool = extractFieldsTool({ search: vi.fn(), extract });
    const out = await tool.execute!(
      { documentId: "d1", fields: ["party", "date"] },
      { toolCallId: "t", messages: [] }
    );
    expect(extract).toHaveBeenCalledWith("d1", ["party", "date"]);
    expect(out).toEqual({ party: "Acme", date: "2026-01-01" });
  });
});
