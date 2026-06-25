/**
 * E2E test mode guard.
 *
 * Returns true only when BOTH independent conditions are met:
 *   1. E2E_BYPASS_AUTH === "1"  — the explicit opt-in flag (baked at build
 *      time by next.config.ts `env`, so Turbopack cannot dead-code-eliminate
 *      the check).  Playwright webServer sets this; Vercel production builds
 *      leave it unset (""), making it permanently off for those binaries.
 *   2. AI_PROVIDER === "mock"  — the mock-provider flag.  This is NOT listed
 *      in next.config.ts `env`, so it is read at runtime rather than being
 *      inlined by Turbopack.  A production server always uses a real provider
 *      (google / groq / unset), so this condition is structurally impossible
 *      to satisfy in production even if E2E_BYPASS_AUTH were somehow set.
 *
 * Defense-in-depth: an attacker who somehow injects E2E_BYPASS_AUTH=1 into
 * a production environment still cannot bypass auth, because production
 * servers never run with AI_PROVIDER=mock.
 */
export const isE2E = () =>
  process.env.E2E_BYPASS_AUTH === "1" && process.env.AI_PROVIDER === "mock";

/** Synthetic user ID used throughout the e2e run (no real DB row needed). */
export const E2E_USER_ID = "e2e-user";
