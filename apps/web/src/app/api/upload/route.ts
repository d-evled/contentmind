import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ingestFile, EmptyDocumentError } from "@/lib/ingest";

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
  } catch (err) {
    if (err instanceof EmptyDocumentError) {
      return NextResponse.json(
        {
          error:
            "No readable text found. If this is a scanned PDF, try a text-based PDF or a .txt / .md file.",
        },
        { status: 422 }
      );
    }
    console.error("[upload] ingest failed:", err);
    return NextResponse.json({ error: "ingest failed" }, { status: 500 });
  }
}
