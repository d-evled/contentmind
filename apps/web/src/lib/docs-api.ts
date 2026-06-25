// Client-side document/folder API + the pure grouping logic that the sidebar
// renders from. Kept framework-free so the grouping can be unit-tested in
// isolation (see docs-api.test.ts).

export type DocStatus = "processing" | "ready" | "error";

export interface DocItem {
  id: string;
  name: string;
  status: DocStatus;
  folderId: string | null;
  createdAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  createdAt: string;
}

export interface DocsData {
  folders: FolderItem[];
  documents: DocItem[];
}

/** A folder plus the documents that live inside it. */
export interface FolderGroup {
  folder: FolderItem;
  documents: DocItem[];
}

export interface GroupedDocs {
  /** Folders (each with its documents), ordered oldest-first. */
  groups: FolderGroup[];
  /** Documents not assigned to any folder. */
  unfiled: DocItem[];
}

const byCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) =>
  a.createdAt.localeCompare(b.createdAt);

/**
 * Group documents under their folders. Documents whose folderId is null — or
 * points at a folder that no longer exists — fall back to "unfiled" so nothing
 * is ever hidden from the user.
 */
export function groupDocs(data: DocsData): GroupedDocs {
  const folders = [...data.folders].sort(byCreatedAt);
  const docs = [...data.documents].sort(byCreatedAt);

  const buckets = new Map<string, DocItem[]>(folders.map((f) => [f.id, []]));
  const unfiled: DocItem[] = [];
  for (const doc of docs) {
    if (doc.folderId && buckets.has(doc.folderId)) {
      buckets.get(doc.folderId)!.push(doc);
    } else {
      unfiled.push(doc);
    }
  }

  return {
    groups: folders.map((folder) => ({
      folder,
      documents: buckets.get(folder.id) ?? [],
    })),
    unfiled,
  };
}

/** True while at least one document is still being processed/embedded. */
export function hasPending(docs: DocItem[]): boolean {
  return docs.some((d) => d.status === "processing");
}

// --- network helpers --------------------------------------------------------

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export const docsApi = {
  list: () => fetch("/api/documents").then((r) => jsonOrThrow<DocsData>(r)),

  createFolder: (name: string) =>
    fetch("/api/folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => jsonOrThrow<FolderItem>(r)),

  renameFolder: (id: string, name: string) =>
    fetch(`/api/folders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => jsonOrThrow<FolderItem>(r)),

  deleteFolder: (id: string) =>
    fetch(`/api/folders/${id}`, { method: "DELETE" }).then((r) =>
      jsonOrThrow<{ ok: true }>(r)
    ),

  renameDoc: (id: string, name: string) =>
    fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => jsonOrThrow<DocItem>(r)),

  moveDoc: (id: string, folderId: string | null) =>
    fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folderId }),
    }).then((r) => jsonOrThrow<DocItem>(r)),

  deleteDoc: (id: string) =>
    fetch(`/api/documents/${id}`, { method: "DELETE" }).then((r) =>
      jsonOrThrow<{ ok: true }>(r)
    ),
};
