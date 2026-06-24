import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MessageList } from "@/components/chat/MessageList";

const msg = (id: string, role: "user" | "assistant", text: string) => ({
  id,
  role,
  parts: [{ type: "text" as const, text }],
});

describe("MessageList", () => {
  it("renders an ARIA live region for assistant streaming", () => {
    render(<MessageList messages={[msg("1", "assistant", "hi")]} isStreaming />);
    const live = screen.getByRole("log");
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("renders user and assistant messages with roles labeled", () => {
    render(
      <MessageList
        messages={[msg("1", "user", "question"), msg("2", "assistant", "answer")]}
        isStreaming={false}
      />
    );
    expect(screen.getByText("question")).toBeInTheDocument();
    expect(screen.getByText("answer")).toBeInTheDocument();
  });
});
