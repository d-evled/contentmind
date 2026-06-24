/**
 * E2E test mode guard.
 *
 * Returns true when the E2E_BYPASS_AUTH env var is "1" at runtime.
 *
 * Production safety: Next.js build (next build) bakes env vars declared in
 * next.config.ts `env` into the bundle.  E2E_BYPASS_AUTH is only declared
 * there (value comes from the shell), so:
 *   • Playwright webServer sets E2E_BYPASS_AUTH=1 → baked as "1" → bypass ON.
 *   • Vercel / CI production builds have no E2E_BYPASS_AUTH → baked as "" →
 *     bypass permanently OFF; the env var cannot be injected at runtime to
 *     re-enable it because Turbopack replaces the reference with the
 *     build-time literal.
 *
 * For defense-in-depth, keep the NODE_ENV guard in the consuming call sites
 * (layout.tsx, chat/route.ts) rather than here, so this helper stays simple.
 */
export const isE2E = () => process.env.E2E_BYPASS_AUTH === "1";

/** Synthetic user ID used throughout the e2e run (no real DB row needed). */
export const E2E_USER_ID = "e2e-user";
