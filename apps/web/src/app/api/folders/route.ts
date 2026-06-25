import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { folders } from "@/db/schema";

const createSchema = z.object({ name: z.string().trim().min(1).max(120) });

// Create a folder for the signed-in user.
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }

  const [folder] = await db
    .insert(folders)
    .values({ userId, name: parsed.data.name })
    .returning({
      id: folders.id,
      name: folders.name,
      createdAt: folders.createdAt,
    });

  return NextResponse.json(folder, { status: 201 });
}
