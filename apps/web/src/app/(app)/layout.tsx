import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { isE2E } from "@/lib/e2e";
import { SettingsMenu } from "@/components/settings/SettingsMenu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In e2e mode (E2E_BYPASS_AUTH=1 AND AI_PROVIDER=mock) skip the real auth
  // gate so Playwright can reach the workspace without GitHub OAuth.
  // Production always uses a real AI provider, so this path is unreachable there.
  let user: { name?: string | null; image?: string | null } | null = null;
  if (!isE2E()) {
    const session = await auth();
    if (!session?.user) redirect("/");
    user = session.user;
  }

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-paper/85 px-4 backdrop-blur-sm sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-[13px] tracking-tight text-ink"
        >
          <span className="grid size-5 place-items-center rounded-[5px] bg-ink text-[11px] font-bold text-paper">
            C
          </span>
          ContentMind
        </Link>

        <div className="flex items-center gap-3">
          <SettingsMenu />
          {user && (
            <span className="flex items-center gap-2">
              {user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="size-6 rounded-full border border-line"
                />
              )}
              {user.name && (
                <span className="hidden text-[13px] text-muted sm:block">
                  {user.name}
                </span>
              )}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink">
                  Sign out
                </button>
              </form>
            </span>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
