import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@contentmind/core"],
  // Expose E2E_BYPASS_AUTH to server runtime so Turbopack doesn't dead-code-
  // eliminate the first half of the isE2E() check.  The value is baked at
  // build time: Playwright webServer sets E2E_BYPASS_AUTH=1 → baked as "1";
  // Vercel / CI production builds leave it unset → baked as "".
  //
  // Note: AI_PROVIDER is intentionally NOT listed here.  It is read at
  // runtime (not inlined) so a production server running a real provider
  // (google / groq / unset) can never satisfy the second condition of
  // isE2E(), even if E2E_BYPASS_AUTH were somehow set in the binary.  This
  // two-factor guard is what makes the bypass safe.
  env: {
    E2E_BYPASS_AUTH: process.env.E2E_BYPASS_AUTH ?? "",
  },
};

export default nextConfig;
