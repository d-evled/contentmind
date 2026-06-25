import Link from "next/link";
import { auth, signIn } from "@/lib/auth";

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-[18px] fill-current">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default async function Home() {
  const session = await auth();

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between py-6">
        <span className="font-mono text-[13px] tracking-tight text-ink">
          ContentMind
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          Intelligent content
        </span>
      </header>

      <div className="grid flex-1 items-center gap-12 pb-20 md:grid-cols-[1.05fr_0.95fr]">
        {/* Left — message */}
        <div className="max-w-xl">
          <p
            className="cm-rise font-mono text-[12px] uppercase tracking-[0.2em] text-accent-ink"
            style={{ animationDelay: "40ms" }}
          >
            Chat with your documents
          </p>
          <h1
            className="cm-rise mt-5 font-display text-[clamp(3rem,7vw,5.25rem)] leading-[0.95] tracking-[-0.02em]"
            style={{ animationDelay: "100ms" }}
          >
            Answers, grounded
            <br />
            in your content.
          </h1>
          <p
            className="cm-rise mt-6 max-w-md text-[1.05rem] leading-relaxed text-muted"
            style={{ animationDelay: "180ms" }}
          >
            Upload a document and ask anything. ContentMind reads it, retrieves
            the relevant passages, and answers with citations you can trace back
            to the source.
          </p>

          <div className="cm-rise mt-9" style={{ animationDelay: "260ms" }}>
            {session?.user ? (
              <Link
                href="/chat"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper shadow-[var(--shadow-soft)] transition-transform duration-150 hover:-translate-y-0.5"
              >
                Open workspace
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/chat" });
                }}
              >
                <button className="group inline-flex items-center gap-2.5 rounded-full bg-ink px-6 py-3 text-[15px] font-medium text-paper shadow-[var(--shadow-soft)] transition-transform duration-150 hover:-translate-y-0.5">
                  <GitHubMark />
                  Sign in with GitHub
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right — a faux cited answer, the product in one glance */}
        <div
          className="cm-rise hidden md:block"
          style={{ animationDelay: "340ms" }}
        >
          <div className="rotate-[1.4deg] rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-[var(--shadow-pop)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-accent" />
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
                renewal-contract.pdf
              </span>
            </div>

            <div className="ml-auto w-fit max-w-[80%] rounded-[var(--radius-md)] rounded-br-sm bg-paper-2 px-3.5 py-2 text-[13.5px] text-ink-soft">
              When does the agreement auto-renew?
            </div>

            <div className="mt-4 text-[14px] leading-relaxed text-ink">
              It renews automatically for successive one-year terms unless either
              party gives 60 days written notice
              <sup className="ml-0.5 inline-flex h-[15px] min-w-[15px] items-center justify-center rounded bg-accent-weak px-1 font-mono text-[10px] font-medium text-accent-ink">
                1
              </sup>
              .
            </div>

            <div className="mt-4 rounded-[var(--radius-sm)] border-l-2 border-accent bg-paper-2/60 px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Source 1
              </span>
              <p className="mt-1 text-[12.5px] leading-snug text-muted">
                “…this Agreement shall renew for successive one-year terms absent
                written notice of non-renewal sixty (60) days prior…”
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-line py-5 font-mono text-[11px] text-faint">
        Built with Claude Code · Next.js · Vercel AI SDK
      </footer>
    </main>
  );
}
