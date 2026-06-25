import { describe, it, expect } from "vitest";
import { groupDocs, hasPending, type DocsData } from "./docs-api";

const doc = (
  id: string,
  folderId: string | null,
  createdAt: string,
  status: DocsData["documents"][number]["status"] = "ready"
) => ({ id, name: id, folderId, status, createdAt });

const folder = (id: string, createdAt: string) => ({ id, name: id, createdAt });

describe("groupDocs", () => {
  it("places documents under their folder and leaves the rest unfiled", () => {
    const data: DocsData = {
      folders: [folder("f1", "2026-01-01"), folder("f2", "2026-01-02")],
      documents: [
        doc("a", "f1", "2026-01-03"),
        doc("b", null, "2026-01-04"),
        doc("c", "f2", "2026-01-05"),
      ],
    };
    const { groups, unfiled } = groupDocs(data);
    expect(groups.map((g) => g.folder.id)).toEqual(["f1", "f2"]);
    expect(groups[0]!.documents.map((d) => d.id)).toEqual(["a"]);
    expect(groups[1]!.documents.map((d) => d.id)).toEqual(["c"]);
    expect(unfiled.map((d) => d.id)).toEqual(["b"]);
  });

  it("treats documents pointing at a missing folder as unfiled", () => {
    const data: DocsData = {
      folders: [],
      documents: [doc("a", "ghost", "2026-01-01")],
    };
    const { groups, unfiled } = groupDocs(data);
    expect(groups).toHaveLength(0);
    expect(unfiled.map((d) => d.id)).toEqual(["a"]);
  });

  it("orders folders and documents oldest-first regardless of input order", () => {
    const data: DocsData = {
      folders: [folder("f2", "2026-02-02"), folder("f1", "2026-01-01")],
      documents: [doc("late", "f1", "2026-03-02"), doc("early", "f1", "2026-03-01")],
    };
    const { groups } = groupDocs(data);
    expect(groups.map((g) => g.folder.id)).toEqual(["f1", "f2"]);
    expect(groups[0]!.documents.map((d) => d.id)).toEqual(["early", "late"]);
  });
});

describe("hasPending", () => {
  it("is true only when a document is still processing", () => {
    expect(hasPending([doc("a", null, "2026-01-01", "ready")])).toBe(false);
    expect(
      hasPending([
        doc("a", null, "2026-01-01", "ready"),
        doc("b", null, "2026-01-02", "processing"),
      ])
    ).toBe(true);
  });
});
