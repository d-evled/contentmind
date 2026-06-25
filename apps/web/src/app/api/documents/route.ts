import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { documents, folders } from "@/db/schema";

// List the signed-in user's folders and documents for the sidebar tree.
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [folderRows, docRows] = await Promise.all([
    db
      .select({
        id: folders.id,
        name: folders.name,
        createdAt: folders.createdAt,
      })
      .from(folders)
      .where(eq(folders.userId, userId))
      .orderBy(asc(folders.createdAt)),
    db
      .select({
        id: documents.id,
        name: documents.name,
        status: documents.status,
        folderId: documents.folderId,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(asc(documents.createdAt)),
  ]);

  return NextResponse.json({ folders: folderRows, documents: docRows });
}
