import { auth } from "@/lib/auth";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { and, gt, eq } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { buildTools, checkRateLimit } from "@contentmind/core";
import { chatModel } from "@/lib/ai";
import { retrieve } from "@/lib/retrieval";
import { isE2E, E2E_USER_ID } from "@/lib/e2e";

export const maxDuration = 30;

const SYSTEM = `You are ContentMind, an assistant that answers ONLY from the user's documents.
Ground every answer in retrieved passages and cite them inline as [n], where n is the 1-based
index of the source passage returned by the searchDocuments tool. If the documents don't
contain the answer, say so. Always call searchDocuments before answering.`;

export async function POST(req: Request) {
  let userId: string | undefined;

  if (isE2E()) {
    // e2e mode: skip real auth and DB rate limit entirely.
    // Gated by NODE_ENV !== "production" so this path is unreachable in prod.
    userId = E2E_USER_ID;
  } else {
    // Production path: real auth + DB-backed rate limit (unchanged).
    const session = await auth();
    userId = session?.user?.id;
    if (!userId) return new Response("unauthorized", { status: 401 });

    // fixed-window rate limit (DB-backed)
    const limit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 20);
    const since = new Date(Date.now() - 60_000);
    const recent = await db
      .select({ at: rateLimits.at })
      .from(rateLimits)
      .where(and(eq(rateLimits.userId, userId), gt(rateLimits.at, since)));
    const { allowed } = checkRateLimit(recent.map((r) => r.at.getTime()), {
      now: Date.now(),
      limit,
      windowMs: 60_000,
    });
    if (!allowed) return new Response("rate limited", { status: 429 });
    await db.insert(rateLimits).values({ userId });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const tools = buildTools({
    search: async (query, k) => {
      const hits = await retrieve(query, userId!, k);
      return hits.map((c) => ({
        chunkId: c.id,
        documentId: c.documentId,
        documentName: c.documentName,
        quote: c.content,
      }));
    },
    extract: async () => ({}),
  });

  const result = streamText({
    model: chatModel(),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
    onError: ({ error }) => {
      console.error("chat stream error", error);
    },
  });

  return result.toUIMessageStreamResponse();
}
