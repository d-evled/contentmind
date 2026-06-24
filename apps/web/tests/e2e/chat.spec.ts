import { test, expect } from "@playwright/test";

/**
 * Deterministic e2e test for the chat flow.
 *
 * Environment: AI_PROVIDER=mock + E2E_BYPASS_AUTH=1
 *   - Auth gate is bypassed (no real GitHub OAuth needed).
 *   - The mock model streams exactly: "Based on your document, the answer is yes [1]."
 *     as plain text with NO tool call, so there is no citation chip rendered —
 *     we assert the streamed text content only.
 *   - No real database is used; the DB rate-limit block is skipped entirely.
 */
test("sends a chat message and sees the streamed mock response", async ({
  page,
}) => {
  // Navigate directly to the (auth-gated) workspace.
  // isE2E() bypasses the redirect, so the chat workspace renders immediately.
  await page.goto("/chat");

  // Fill the composer textarea (labelled "Message" via a sr-only <label>).
  await page.getByLabel("Message").fill("What does my document say?");

  // Submit via the Send button.
  await page.getByRole("button", { name: "Send" }).click();

  // Wait for the streamed answer — the mock emits the full text in one chunk.
  // Use a generous timeout to cover cold-start latency.
  await expect(
    page.getByText(/the answer is yes/i)
  ).toBeVisible({ timeout: 20_000 });
});
