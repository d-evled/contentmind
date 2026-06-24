import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@contentmind/core"],
  // Expose E2E_BYPASS_AUTH to server runtime so Turbopack doesn't dead-code-
  // eliminate the isE2E() check.  The value is set to the actual environment
  // variable at build time — but the check in isE2E() ALSO gates on
  // NODE_ENV !== "production", so even if this resolves to "1" in the binary
  // it cannot be triggered in a production Next.js server (NODE_ENV is always
  // "production" there regardless of this config field).
  env: {
    E2E_BYPASS_AUTH: process.env.E2E_BYPASS_AUTH ?? "",
  },
};

export default nextConfig;
