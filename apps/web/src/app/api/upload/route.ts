import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ingestFile } from "@/lib/ingest";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["application/pdf", "text/plain", "text/markdown"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large" }, { status: 413 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "unsupported type" }, { status: 415 });
  }

  try {
    const id = await ingestFile(file, session.user.id);
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }
}
