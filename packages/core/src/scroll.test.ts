import { describe, it, expect } from "vitest";
import { computeScrollState } from "./scroll";

describe("computeScrollState", () => {
  it("is at-bottom within threshold and hides the jump button", () => {
    const s = computeScrollState({ scrollTop: 990, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.atBottom).toBe(true);
    expect(s.showJumpButton).toBe(false);
  });

  it("shows the jump button when scrolled up beyond threshold", () => {
    const s = computeScrollState({ scrollTop: 300, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.atBottom).toBe(false);
    expect(s.showJumpButton).toBe(true);
  });

  it("does not autoscroll when the user has scrolled up", () => {
    const s = computeScrollState({ scrollTop: 300, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.shouldAutoScroll).toBe(false);
  });

  it("autoscrolls while pinned to bottom", () => {
    const s = computeScrollState({ scrollTop: 1000, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.shouldAutoScroll).toBe(true);
  });
});
