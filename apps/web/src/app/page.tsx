import Link from "next/link";
import { auth, signIn } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">ContentMind</h1>
      <p className="text-balance text-lg text-neutral-600">
        Chat with your documents. Grounded answers, with citations.
      </p>
      {session?.user ? (
        <Link href="/chat" className="rounded-full bg-black px-6 py-3 text-white">
          Open workspace
        </Link>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/chat" });
          }}
        >
          <button className="rounded-full bg-black px-6 py-3 text-white">
            Sign in with GitHub
          </button>
        </form>
      )}
    </main>
  );
}
