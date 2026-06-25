import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isE2E } from "@/lib/e2e";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // In e2e mode (E2E_BYPASS_AUTH=1 AND AI_PROVIDER=mock) skip the real auth
  // gate so Playwright can reach the workspace without GitHub OAuth.
  // Production servers always use a real AI provider, so this path is
  // structurally unreachable in production regardless of env variables.
  if (!isE2E()) {
    const session = await auth();
    if (!session?.user) redirect("/");
  }
  return <div className="flex h-dvh flex-col">{children}</div>;
}
