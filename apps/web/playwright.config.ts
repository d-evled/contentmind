import path from "path";
import { defineConfig, devices } from "@playwright/test";

// Monorepo root — two levels up from apps/web.
const WORKSPACE_ROOT = path.resolve(__dirname, "../..");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Run build then start from the workspace root so pnpm can resolve
    // @contentmind/core (workspace:*). The env vars provide dummy secrets
    // so build + start succeed without a real database or GitHub OAuth.
    command: "pnpm --filter @contentmind/web build && pnpm --filter @contentmind/web start",
    cwd: WORKSPACE_ROOT,
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "test",
      AI_PROVIDER: "mock",
      E2E_BYPASS_AUTH: "1",
      // Dummy values — satisfy env references during build + start without
      // connecting to any real database or OAuth provider.
      DATABASE_URL: "postgres://u:p@localhost/db",
      AUTH_SECRET: "e2e-secret-at-least-32-chars-long!!",
      AUTH_GITHUB_ID: "x",
      AUTH_GITHUB_SECRET: "y",
    },
  },
});
