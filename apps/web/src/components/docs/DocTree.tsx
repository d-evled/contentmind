"use client";
import { useEffect, useRef, useState } from "react";
import { Popover } from "@/components/ui/Popover";
import { groupDocs, type DocItem, type FolderItem } from "@/lib/docs-api";
import type { DocsController } from "./useDocuments";

/* -------------------------------------------------------------------------- */
/* icons                                                                       */
/* -------------------------------------------------------------------------- */

const ic = "size-4 shrink-0";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${ic} transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ic} fill="none" aria-hidden="true">
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.2H19.5A1.5 1.5 0 0 1 21 9.7v8.3a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ic} fill="none" aria-hidden="true">
      <path d="M6.5 3.5h7L18.5 8.5v11a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 3.6V9h5.2M8.5 13h7M8.5 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function KebabIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* menu primitives                                                             */
/* -------------------------------------------------------------------------- */

function onMenuKeyNav(e: React.KeyboardEvent<HTMLDivElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]')
  );
  const i = items.indexOf(document.activeElement as HTMLElement);
  const next = e.key === "ArrowDown" ? i + 1 : i - 1;
  items[(next + items.length) % items.length]?.focus();
}

function MenuItem({
  children,
  onClick,
  danger,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      role="menuitem"
      tabIndex={-1}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[13px] transition-colors duration-100 ${
        danger
          ? "text-danger hover:bg-danger-weak"
          : "text-ink-soft hover:bg-paper-2"
      }`}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}

function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* inline rename                                                               */
/* -------------------------------------------------------------------------- */

function InlineEdit({
  value,
  ariaLabel,
  onSubmit,
  onCancel,
}: {
  value: string;
  ariaLabel: string;
  onSubmit: (next: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    const trimmed = v.trim();
    if (trimmed && trimmed !== value) onSubmit(trimmed);
    else onCancel();
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  return (
    <input
      ref={ref}
      value={v}
      aria-label={ariaLabel}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
      onBlur={commit}
      className="w-full rounded-[6px] border border-accent bg-surface px-1.5 py-0.5 text-[13px] text-ink outline-none"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* status dot                                                                  */
/* -------------------------------------------------------------------------- */

function StatusDot({ status }: { status: DocItem["status"] }) {
  const map = {
    ready: { cls: "bg-ok", label: "Ready" },
    processing: { cls: "bg-accent animate-pulse", label: "Processing" },
    error: { cls: "bg-danger", label: "Failed" },
  }[status];
  return (
    <span
      className={`size-1.5 shrink-0 rounded-full ${map.cls}`}
      title={map.label}
      aria-label={map.label}
      role="img"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* document row                                                                */
/* -------------------------------------------------------------------------- */

function DocRow({
  doc,
  folders,
  editing,
  controller,
  onStartRename,
  onStopRename,
  onDragStateChange,
}: {
  doc: DocItem;
  folders: FolderItem[];
  editing: boolean;
  controller: DocsController;
  onStartRename: () => void;
  onStopRename: () => void;
  onDragStateChange: (id: string | null) => void;
}) {
  const moveTargets = [
    ...(doc.folderId !== null ? [{ id: null as string | null, name: "Unfiled" }] : []),
    ...folders
      .filter((f) => f.id !== doc.folderId)
      .map((f) => ({ id: f.id as string | null, name: f.name })),
  ];

  return (
    <div
      draggable={!editing}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", doc.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStateChange(doc.id);
      }}
      onDragEnd={() => onDragStateChange(null)}
      className="group/row flex items-center gap-2 rounded-[var(--radius-sm)] py-1 pl-2 pr-1 text-ink-soft transition-colors duration-100 hover:bg-paper-2"
    >
      <StatusDot status={doc.status} />
      <span className="text-faint">
        <DocIcon />
      </span>

      {editing ? (
        <InlineEdit
          value={doc.name}
          ariaLabel={`Rename ${doc.name}`}
          onSubmit={(name) => {
            onStopRename();
            void controller.renameDoc(doc.id, name);
          }}
          onCancel={onStopRename}
        />
      ) : (
        <button
          type="button"
          onDoubleClick={onStartRename}
          title={doc.name}
          className="min-w-0 flex-1 cursor-grab truncate text-left text-[13px] active:cursor-grabbing"
        >
          {doc.name}
          {doc.status === "error" && (
            <span className="ml-1.5 text-[11px] text-danger">· failed</span>
          )}
        </button>
      )}

      {!editing && (
        <Popover
          buttonAriaLabel={`Actions for ${doc.name}`}
          panelLabel={`Actions for ${doc.name}`}
          buttonClassName="grid size-7 shrink-0 place-items-center rounded-[7px] text-faint opacity-0 transition-[opacity,color,background-color] duration-100 hover:bg-line/60 hover:text-ink focus-visible:opacity-100 group-hover/row:opacity-100"
          button={<KebabIcon />}
        >
          {(close) => (
            <div onKeyDown={onMenuKeyNav}>
              <MenuItem
                icon={<PencilIcon />}
                onClick={() => {
                  close();
                  onStartRename();
                }}
              >
                Rename
              </MenuItem>
              {moveTargets.length > 0 && (
                <>
                  <MenuLabel>Move to</MenuLabel>
                  {moveTargets.map((t) => (
                    <MenuItem
                      key={t.id ?? "__unfiled"}
                      icon={t.id === null ? <DocIcon /> : <FolderIcon />}
                      onClick={() => {
                        close();
                        void controller.moveDoc(doc.id, t.id);
                      }}
                    >
                      {t.name}
                    </MenuItem>
                  ))}
                </>
              )}
              <div className="my-1 border-t border-line" />
              <MenuItem
                danger
                icon={<TrashIcon />}
                onClick={() => {
                  close();
                  void controller.deleteDoc(doc.id);
                }}
              >
                Delete
              </MenuItem>
            </div>
          )}
        </Popover>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ic} fill="none" aria-hidden="true">
      <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.83-2.83L5 17.5z M14 8l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className={ic} fill="none" aria-hidden="true">
      <path d="M5 7h14M10 7V5h4v2m-7 0 .7 12a1 1 0 0 0 1 .95h4.6a1 1 0 0 0 1-.95L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* tree                                                                        */
/* -------------------------------------------------------------------------- */

export function DocTree({ controller }: { controller: DocsController }) {
  const { groups, unfiled } = groupDocs(controller.data);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | "__unfiled" | null>(null);

  const total = controller.data.documents.length;

  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleDrop = (folderId: string | null) => {
    setDropTarget(null);
    const id = draggingId;
    setDraggingId(null);
    if (id) void controller.moveDoc(id, folderId);
  };

  const newFolder = async () => {
    const folder = await controller.createFolder("New folder");
    if (folder) {
      setCollapsed((s) => {
        const n = new Set(s);
        n.delete(folder.id);
        return n;
      });
      setEditingId(folder.id);
    }
  };

  const renderDoc = (doc: DocItem) => (
    <li key={doc.id} className={draggingId === doc.id ? "opacity-40" : ""}>
      <DocRow
        doc={doc}
        folders={controller.data.folders}
        editing={editingId === doc.id}
        controller={controller}
        onStartRename={() => setEditingId(doc.id)}
        onStopRename={() => setEditingId(null)}
        onDragStateChange={setDraggingId}
      />
    </li>
  );

  return (
    <div className="flex min-h-0 flex-col px-2 pb-3">
      <div className="flex items-center justify-between px-2 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
          {total} {total === 1 ? "document" : "documents"}
        </span>
        <button
          type="button"
          onClick={newFolder}
          className="flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[11.5px] text-muted transition-colors duration-100 hover:border-line-strong hover:text-ink"
        >
          <PlusIcon />
          New folder
        </button>
      </div>

      {total === 0 && groups.length === 0 ? (
        <p className="px-2 py-6 text-center text-[12.5px] leading-relaxed text-faint">
          No documents yet. Upload one above to start asking questions.
        </p>
      ) : (
        <div className="space-y-0.5">
          {groups.map(({ folder, documents }) => {
            const isOpen = !collapsed.has(folder.id);
            const isDrop = dropTarget === folder.id;
            return (
              <section
                key={folder.id}
                onDragOver={(e) => {
                  if (!draggingId) return;
                  e.preventDefault();
                  setDropTarget(folder.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDropTarget((t) => (t === folder.id ? null : t));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(folder.id);
                }}
                className={`rounded-[var(--radius-sm)] transition-colors duration-100 ${
                  isDrop ? "bg-accent-weak ring-1 ring-accent/40" : ""
                }`}
              >
                <div className="group/folder flex items-center gap-1.5 rounded-[var(--radius-sm)] py-1 pl-1 pr-1 text-ink transition-colors duration-100 hover:bg-paper-2">
                  <button
                    type="button"
                    onClick={() => toggle(folder.id)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? "Collapse" : "Expand"} ${folder.name}`}
                    className="grid size-6 shrink-0 place-items-center rounded-[6px] text-muted hover:text-ink"
                  >
                    <Chevron open={isOpen} />
                  </button>
                  <span className="text-accent-ink">
                    <FolderIcon />
                  </span>

                  {editingId === folder.id ? (
                    <InlineEdit
                      value={folder.name}
                      ariaLabel={`Rename folder ${folder.name}`}
                      onSubmit={(name) => {
                        setEditingId(null);
                        void controller.renameFolder(folder.id, name);
                      }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggle(folder.id)}
                      onDoubleClick={() => setEditingId(folder.id)}
                      className="min-w-0 flex-1 truncate text-left text-[13px] font-medium"
                      title={folder.name}
                    >
                      {folder.name}
                    </button>
                  )}

                  <span className="shrink-0 font-mono text-[11px] text-faint">
                    {documents.length}
                  </span>

                  {editingId !== folder.id && (
                    <Popover
                      buttonAriaLabel={`Actions for folder ${folder.name}`}
                      panelLabel={`Actions for folder ${folder.name}`}
                      buttonClassName="grid size-7 shrink-0 place-items-center rounded-[7px] text-faint opacity-0 transition-[opacity,color,background-color] duration-100 hover:bg-line/60 hover:text-ink focus-visible:opacity-100 group-hover/folder:opacity-100"
                      button={<KebabIcon />}
                    >
                      {(close) => (
                        <div onKeyDown={onMenuKeyNav}>
                          <MenuItem
                            icon={<PencilIcon />}
                            onClick={() => {
                              close();
                              setEditingId(folder.id);
                            }}
                          >
                            Rename
                          </MenuItem>
                          <div className="my-1 border-t border-line" />
                          <MenuItem
                            danger
                            icon={<TrashIcon />}
                            onClick={() => {
                              close();
                              void controller.deleteFolder(folder.id);
                            }}
                          >
                            Delete folder
                          </MenuItem>
                        </div>
                      )}
                    </Popover>
                  )}
                </div>

                {isOpen && (
                  <ul className="ml-3 border-l border-line pb-1 pl-2">
                    {documents.length === 0 ? (
                      <li className="px-2 py-1.5 text-[12px] italic text-faint">
                        Empty — drop a document here
                      </li>
                    ) : (
                      documents.map(renderDoc)
                    )}
                  </ul>
                )}
              </section>
            );
          })}

          {/* Unfiled documents — also a drop target so docs can leave a folder. */}
          {(unfiled.length > 0 || draggingId) && (
            <div
              onDragOver={(e) => {
                if (!draggingId) return;
                e.preventDefault();
                setDropTarget("__unfiled");
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropTarget((t) => (t === "__unfiled" ? null : t));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(null);
              }}
              className={`mt-1 rounded-[var(--radius-sm)] pt-1 transition-colors duration-100 ${
                dropTarget === "__unfiled" ? "bg-accent-weak ring-1 ring-accent/40" : ""
              }`}
            >
              {groups.length > 0 && (
                <p className="px-2 pb-0.5 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Unfiled
                </p>
              )}
              <ul>{unfiled.map(renderDoc)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
