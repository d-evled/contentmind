import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { documents, folders } from "@/db/schema";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  // null = move to "unfiled"; a string = move into that folder.
  folderId: z.string().min(1).nullable().optional(),
});

// Rename a document and/or move it between folders.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
  const { name, folderId } = parsed.data;

  // If moving into a folder, verify the user owns the target folder.
  if (folderId) {
    const [target] = await db
      .select({ id: folders.id })
      .from(folders)
      .where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
    if (!target) return NextResponse.json({ error: "folder not found" }, { status: 404 });
  }

  const patch: Partial<typeof documents.$inferInsert> = {};
  if (name !== undefined) patch.name = name;
  if (folderId !== undefined) patch.folderId = folderId;

  const [updated] = await db
    .update(documents)
    .set(patch)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .returning({
      id: documents.id,
      name: documents.name,
      status: documents.status,
      folderId: documents.folderId,
      createdAt: documents.createdAt,
    });

  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

// Delete a document (its chunks cascade via the FK).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const [deleted] = await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .returning({ id: documents.id });

  if (!deleted) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
