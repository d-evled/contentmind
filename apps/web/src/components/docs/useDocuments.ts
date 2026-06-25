"use client";
import { useCallback, useEffect, useState } from "react";
import {
  docsApi,
  hasPending,
  type DocItem,
  type DocsData,
  type FolderItem,
} from "@/lib/docs-api";

const empty: DocsData = { folders: [], documents: [] };

export interface DocsController {
  data: DocsData;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  createFolder: (name: string) => Promise<FolderItem | null>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  renameDoc: (id: string, name: string) => Promise<void>;
  moveDoc: (id: string, folderId: string | null) => Promise<void>;
  deleteDoc: (id: string) => Promise<void>;
}

const message = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

/**
 * Owns the sidebar's folder/document state. Mutations are optimistic — the UI
 * updates instantly via a pure functional setState, and on failure we surface
 * the error and re-fetch the server's truth (which is the correct rollback,
 * since the mutation didn't take). The list also polls itself while any upload
 * is still being processed.
 */
export function useDocuments(): DocsController {
  const [data, setData] = useState<DocsData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await docsApi.list();
      setData(next);
    } catch (err) {
      setError(message(err, "Failed to load documents"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load. setState happens inside promise callbacks (not the effect
  // body) so it never triggers a synchronous cascade.
  useEffect(() => {
    let alive = true;
    docsApi
      .list()
      .then((next) => alive && setData(next))
      .catch((err) => alive && setError(message(err, "Failed to load documents")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Poll while a document is still processing so its status flips to "ready"
  // on its own. The setState lives inside refresh(), invoked from a timer.
  useEffect(() => {
    if (!hasPending(data.documents)) return;
    const t = setInterval(() => void refresh(), 2500);
    return () => clearInterval(t);
  }, [data.documents, refresh]);

  // Apply an optimistic functional update, reconciling with the server on error.
  const optimistic = useCallback(
    (build: (prev: DocsData) => DocsData, run: () => Promise<unknown>, label: string) => {
      setData(build);
      return run().then(
        () => undefined,
        (err) => {
          setError(message(err, label));
          void refresh();
        }
      );
    },
    [refresh]
  );

  const createFolder = useCallback(async (name: string) => {
    try {
      const folder = await docsApi.createFolder(name);
      setData((d) => ({ ...d, folders: [...d.folders, folder] }));
      return folder;
    } catch (err) {
      setError(message(err, "Couldn't create folder"));
      return null;
    }
  }, []);

  const renameFolder = useCallback(
    (id: string, name: string) =>
      optimistic(
        (d) => ({ ...d, folders: d.folders.map((f) => (f.id === id ? { ...f, name } : f)) }),
        () => docsApi.renameFolder(id, name),
        "Couldn't rename folder"
      ),
    [optimistic]
  );

  const deleteFolder = useCallback(
    (id: string) =>
      optimistic(
        (d) => ({
          folders: d.folders.filter((f) => f.id !== id),
          // Its documents become unfiled rather than disappearing.
          documents: d.documents.map((doc) =>
            doc.folderId === id ? { ...doc, folderId: null } : doc
          ),
        }),
        () => docsApi.deleteFolder(id),
        "Couldn't delete folder"
      ),
    [optimistic]
  );

  const patchDoc = useCallback(
    (id: string, patch: Partial<DocItem>, run: () => Promise<unknown>, label: string) =>
      optimistic(
        (d) => ({
          ...d,
          documents: d.documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc)),
        }),
        run,
        label
      ),
    [optimistic]
  );

  const renameDoc = useCallback(
    (id: string, name: string) =>
      patchDoc(id, { name }, () => docsApi.renameDoc(id, name), "Couldn't rename document"),
    [patchDoc]
  );

  const moveDoc = useCallback(
    (id: string, folderId: string | null) =>
      patchDoc(id, { folderId }, () => docsApi.moveDoc(id, folderId), "Couldn't move document"),
    [patchDoc]
  );

  const deleteDoc = useCallback(
    (id: string) =>
      optimistic(
        (d) => ({ ...d, documents: d.documents.filter((doc) => doc.id !== id) }),
        () => docsApi.deleteDoc(id),
        "Couldn't delete document"
      ),
    [optimistic]
  );

  return {
    data,
    loading,
    error,
    clearError: () => setError(null),
    refresh,
    createFolder,
    renameFolder,
    deleteFolder,
    renameDoc,
    moveDoc,
    deleteDoc,
  };
}
