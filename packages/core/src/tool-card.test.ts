import { describe, it, expect } from "vitest";
import { toolCardReducer, initialToolCard } from "./tool-card";

describe("toolCardReducer", () => {
  it("starts pending", () => {
    expect(initialToolCard("searchDocuments").status).toBe("pending");
  });

  it("pending -> running on invoke", () => {
    const s = toolCardReducer(initialToolCard("searchDocuments"), {
      type: "invoke",
      args: { query: "hi" }
    });
    expect(s.status).toBe("running");
    expect(s.args).toEqual({ query: "hi" });
  });

  it("running -> result on resolve", () => {
    let s = toolCardReducer(initialToolCard("searchDocuments"), { type: "invoke", args: {} });
    s = toolCardReducer(s, { type: "resolve", result: [{ chunkId: "c1" }] });
    expect(s.status).toBe("result");
    expect(s.result).toEqual([{ chunkId: "c1" }]);
  });

  it("running -> error on fail", () => {
    let s = toolCardReducer(initialToolCard("extractFields"), { type: "invoke", args: {} });
    s = toolCardReducer(s, { type: "fail", error: "boom" });
    expect(s.status).toBe("error");
    expect(s.error).toBe("boom");
  });

  it("ignores resolve when not running", () => {
    const s = toolCardReducer(initialToolCard("searchDocuments"), { type: "resolve", result: 1 });
    expect(s.status).toBe("pending");
  });
});
