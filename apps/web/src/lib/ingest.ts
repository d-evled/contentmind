import { embedMany } from "ai";
import { sql } from "drizzle-orm";
import { extractText } from "unpdf";
import { chunkText } from "@contentmind/core";
import { db } from "@/db";
import { documents, chunks } from "@/db/schema";
import { embeddingModel } from "./ai";

async function fileToText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const buf = new Uint8Array(await file.arrayBuffer());
    const { text } = await extractText(buf, { mergePages: true });
    return text;
  }
  return file.text();
}

export async function ingestFile(file: File, userId: string): Promise<string> {
  const [doc] = await db
    .insert(documents)
    .values({ userId, name: file.name, status: "processing" })
    .returning();

  try {
    const text = await fileToText(file);
    const pieces = chunkText(text, { size: 1000, overlap: 150 });
    const { embeddings } = await embedMany({
      model: embeddingModel(),
      values: pieces,
    });
    await db.insert(chunks).values(
      pieces.map((content, index) => ({
        documentId: doc!.id,
        index,
        content,
        embedding: embeddings[index]!,
      }))
    );
    await db
      .update(documents)
      .set({ status: "ready" })
      .where(sql`${documents.id} = ${doc!.id}`);
    return doc!.id;
  } catch (err) {
    await db
      .update(documents)
      .set({ status: "error" })
      .where(sql`${documents.id} = ${doc!.id}`);
    throw err;
  }
}
