import { embed } from "ai";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";
import { embeddingModel } from "./ai";
import type { Chunk } from "@contentmind/core";

/**
 * Embed the query and run a pgvector cosine-distance search scoped to the user.
 * Returns chunks with embedding set to [] — callers don't need the raw vector.
 */
export async function retrieve(
  query: string,
  userId: string,
  k = 4
): Promise<Chunk[]> {
  const { embedding } = await embed({ model: embeddingModel(), value: query });
  const vec = `[${embedding.join(",")}]`;

  const rows = await db
    .select({
      id: chunks.id,
      documentId: chunks.documentId,
      documentName: documents.name,
      index: chunks.index,
      content: chunks.content,
    })
    .from(chunks)
    .innerJoin(documents, sql`${documents.id} = ${chunks.documentId}`)
    .where(sql`${documents.userId} = ${userId}`)
    .orderBy(sql`${chunks.embedding} <=> ${vec}::vector`)
    .limit(k);

  return rows.map((r) => ({ ...r, embedding: [] }));
}
