import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ToolCard } from "@/components/chat/ToolCard";

describe("ToolCard", () => {
  it("shows a running indicator while the tool is executing", () => {
    render(
      <ToolCard
        part={{
          type: "tool-searchDocuments",
          toolCallId: "tc1",
          state: "input-available",
          input: { query: "x" },
        }}
      />
    );
    expect(screen.getByText(/searching documents/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders search results when available", () => {
    render(
      <ToolCard
        part={{
          type: "tool-searchDocuments",
          toolCallId: "tc2",
          state: "output-available",
          input: { query: "x" },
          output: [{ chunkId: "c1", documentName: "a.pdf", quote: "hello" }],
        }}
      />
    );
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText(/hello/)).toBeInTheDocument();
  });
});
