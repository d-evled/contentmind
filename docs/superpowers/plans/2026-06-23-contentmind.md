# ContentMind Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a front-end-forward, accessible, agentic AI chat experience over a user's own documents (a focused miniature of Box AI), deployed to Vercel with a real test suite and CI.

**Architecture:** Turborepo monorepo. A platform-agnostic `@contentmind/core` package holds all the testable logic (types, chunking, ranking, AI provider selection, agentic tool definitions, citation mapping, rate limiting, and two pure UI state machines). The Next.js web app (`apps/web`) owns presentation, route handlers, auth, and the database, importing logic from core. Backend is deliberately lean; the front-end (streaming UX, agentic tool cards, citation interaction, accessibility) is the centerpiece. React Native (`apps/mobile`) is a stretch that reuses core.

**Tech Stack:** pnpm + Turborepo · TypeScript · Next.js (App Router) + React 19 · Tailwind CSS · Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/groq`, `@ai-sdk/react`) · Drizzle ORM + Neon Postgres + pgvector · Auth.js (next-auth v5) GitHub OAuth · Vitest + React Testing Library · Playwright · GitHub Actions.

**Docs to check during implementation (use context7 / the `vercel:ai-sdk` skill for exact current API surface):**
- Vercel AI SDK: `streamText`, `tool`, `embedMany`, `useChat`, UI message stream / message parts.
- Drizzle pgvector `vector` column + cosine distance (`<=>`) queries.
- Auth.js v5 Drizzle adapter + GitHub provider.

**Conventions:**
- Package names: `@contentmind/core`, `@contentmind/config`, `@contentmind/web`, `@contentmind/mobile`.
- Commit after every task with a conventional-commit message.
- Embedding model: Gemini `text-embedding-004` → **768 dimensions** (used everywhere a vector size is needed).
- Run all tests from repo root via pnpm filters.

---

## File Structure

```
contentmind/                          # repo root (already git-initialized)
├─ package.json                       # root, pnpm workspaces + turbo scripts
├─ pnpm-workspace.yaml
├─ turbo.json
├─ .gitignore
├─ .env.example
├─ packages/
│  ├─ config/
│  │  ├─ package.json                 # @contentmind/config
│  │  ├─ tsconfig.base.json
│  │  └─ eslint.base.cjs
│  └─ core/                           # @contentmind/core — all testable logic
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ vitest.config.ts
│     └─ src/
│        ├─ index.ts                  # public barrel export
│        ├─ types.ts                  # Document, Chunk, Citation, ToolCall, ChatMessage
│        ├─ chunk.ts                  # chunkText()
│        ├─ chunk.test.ts
│        ├─ similarity.ts             # cosineSimilarity(), rankChunks()
│        ├─ similarity.test.ts
│        ├─ provider.ts               # pickProvider(), createChatModel(), createEmbeddingModel()
│        ├─ provider.test.ts
│        ├─ tools.ts                  # searchDocumentsTool(), extractFieldsTool()
│        ├─ tools.test.ts
│        ├─ citations.ts             # extractCitations()
│        ├─ citations.test.ts
│        ├─ rate-limit.ts             # checkRateLimit()
│        ├─ rate-limit.test.ts
│        ├─ scroll.ts                 # computeScrollState()
│        ├─ scroll.test.ts
│        ├─ tool-card.ts              # toolCardReducer()
│        └─ tool-card.test.ts
└─ apps/
   ├─ web/                            # @contentmind/web — Next.js
   │  ├─ package.json
   │  ├─ next.config.ts
   │  ├─ tailwind.config.ts
   │  ├─ vitest.config.ts
   │  ├─ playwright.config.ts
   │  ├─ drizzle.config.ts
   │  ├─ .env.local                   # (gitignored)
   │  ├─ src/
   │  │  ├─ db/
   │  │  │  ├─ schema.ts              # drizzle tables (auth + app)
   │  │  │  └─ index.ts               # db client
   │  │  ├─ lib/
   │  │  │  ├─ auth.ts                # next-auth config
   │  │  │  ├─ retrieval.ts           # embed query + pgvector similarity search
   │  │  │  ├─ ingest.ts              # parse + chunk + embed + store
   │  │  │  └─ ai.ts                  # build model w/ failover for routes
   │  │  ├─ app/
   │  │  │  ├─ layout.tsx
   │  │  │  ├─ globals.css
   │  │  │  ├─ page.tsx               # landing → sign in / go to app
   │  │  │  ├─ api/auth/[...nextauth]/route.ts
   │  │  │  ├─ api/upload/route.ts
   │  │  │  ├─ api/chat/route.ts
   │  │  │  └─ (app)/
   │  │  │     ├─ layout.tsx          # auth-gated shell
   │  │  │     └─ chat/page.tsx       # main workspace
   │  │  └─ components/
   │  │     ├─ chat/
   │  │     │  ├─ ChatPanel.tsx       # orchestrates useChat
   │  │     │  ├─ MessageList.tsx     # virtualized list + ARIA live
   │  │     │  ├─ Message.tsx         # markdown + citation chips
   │  │     │  ├─ Composer.tsx        # input, send, stop, regenerate
   │  │     │  ├─ ToolCard.tsx        # agentic tool-call card
   │  │     │  ├─ CitationChip.tsx
   │  │     │  └─ JumpToLatest.tsx
   │  │     ├─ docs/
   │  │     │  ├─ DocUpload.tsx       # drag/drop + progress
   │  │     │  ├─ DocList.tsx
   │  │     │  └─ SourcePanel.tsx     # shows/highlights cited passage
   │  │     └─ ui/                     # small primitives (Button, etc.)
   │  └─ tests/
   │     ├─ unit/
   │     │  ├─ MessageList.test.tsx
   │     │  └─ ToolCard.test.tsx
   │     └─ e2e/
   │        └─ chat.spec.ts
   └─ mobile/                         # @contentmind/mobile (STRETCH)
```

---

## Phase 0 — Monorepo foundation

### Task 0.1: Initialize pnpm + Turborepo workspace

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
.next/
dist/
.turbo/
coverage/
*.tsbuildinfo
.env
.env.local
.env*.local
playwright-report/
test-results/
.vercel/
.expo/
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "contentmind",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.3.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 4: Create `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

- [ ] **Step 5: Create `.env.example`**

```
# AI providers (free tiers)
GOOGLE_GENERATIVE_AI_API_KEY=
GROQ_API_KEY=
AI_PROVIDER=google            # google | groq | mock
# Database (Neon)
DATABASE_URL=
# Auth.js
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
# Rate limiting
RATE_LIMIT_PER_MINUTE=20
```

- [ ] **Step 6: Install and commit**

Run: `pnpm install`
Expected: lockfile created, no workspace packages yet (warnings OK).

```bash
git add -A
git commit -m "chore: scaffold turborepo + pnpm workspace"
```

---

### Task 0.2: Shared config package

**Files:**
- Create: `packages/config/package.json`, `packages/config/tsconfig.base.json`, `packages/config/eslint.base.cjs`

- [ ] **Step 1: `packages/config/package.json`**

```json
{
  "name": "@contentmind/config",
  "version": "0.0.0",
  "private": true,
  "files": ["tsconfig.base.json", "eslint.base.cjs"]
}
```

- [ ] **Step 2: `packages/config/tsconfig.base.json`**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true
  }
}
```

- [ ] **Step 3: `packages/config/eslint.base.cjs`**

```js
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: { ecmaVersion: 2022, sourceType: "module" },
  env: { node: true, browser: true, es2022: true },
  ignorePatterns: ["dist", ".next", "node_modules"]
};
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add shared config package"
```

---

### Task 0.3: Bootstrap `@contentmind/core` with Vitest

**Files:**
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.ts`, `packages/core/src/index.ts`

- [ ] **Step 1: `packages/core/package.json`**

```json
{
  "name": "@contentmind/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "ai": "^4.0.0",
    "@ai-sdk/google": "^1.0.0",
    "@ai-sdk/groq": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@contentmind/config": "workspace:*",
    "vitest": "^2.1.0",
    "typescript": "^5.6.0"
  }
}
```

> Note: pin to the latest published majors at install time; verify `ai` test utilities (`MockLanguageModelV2`, `simulateReadableStream`) are exported from `ai/test` for the version you install.

- [ ] **Step 2: `packages/core/tsconfig.json`**

```json
{
  "extends": "@contentmind/config/tsconfig.base.json",
  "include": ["src"]
}
```

- [ ] **Step 3: `packages/core/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] }
});
```

- [ ] **Step 4: `packages/core/src/index.ts` (empty barrel for now)**

```ts
export {};
```

- [ ] **Step 5: Install + verify test runner works**

Run: `pnpm install`
Run: `pnpm --filter @contentmind/core test`
Expected: Vitest runs, reports "No test files found" (exit 0 or a clean no-tests message).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: bootstrap @contentmind/core with vitest"
```

---

## Phase 1 — `@contentmind/core` shared logic (TDD)

### Task 1.1: Core types

**Files:**
- Create: `packages/core/src/types.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write `packages/core/src/types.ts`**

```ts
export type Role = "user" | "assistant";

export type DocumentStatus = "processing" | "ready" | "error";

export interface Document {
  id: string;
  userId: string;
  name: string;
  status: DocumentStatus;
  createdAt: Date;
}

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  index: number;          // 0-based position within the document
  content: string;
  embedding: number[];    // length 768 (Gemini text-embedding-004)
}

/** A retrieved chunk paired with its similarity score. */
export interface ScoredChunk {
  chunk: Chunk;
  score: number;          // cosine similarity in [-1, 1]
}

export interface Citation {
  marker: number;         // 1-based index the model used, e.g. [1]
  chunkId: string;
  documentId: string;
  documentName: string;
  quote: string;
}

export type ToolName = "searchDocuments" | "extractFields";

export type ToolStatus = "pending" | "running" | "result" | "error";

export interface ToolCall {
  id: string;
  name: ToolName;
  status: ToolStatus;
  args: unknown;
  result?: unknown;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  citations?: Citation[];
  toolCalls?: ToolCall[];
  createdAt: Date;
}
```

- [ ] **Step 2: Export from barrel — update `src/index.ts`**

```ts
export * from "./types";
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @contentmind/core typecheck`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(core): add shared domain types"
```

---

### Task 1.2: Text chunking

**Files:**
- Create: `packages/core/src/chunk.ts`, `packages/core/src/chunk.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/chunk.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    expect(chunkText("hello world", { size: 100, overlap: 10 })).toEqual([
      "hello world"
    ]);
  });

  it("splits long text into overlapping chunks of ~size", () => {
    const text = "a".repeat(250);
    const chunks = chunkText(text, { size: 100, overlap: 20 });
    expect(chunks.length).toBe(3);
    expect(chunks[0]!.length).toBe(100);
    // overlap: chunk 2 starts 80 chars in (size - overlap)
    expect(chunks[1]!.startsWith("a".repeat(100))).toBe(true);
  });

  it("never emits empty or whitespace-only chunks", () => {
    const chunks = chunkText("   \n\n   word   ", { size: 5, overlap: 0 });
    expect(chunks.every((c) => c.trim().length > 0)).toBe(true);
  });

  it("uses sensible defaults", () => {
    expect(chunkText("short")).toEqual(["short"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test chunk`
Expected: FAIL — "Cannot find module './chunk'".

- [ ] **Step 3: Implement `src/chunk.ts`**

```ts
export interface ChunkOptions {
  size?: number;
  overlap?: number;
}

/**
 * Splits text into overlapping fixed-size character windows.
 * Trims each window and drops empty results.
 */
export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const size = opts.size ?? 1000;
  const overlap = opts.overlap ?? 150;
  if (overlap >= size) throw new Error("overlap must be smaller than size");

  const trimmed = text.trim();
  if (trimmed.length <= size) return trimmed.length ? [trimmed] : [];

  const step = size - overlap;
  const chunks: string[] = [];
  for (let start = 0; start < trimmed.length; start += step) {
    const piece = trimmed.slice(start, start + size).trim();
    if (piece.length) chunks.push(piece);
    if (start + size >= trimmed.length) break;
  }
  return chunks;
}
```

- [ ] **Step 4: Export — update `src/index.ts`**

```ts
export * from "./types";
export * from "./chunk";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @contentmind/core test chunk`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): add chunkText with overlap"
```

---

### Task 1.3: Cosine similarity + ranking

**Files:**
- Create: `packages/core/src/similarity.ts`, `packages/core/src/similarity.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/similarity.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { cosineSimilarity, rankChunks } from "./similarity";
import type { Chunk } from "./types";

const chunk = (id: string, embedding: number[]): Chunk => ({
  id,
  documentId: "d1",
  documentName: "doc",
  index: 0,
  content: id,
  embedding
});

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
  });
  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it("throws on length mismatch", () => {
    expect(() => cosineSimilarity([1], [1, 2])).toThrow();
  });
});

describe("rankChunks", () => {
  it("returns top-k by descending similarity", () => {
    const q = [1, 0];
    const chunks = [
      chunk("far", [0, 1]),
      chunk("near", [0.9, 0.1]),
      chunk("mid", [0.6, 0.6])
    ];
    const ranked = rankChunks(q, chunks, 2);
    expect(ranked.map((r) => r.chunk.id)).toEqual(["near", "mid"]);
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test similarity`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/similarity.ts`**

```ts
import type { Chunk, ScoredChunk } from "./types";

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("vector length mismatch");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Pure ranking used in tests and as a fallback; production uses pgvector. */
export function rankChunks(
  queryEmbedding: number[],
  chunks: Chunk[],
  k: number
): ScoredChunk[] {
  return chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
```

- [ ] **Step 4: Export — update `src/index.ts`** (append `export * from "./similarity";`)

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @contentmind/core test similarity`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): add cosine similarity + rankChunks"
```

---

### Task 1.4: AI provider selection + model factories

**Files:**
- Create: `packages/core/src/provider.ts`, `packages/core/src/provider.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/provider.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { pickProvider } from "./provider";

describe("pickProvider", () => {
  it("defaults to google when key present and no override", () => {
    expect(pickProvider({ GOOGLE_GENERATIVE_AI_API_KEY: "x" })).toBe("google");
  });
  it("honors AI_PROVIDER override", () => {
    expect(pickProvider({ AI_PROVIDER: "groq", GROQ_API_KEY: "y" })).toBe("groq");
  });
  it("returns mock when AI_PROVIDER=mock (no keys needed)", () => {
    expect(pickProvider({ AI_PROVIDER: "mock" })).toBe("mock");
  });
  it("falls back to groq when only groq key present", () => {
    expect(pickProvider({ GROQ_API_KEY: "y" })).toBe("groq");
  });
  it("throws when no provider is configured", () => {
    expect(() => pickProvider({})).toThrow(/no AI provider/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test provider`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/provider.ts`**

```ts
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import type { LanguageModel, EmbeddingModel } from "ai";

export type ProviderName = "google" | "groq" | "mock";

export interface ProviderEnv {
  AI_PROVIDER?: string;
  GOOGLE_GENERATIVE_AI_API_KEY?: string;
  GROQ_API_KEY?: string;
}

export function pickProvider(env: ProviderEnv): ProviderName {
  const override = env.AI_PROVIDER?.toLowerCase();
  if (override === "mock" || override === "google" || override === "groq") {
    return override;
  }
  if (env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  if (env.GROQ_API_KEY) return "groq";
  throw new Error("no AI provider configured: set GOOGLE_GENERATIVE_AI_API_KEY or GROQ_API_KEY");
}

/** Ordered list: primary first, then failover targets. */
export function providerOrder(env: ProviderEnv): ProviderName[] {
  const primary = pickProvider(env);
  const all: ProviderName[] = ["google", "groq"];
  const available = all.filter((p) =>
    p === "google" ? env.GOOGLE_GENERATIVE_AI_API_KEY : env.GROQ_API_KEY
  );
  if (primary === "mock") return ["mock"];
  return [primary, ...available.filter((p) => p !== primary)];
}

export function createChatModel(provider: ProviderName): LanguageModel {
  switch (provider) {
    case "google":
      return google("gemini-2.0-flash");
    case "groq":
      return groq("llama-3.3-70b-versatile");
    case "mock":
      throw new Error("mock chat model must be injected in tests/e2e");
  }
}

export function createEmbeddingModel(): EmbeddingModel<string> {
  // Gemini embeddings are free; 768 dims.
  return google.textEmbeddingModel("text-embedding-004");
}
```

> During implementation, confirm the exact `LanguageModel`/`EmbeddingModel` type exports and the `google.textEmbeddingModel` helper name for the installed AI SDK version (check via context7).

- [ ] **Step 4: Export — update `src/index.ts`** (append `export * from "./provider";`)

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @contentmind/core test provider`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): provider selection + model factories with failover order"
```

---

### Task 1.5: Agentic tool definitions

**Files:**
- Create: `packages/core/src/tools.ts`, `packages/core/src/tools.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/tools.test.ts`**

```ts
import { describe, it, expect, vi } from "vitest";
import { searchDocumentsTool, extractFieldsTool } from "./tools";

describe("searchDocumentsTool", () => {
  it("validates input and delegates to ctx.search", async () => {
    const search = vi.fn().mockResolvedValue([
      { documentName: "a.pdf", quote: "hello", chunkId: "c1" }
    ]);
    const tool = searchDocumentsTool({ search, extract: vi.fn() });
    const out = await tool.execute!({ query: "hi", k: 3 }, { toolCallId: "t", messages: [] });
    expect(search).toHaveBeenCalledWith("hi", 3);
    expect(out).toEqual([{ documentName: "a.pdf", quote: "hello", chunkId: "c1" }]);
  });

  it("rejects invalid input (missing query)", () => {
    const tool = searchDocumentsTool({ search: vi.fn(), extract: vi.fn() });
    expect(() => tool.inputSchema.parse({ k: 2 })).toThrow();
  });
});

describe("extractFieldsTool", () => {
  it("delegates to ctx.extract with parsed args", async () => {
    const extract = vi.fn().mockResolvedValue({ party: "Acme", date: "2026-01-01" });
    const tool = extractFieldsTool({ search: vi.fn(), extract });
    const out = await tool.execute!(
      { documentId: "d1", fields: ["party", "date"] },
      { toolCallId: "t", messages: [] }
    );
    expect(extract).toHaveBeenCalledWith("d1", ["party", "date"]);
    expect(out).toEqual({ party: "Acme", date: "2026-01-01" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test tools`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/tools.ts`**

```ts
import { tool } from "ai";
import { z } from "zod";

export interface SearchHit {
  chunkId: string;
  documentName: string;
  quote: string;
}

export interface ToolContext {
  search: (query: string, k: number) => Promise<SearchHit[]>;
  extract: (documentId: string, fields: string[]) => Promise<Record<string, string>>;
}

export function searchDocumentsTool(ctx: ToolContext) {
  return tool({
    description:
      "Semantic search across the user's uploaded documents. Returns the most relevant passages.",
    inputSchema: z.object({
      query: z.string().min(1).describe("What to search for"),
      k: z.number().int().min(1).max(8).default(4).describe("How many passages")
    }),
    execute: async ({ query, k }) => ctx.search(query, k)
  });
}

export function extractFieldsTool(ctx: ToolContext) {
  return tool({
    description:
      "Extract specific structured fields (e.g. parties, dates, amounts) from one document as JSON.",
    inputSchema: z.object({
      documentId: z.string().min(1),
      fields: z.array(z.string().min(1)).min(1)
    }),
    execute: async ({ documentId, fields }) => ctx.extract(documentId, fields)
  });
}

export function buildTools(ctx: ToolContext) {
  return {
    searchDocuments: searchDocumentsTool(ctx),
    extractFields: extractFieldsTool(ctx)
  };
}
```

> Confirm the `tool()` signature (`inputSchema` vs `parameters`) for your installed AI SDK version. If your version uses `parameters`, rename and update the tests' `inputSchema.parse` accordingly.

- [ ] **Step 4: Export — update `src/index.ts`** (append `export * from "./tools";`)

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @contentmind/core test tools`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): add searchDocuments + extractFields agentic tools"
```

---

### Task 1.6: Citation extraction

**Files:**
- Create: `packages/core/src/citations.ts`, `packages/core/src/citations.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/citations.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { extractCitations } from "./citations";
import type { Chunk } from "./types";

const chunk = (id: string, name: string, content: string): Chunk => ({
  id,
  documentId: "d-" + id,
  documentName: name,
  index: 0,
  content,
  embedding: []
});

describe("extractCitations", () => {
  const sources = [chunk("1", "a.pdf", "first source"), chunk("2", "b.pdf", "second source")];

  it("maps [n] markers to the matching retrieved chunk", () => {
    const cites = extractCitations("The sky is blue [1] and grass is green [2].", sources);
    expect(cites).toEqual([
      { marker: 1, chunkId: "1", documentId: "d-1", documentName: "a.pdf", quote: "first source" },
      { marker: 2, chunkId: "2", documentId: "d-2", documentName: "b.pdf", quote: "second source" }
    ]);
  });

  it("deduplicates repeated markers and ignores out-of-range ones", () => {
    const cites = extractCitations("see [1] and again [1] but not [9]", sources);
    expect(cites.map((c) => c.marker)).toEqual([1]);
  });

  it("returns empty array when there are no markers", () => {
    expect(extractCitations("no citations here", sources)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test citations`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/citations.ts`**

```ts
import type { Chunk, Citation } from "./types";

/**
 * Parses [n] citation markers from an assistant answer and maps each unique,
 * in-range marker to the 1-based retrieved source chunk.
 */
export function extractCitations(answer: string, sources: Chunk[]): Citation[] {
  const seen = new Set<number>();
  const citations: Citation[] = [];
  const re = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(answer)) !== null) {
    const marker = Number(match[1]);
    if (seen.has(marker)) continue;
    const source = sources[marker - 1];
    if (!source) continue;
    seen.add(marker);
    citations.push({
      marker,
      chunkId: source.id,
      documentId: source.documentId,
      documentName: source.documentName,
      quote: source.content
    });
  }
  return citations;
}
```

- [ ] **Step 4: Export — update `src/index.ts`** (append `export * from "./citations";`)

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @contentmind/core test citations`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): map [n] markers to citations"
```

---

### Task 1.7: Rate limiting (pure)

**Files:**
- Create: `packages/core/src/rate-limit.ts`, `packages/core/src/rate-limit.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/rate-limit.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit (fixed window)", () => {
  const limit = 3;
  const windowMs = 60_000;

  it("allows under the limit and reports remaining", () => {
    const r = checkRateLimit([1000, 2000], { now: 3000, limit, windowMs });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(1);
  });

  it("blocks at the limit", () => {
    const r = checkRateLimit([1000, 1500, 2000], { now: 3000, limit, windowMs });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("ignores timestamps outside the window", () => {
    const r = checkRateLimit([1, 2, 3], { now: 100_000, limit, windowMs });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test rate-limit`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/rate-limit.ts`**

```ts
export interface RateLimitOptions {
  now: number;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

/** Counts request timestamps within the trailing window. */
export function checkRateLimit(
  timestamps: number[],
  { now, limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const cutoff = now - windowMs;
  const recent = timestamps.filter((t) => t > cutoff).length;
  const remaining = Math.max(0, limit - recent);
  return { allowed: recent < limit, remaining };
}
```

- [ ] **Step 4: Export — update `src/index.ts`** (append `export * from "./rate-limit";`)

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @contentmind/core test rate-limit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): add pure fixed-window rate limiter"
```

---

### Task 1.8: Scroll state machine (front-end behavior, pure)

**Files:**
- Create: `packages/core/src/scroll.ts`, `packages/core/src/scroll.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/scroll.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { computeScrollState } from "./scroll";

describe("computeScrollState", () => {
  it("is at-bottom within threshold and hides the jump button", () => {
    const s = computeScrollState({ scrollTop: 990, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.atBottom).toBe(true);
    expect(s.showJumpButton).toBe(false);
  });

  it("shows the jump button when scrolled up beyond threshold", () => {
    const s = computeScrollState({ scrollTop: 300, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.atBottom).toBe(false);
    expect(s.showJumpButton).toBe(true);
  });

  it("does not autoscroll when the user has scrolled up", () => {
    const s = computeScrollState({ scrollTop: 300, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.shouldAutoScroll).toBe(false);
  });

  it("autoscrolls while pinned to bottom", () => {
    const s = computeScrollState({ scrollTop: 1000, scrollHeight: 1100, clientHeight: 100, threshold: 24 });
    expect(s.shouldAutoScroll).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test scroll`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/scroll.ts`**

```ts
export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  threshold?: number;
}

export interface ScrollState {
  atBottom: boolean;
  showJumpButton: boolean;
  shouldAutoScroll: boolean;
}

export function computeScrollState({
  scrollTop,
  scrollHeight,
  clientHeight,
  threshold = 24
}: ScrollMetrics): ScrollState {
  const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
  const atBottom = distanceFromBottom <= threshold;
  return {
    atBottom,
    showJumpButton: !atBottom,
    shouldAutoScroll: atBottom
  };
}
```

- [ ] **Step 4: Export — update `src/index.ts`** (append `export * from "./scroll";`)

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @contentmind/core test scroll`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): add scroll state machine for autoscroll + jump button"
```

---

### Task 1.9: Tool-card state reducer (front-end behavior, pure)

**Files:**
- Create: `packages/core/src/tool-card.ts`, `packages/core/src/tool-card.test.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Write the failing test — `src/tool-card.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { toolCardReducer, initialToolCard } from "./tool-card";

describe("toolCardReducer", () => {
  it("starts pending", () => {
    expect(initialToolCard("searchDocuments").status).toBe("pending");
  });

  it("pending -> running on invoke", () => {
    const s = toolCardReducer(initialToolCard("searchDocuments"), {
      type: "invoke",
      args: { query: "hi" }
    });
    expect(s.status).toBe("running");
    expect(s.args).toEqual({ query: "hi" });
  });

  it("running -> result on resolve", () => {
    let s = toolCardReducer(initialToolCard("searchDocuments"), { type: "invoke", args: {} });
    s = toolCardReducer(s, { type: "resolve", result: [{ chunkId: "c1" }] });
    expect(s.status).toBe("result");
    expect(s.result).toEqual([{ chunkId: "c1" }]);
  });

  it("running -> error on fail", () => {
    let s = toolCardReducer(initialToolCard("extractFields"), { type: "invoke", args: {} });
    s = toolCardReducer(s, { type: "fail", error: "boom" });
    expect(s.status).toBe("error");
    expect(s.error).toBe("boom");
  });

  it("ignores resolve when not running", () => {
    const s = toolCardReducer(initialToolCard("searchDocuments"), { type: "resolve", result: 1 });
    expect(s.status).toBe("pending");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/core test tool-card`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/tool-card.ts`**

```ts
import type { ToolCall, ToolName } from "./types";

export type ToolCardEvent =
  | { type: "invoke"; args: unknown }
  | { type: "resolve"; result: unknown }
  | { type: "fail"; error: string };

export function initialToolCard(name: ToolName): ToolCall {
  return { id: crypto.randomUUID(), name, status: "pending", args: undefined };
}

export function toolCardReducer(state: ToolCall, event: ToolCardEvent): ToolCall {
  switch (event.type) {
    case "invoke":
      if (state.status !== "pending") return state;
      return { ...state, status: "running", args: event.args };
    case "resolve":
      if (state.status !== "running") return state;
      return { ...state, status: "result", result: event.result };
    case "fail":
      if (state.status !== "running") return state;
      return { ...state, status: "error", error: event.error };
    default:
      return state;
  }
}
```

- [ ] **Step 4: Export — update `src/index.ts`** (append `export * from "./tool-card";`)

- [ ] **Step 5: Run full core suite**

Run: `pnpm --filter @contentmind/core test`
Expected: PASS (all suites, ~25+ tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(core): add tool-card state reducer"
```

---

## Phase 2 — Next.js web app scaffold

### Task 2.1: Scaffold the Next.js app

**Files:**
- Create: `apps/web/*` (Next.js App Router + Tailwind)

- [ ] **Step 1: Scaffold with the CLI (non-interactive)**

Run from repo root:
```bash
pnpm dlx create-next-app@latest apps/web \
  --ts --app --tailwind --eslint --src-dir --use-pnpm \
  --import-alias "@/*" --no-turbopack --skip-install
```
Expected: `apps/web` created with `src/app`, Tailwind, TS.

- [ ] **Step 2: Set the package name + scripts in `apps/web/package.json`**

Edit `"name"` to `"@contentmind/web"` and ensure scripts include:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Add the core dependency**

In `apps/web/package.json` `dependencies`, add:
```json
"@contentmind/core": "workspace:*"
```

- [ ] **Step 4: Install + verify dev build**

Run: `pnpm install`
Run: `pnpm --filter @contentmind/web build`
Expected: Next.js build succeeds (default starter page).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(web): scaffold next.js app router + tailwind"
```

---

### Task 2.2: Install runtime dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Add dependencies**

Run from repo root:
```bash
pnpm --filter @contentmind/web add \
  ai @ai-sdk/google @ai-sdk/groq @ai-sdk/react \
  next-auth@beta @auth/drizzle-adapter \
  drizzle-orm @neondatabase/serverless postgres \
  unpdf react-markdown zod
pnpm --filter @contentmind/web add -D \
  drizzle-kit vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  @playwright/test
```
Expected: deps install cleanly.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore(web): add ai sdk, auth, drizzle, test deps"
```

---

### Task 2.3: Database schema (Drizzle + pgvector)

**Files:**
- Create: `apps/web/src/db/schema.ts`, `apps/web/src/db/index.ts`, `apps/web/drizzle.config.ts`

- [ ] **Step 1: Write `apps/web/src/db/schema.ts`**

```ts
import {
  pgTable, text, timestamp, integer, primaryKey, vector, index
} from "drizzle-orm/pg-core";

// --- Auth.js tables ---
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image")
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (a) => ({ pk: primaryKey({ columns: [a.provider, a.providerAccountId] }) })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});

// --- App tables ---
export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull().default("processing"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow()
});

export const chunks = pgTable(
  "chunks",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    documentId: text("documentId").notNull().references(() => documents.id, { onDelete: "cascade" }),
    index: integer("index").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull()
  },
  (t) => ({
    embeddingIdx: index("chunks_embedding_idx").using("hnsw", t.embedding.op("vector_cosine_ops"))
  })
);

export const chats = pgTable("chats", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New chat"),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow()
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text("chatId").notNull().references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: text("citations"),   // JSON string
  toolCalls: text("toolCalls"),   // JSON string
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow()
});

export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("userId").notNull(),
  at: timestamp("at", { mode: "date" }).notNull().defaultNow()
});
```

- [ ] **Step 2: Write `apps/web/src/db/index.ts`**

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 3: Write `apps/web/drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! }
});
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @contentmind/web typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): drizzle schema with pgvector + auth tables"
```

> Migration is run during Phase 6 (deploy) once `DATABASE_URL` exists:
> enable the extension (`CREATE EXTENSION IF NOT EXISTS vector;`) then `pnpm --filter @contentmind/web exec drizzle-kit push`.

---

### Task 2.4: Auth.js (GitHub OAuth)

**Files:**
- Create: `apps/web/src/lib/auth.ts`, `apps/web/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Write `apps/web/src/lib/auth.ts`**

```ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions
  }),
  providers: [GitHub],
  session: { strategy: "database" }
});
```

- [ ] **Step 2: Write `apps/web/src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @contentmind/web typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(web): add Auth.js GitHub OAuth with drizzle adapter"
```

> Confirm the Auth.js v5 Drizzle adapter table-mapping API for your installed version (check via context7). A `verificationTokens` table may be required by the adapter even with OAuth-only; add it if the adapter demands it.

---

## Phase 3 — Backend route handlers (lean)

### Task 3.1: Retrieval + ingestion libs

**Files:**
- Create: `apps/web/src/lib/retrieval.ts`, `apps/web/src/lib/ingest.ts`, `apps/web/src/lib/ai.ts`

- [ ] **Step 1: Write `apps/web/src/lib/ai.ts` (model with failover + mock support)**

```ts
import { createChatModel, createEmbeddingModel, providerOrder } from "@contentmind/core";
import { MockLanguageModelV2 } from "ai/test";

export function chatModel() {
  const order = providerOrder(process.env);
  if (order[0] === "mock") {
    // Deterministic model for e2e/CI. Streams a canned cited answer.
    return new MockLanguageModelV2({
      doStream: async () => ({
        stream: mockStream("Based on your document, the answer is yes [1]."),
        rawCall: { rawPrompt: null, rawSettings: {} }
      })
    });
  }
  // Primary model; route wraps calls in try/catch and retries with order[1].
  return createChatModel(order[0]!);
}

export function embeddingModel() {
  return createEmbeddingModel();
}

// Build a minimal text stream the AI SDK mock understands.
function mockStream(text: string) {
  // See AI SDK docs: simulateReadableStream emits text-delta + finish parts.
  // Implemented inline during build using `simulateReadableStream` from "ai/test".
  throw new Error("implement with simulateReadableStream during Task 3.1");
}
```

> During implementation, replace `mockStream` using `simulateReadableStream` from `ai/test` (check exact part shape via context7). The mock must emit the literal text above so the e2e citation assertion is deterministic.

- [ ] **Step 2: Write `apps/web/src/lib/retrieval.ts`**

```ts
import { embed } from "ai";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { chunks, documents } from "@/db/schema";
import { embeddingModel } from "./ai";
import type { Chunk } from "@contentmind/core";

/** Embed the query and run a pgvector cosine-distance search scoped to the user. */
export async function retrieve(query: string, userId: string, k = 4): Promise<Chunk[]> {
  const { embedding } = await embed({ model: embeddingModel(), value: query });
  const vec = `[${embedding.join(",")}]`;
  const rows = await db
    .select({
      id: chunks.id,
      documentId: chunks.documentId,
      documentName: documents.name,
      index: chunks.index,
      content: chunks.content
    })
    .from(chunks)
    .innerJoin(documents, sql`${documents.id} = ${chunks.documentId}`)
    .where(sql`${documents.userId} = ${userId}`)
    .orderBy(sql`${chunks.embedding} <=> ${vec}::vector`)
    .limit(k);

  return rows.map((r) => ({ ...r, embedding: [] }));
}
```

- [ ] **Step 3: Write `apps/web/src/lib/ingest.ts`**

```ts
import { embedMany } from "ai";
import { extractText } from "unpdf";
import { chunkText } from "@contentmind/core";
import { db } from "@/db";
import { documents, chunks } from "@/db/schema";
import { embeddingModel } from "./ai";

async function fileToText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    const buf = new Uint8Array(await file.arrayBuffer());
    const { text } = await extractText(buf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
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
    const { embeddings } = await embedMany({ model: embeddingModel(), values: pieces });
    await db.insert(chunks).values(
      pieces.map((content, index) => ({
        documentId: doc!.id,
        index,
        content,
        embedding: embeddings[index]!
      }))
    );
    await db.update(documents).set({ status: "ready" }).where(sql`${documents.id} = ${doc!.id}`);
    return doc!.id;
  } catch (err) {
    await db.update(documents).set({ status: "error" }).where(sql`${documents.id} = ${doc!.id}`);
    throw err;
  }
}
```

> Add the missing `import { sql } from "drizzle-orm";` at the top of `ingest.ts` during implementation.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @contentmind/web typecheck`
Expected: PASS (after fixing the `sql` import noted above).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): retrieval, ingestion, and failover-aware model helpers"
```

---

### Task 3.2: Upload route

**Files:**
- Create: `apps/web/src/app/api/upload/route.ts`

- [ ] **Step 1: Write the route**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @contentmind/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(web): upload route with validation + ingestion"
```

---

### Task 3.3: Chat route (streaming + tools + retrieval + rate limit)

**Files:**
- Create: `apps/web/src/app/api/chat/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { auth } from "@/lib/auth";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { and, gt, eq } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { buildTools, checkRateLimit, extractCitations } from "@contentmind/core";
import { chatModel } from "@/lib/ai";
import { retrieve } from "@/lib/retrieval";

const SYSTEM = `You are ContentMind, an assistant that answers ONLY from the user's documents.
Always ground answers in retrieved passages and cite them inline as [n], where n is the
1-based index of the source passage. If the documents don't contain the answer, say so.`;

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("unauthorized", { status: 401 });

  // Rate limit (fixed window, DB-backed)
  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 20);
  const since = new Date(Date.now() - 60_000);
  const recent = await db
    .select({ at: rateLimits.at })
    .from(rateLimits)
    .where(and(eq(rateLimits.userId, userId), gt(rateLimits.at, since)));
  const { allowed } = checkRateLimit(recent.map((r) => r.at.getTime()), {
    now: Date.now(),
    limit,
    windowMs: 60_000
  });
  if (!allowed) return new Response("rate limited", { status: 429 });
  await db.insert(rateLimits).values({ userId });

  const { messages }: { messages: UIMessage[] } = await req.json();

  const tools = buildTools({
    search: async (query, k) => {
      const hits = await retrieve(query, userId, k);
      return hits.map((c) => ({ chunkId: c.id, documentName: c.documentName, quote: c.content }));
    },
    extract: async () => ({}) // implemented via generateObject during build if time allows
  });

  const result = streamText({
    model: chatModel(),
    system: SYSTEM,
    messages: convertToModelMessages(messages),
    tools,
    onError: () => {
      // Failover hook: on provider error, the build step retries with providerOrder()[1].
    }
  });

  return result.toUIMessageStreamResponse();
}
```

> AI SDK surface (`convertToModelMessages`, `toUIMessageStreamResponse`, `UIMessage`) varies by version — confirm exact names via context7 before finalizing. Citations are computed client-side from retrieved sources + `[n]` markers via `extractCitations` (Task 4.x); if you prefer server-attached sources, stream them as a data part and confirm the writer API.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @contentmind/web typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(web): streaming chat route with tools + rate limiting"
```

---

## Phase 4 — Front-end (the centerpiece)

> These components consume the tested core primitives (`computeScrollState`, `toolCardReducer`, `extractCitations`) and the AI SDK `useChat` hook. Build mobile-first, keyboard-first, with ARIA baked in from the start.

### Task 4.1: App shell + auth gate + landing

**Files:**
- Create: `apps/web/src/app/(app)/layout.tsx`, `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`

- [ ] **Step 1: Landing `apps/web/src/app/page.tsx`**

```tsx
import Link from "next/link";
import { auth, signIn } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">ContentMind</h1>
      <p className="text-balance text-lg text-neutral-600">
        Chat with your documents. Grounded answers, with citations.
      </p>
      {session?.user ? (
        <Link href="/chat" className="rounded-full bg-black px-6 py-3 text-white">
          Open workspace
        </Link>
      ) : (
        <form action={async () => { "use server"; await signIn("github", { redirectTo: "/chat" }); }}>
          <button className="rounded-full bg-black px-6 py-3 text-white">Sign in with GitHub</button>
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Auth-gated `apps/web/src/app/(app)/layout.tsx`**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  return <div className="flex h-dvh flex-col">{children}</div>;
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter @contentmind/web build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(web): landing page + auth-gated app shell"
```

---

### Task 4.2: Chat workspace + composer (stop/regenerate)

**Files:**
- Create: `apps/web/src/app/(app)/chat/page.tsx`, `apps/web/src/components/chat/ChatPanel.tsx`, `apps/web/src/components/chat/Composer.tsx`

- [ ] **Step 1: `chat/page.tsx`**

```tsx
import { ChatPanel } from "@/components/chat/ChatPanel";
import { DocUpload } from "@/components/docs/DocUpload";

export default function ChatWorkspace() {
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[320px_1fr]">
      <aside className="hidden border-r md:block"><DocUpload /></aside>
      <ChatPanel />
    </div>
  );
}
```

- [ ] **Step 2: `ChatPanel.tsx` (uses `useChat`)**

```tsx
"use client";
import { useChat } from "@ai-sdk/react";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

export function ChatPanel() {
  const { messages, sendMessage, status, stop, regenerate } = useChat();
  const isStreaming = status === "streaming" || status === "submitted";
  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Chat with your documents">
      <MessageList messages={messages} isStreaming={isStreaming} />
      <Composer
        onSend={(text) => sendMessage({ text })}
        onStop={stop}
        onRegenerate={regenerate}
        isStreaming={isStreaming}
        canRegenerate={messages.length > 0}
      />
    </section>
  );
}
```

- [ ] **Step 3: `Composer.tsx`**

```tsx
"use client";
import { useState } from "react";

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
  isStreaming: boolean;
  canRegenerate: boolean;
}

export function Composer({ onSend, onStop, onRegenerate, isStreaming, canRegenerate }: Props) {
  const [text, setText] = useState("");
  const submit = () => {
    const t = text.trim();
    if (!t || isStreaming) return;
    onSend(t);
    setText("");
  };
  return (
    <form
      className="flex items-end gap-2 border-t p-3"
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <label htmlFor="composer" className="sr-only">Message</label>
      <textarea
        id="composer"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        rows={1}
        placeholder="Ask about your documents…"
        className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2"
      />
      {isStreaming ? (
        <button type="button" onClick={onStop} className="rounded-xl border px-4 py-2">Stop</button>
      ) : (
        <>
          {canRegenerate && (
            <button type="button" onClick={onRegenerate} className="rounded-xl border px-3 py-2">
              Regenerate
            </button>
          )}
          <button type="submit" disabled={!text.trim()} className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-40">
            Send
          </button>
        </>
      )}
    </form>
  );
}
```

> Confirm the `@ai-sdk/react` `useChat` return shape (`sendMessage`, `status`, `stop`, `regenerate`) for your installed version via context7; adjust names if needed.

- [ ] **Step 4: Build**

Run: `pnpm --filter @contentmind/web build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): chat panel + composer with stop/regenerate"
```

---

### Task 4.3: MessageList with autoscroll, jump-to-latest, ARIA live (component test)

**Files:**
- Create: `apps/web/src/components/chat/MessageList.tsx`, `apps/web/src/components/chat/JumpToLatest.tsx`, `apps/web/tests/unit/MessageList.test.tsx`, `apps/web/vitest.config.ts`

- [ ] **Step 1: Write `apps/web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.tsx"]
  }
});
```

- [ ] **Step 2: Write `apps/web/vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write the failing test — `tests/unit/MessageList.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MessageList } from "@/components/chat/MessageList";

const msg = (id: string, role: "user" | "assistant", text: string) => ({
  id, role, parts: [{ type: "text", text }]
});

describe("MessageList", () => {
  it("renders an ARIA live region for assistant streaming", () => {
    render(<MessageList messages={[msg("1", "assistant", "hi")]} isStreaming />);
    const live = screen.getByRole("log");
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("renders user and assistant messages with roles labeled", () => {
    render(
      <MessageList
        messages={[msg("1", "user", "question"), msg("2", "assistant", "answer")]}
        isStreaming={false}
      />
    );
    expect(screen.getByText("question")).toBeInTheDocument();
    expect(screen.getByText("answer")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter @contentmind/web exec vitest run tests/unit/MessageList.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 5: Implement `JumpToLatest.tsx`**

```tsx
"use client";
export function JumpToLatest({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border bg-white px-4 py-1.5 text-sm shadow"
    >
      Jump to latest ↓
    </button>
  );
}
```

- [ ] **Step 6: Implement `MessageList.tsx`**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { computeScrollState } from "@contentmind/core";
import type { UIMessage } from "ai";
import { Message } from "./Message";
import { JumpToLatest } from "./JumpToLatest";

export function MessageList({ messages, isStreaming }: { messages: UIMessage[]; isStreaming: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = () => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const s = computeScrollState({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight
    });
    setShowJump(s.showJumpButton);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = computeScrollState({
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight
    });
    if (s.shouldAutoScroll) scrollToBottom();
  }, [messages, isStreaming]);

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation"
        className="h-full overflow-y-auto px-4 py-6"
      >
        <ol className="mx-auto flex max-w-2xl flex-col gap-6">
          {messages.map((m) => (
            <li key={m.id}>
              <Message message={m} />
            </li>
          ))}
        </ol>
      </div>
      {showJump && <JumpToLatest onClick={scrollToBottom} />}
    </div>
  );
}
```

> The test renders `Message`, so implement a minimal `Message.tsx` (Task 4.4) before this test passes, or stub `Message` to render text parts now and enrich it in 4.4. Recommended: do Step 7 stub here, then enrich in 4.4.

- [ ] **Step 7: Minimal `Message.tsx` stub**

```tsx
"use client";
import type { UIMessage } from "ai";

export function Message({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? p.text : ""))
    .join("");
  return (
    <div data-role={message.role} className="whitespace-pre-wrap">
      {text}
    </div>
  );
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm --filter @contentmind/web exec vitest run tests/unit/MessageList.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(web): MessageList with autoscroll, jump-to-latest, ARIA live"
```

---

### Task 4.4: Message rendering — markdown + citation chips + source highlight

**Files:**
- Modify: `apps/web/src/components/chat/Message.tsx`
- Create: `apps/web/src/components/chat/CitationChip.tsx`, `apps/web/src/components/docs/SourcePanel.tsx`

- [ ] **Step 1: Implement `CitationChip.tsx`**

```tsx
"use client";
import type { Citation } from "@contentmind/core";

export function CitationChip({ citation, onActivate }: { citation: Citation; onActivate: (c: Citation) => void }) {
  return (
    <button
      onClick={() => onActivate(citation)}
      aria-label={`Source ${citation.marker}: ${citation.documentName}`}
      className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded bg-blue-100 px-1 align-text-top text-xs font-medium text-blue-700 hover:bg-blue-200"
    >
      {citation.marker}
    </button>
  );
}
```

- [ ] **Step 2: Enrich `Message.tsx`** — render markdown, replace `[n]` with chips using `extractCitations`

```tsx
"use client";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";
import { extractCitations, type Chunk, type Citation } from "@contentmind/core";
import { CitationChip } from "./CitationChip";
import { ToolCard } from "./ToolCard";

export function Message({
  message,
  sources = [],
  onCitationActivate = () => {}
}: {
  message: UIMessage;
  sources?: Chunk[];
  onCitationActivate?: (c: Citation) => void;
}) {
  const text = message.parts.filter((p) => p.type === "text").map((p) => ("text" in p ? p.text : "")).join("");
  const toolParts = message.parts.filter((p) => p.type.startsWith("tool-"));
  const citations = message.role === "assistant" ? extractCitations(text, sources) : [];

  return (
    <div data-role={message.role} className={message.role === "user" ? "ml-auto max-w-[80%]" : ""}>
      {toolParts.map((p, i) => <ToolCard key={i} part={p} />)}
      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown
          components={{
            text: undefined // markers handled post-render below
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
      {citations.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {citations.map((c) => (
            <CitationChip key={c.marker} citation={c} onActivate={onCitationActivate} />
          ))}
        </div>
      )}
    </div>
  );
}
```

> Inline `[n]` → chip replacement inside markdown text is fiddly. Simplest robust approach (use during build): render markdown normally, and render the citation chips row beneath the message (as above). If you want true inline chips, post-process text nodes with a rehype/remark step — only if time allows.

- [ ] **Step 3: Implement `SourcePanel.tsx`** (shows + highlights the activated citation's passage)

```tsx
"use client";
import type { Citation } from "@contentmind/core";

export function SourcePanel({ active }: { active: Citation | null }) {
  if (!active) return <p className="p-4 text-sm text-neutral-500">Click a citation to see its source.</p>;
  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold">{active.documentName}</h2>
      <mark className="mt-2 block rounded bg-yellow-100 p-2 text-sm">{active.quote}</mark>
    </div>
  );
}
```

- [ ] **Step 4: Build**

Run: `pnpm --filter @contentmind/web build`
Expected: succeeds (remove the placeholder `components={{ text: undefined }}` if it causes a type error).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): markdown messages, citation chips, source panel"
```

---

### Task 4.5: ToolCard (agentic UX) with state-driven rendering (component test)

**Files:**
- Create: `apps/web/src/components/chat/ToolCard.tsx`, `apps/web/tests/unit/ToolCard.test.tsx`

- [ ] **Step 1: Write the failing test — `tests/unit/ToolCard.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ToolCard } from "@/components/chat/ToolCard";

describe("ToolCard", () => {
  it("shows a running indicator while the tool is executing", () => {
    render(<ToolCard part={{ type: "tool-searchDocuments", state: "input-available", input: { query: "x" } }} />);
    expect(screen.getByText(/searching documents/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders search results when available", () => {
    render(
      <ToolCard
        part={{
          type: "tool-searchDocuments",
          state: "output-available",
          input: { query: "x" },
          output: [{ chunkId: "c1", documentName: "a.pdf", quote: "hello" }]
        }}
      />
    );
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText(/hello/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @contentmind/web exec vitest run tests/unit/ToolCard.test.tsx`
Expected: FAIL — component not found.

- [ ] **Step 3: Implement `ToolCard.tsx`**

```tsx
"use client";

interface SearchHit { chunkId: string; documentName: string; quote: string; }
interface ToolPart {
  type: string;                 // e.g. "tool-searchDocuments"
  state: string;                // "input-available" | "output-available" | ...
  input?: unknown;
  output?: unknown;
}

export function ToolCard({ part }: { part: ToolPart }) {
  const name = part.type.replace(/^tool-/, "");
  const running = part.state !== "output-available";
  const label = name === "searchDocuments" ? "Searching documents" : "Extracting fields";

  return (
    <div className="my-2 rounded-xl border bg-neutral-50 p-3 text-sm">
      <div className="flex items-center gap-2 font-medium">
        {running ? (
          <span role="status" className="inline-block size-3 animate-pulse rounded-full bg-blue-500" />
        ) : (
          <span aria-hidden className="inline-block size-3 rounded-full bg-green-500" />
        )}
        {running ? `${label}…` : `${label} — done`}
      </div>
      {part.state === "output-available" && name === "searchDocuments" && (
        <ul className="mt-2 space-y-1">
          {(part.output as SearchHit[]).map((h) => (
            <li key={h.chunkId} className="rounded border bg-white p-2">
              <span className="font-medium">{h.documentName}</span>
              <span className="block text-neutral-600">{h.quote}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

> The exact tool-part `state` strings (`input-available` / `output-available`) depend on the AI SDK version — confirm via context7 and align the test + component. The `role="status"` element backs the accessible "running" announcement.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @contentmind/web exec vitest run tests/unit/ToolCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): agentic ToolCard with running/result states"
```

---

### Task 4.6: Document upload UI (drag/drop + progress + status)

**Files:**
- Create: `apps/web/src/components/docs/DocUpload.tsx`, `apps/web/src/components/docs/DocList.tsx`

- [ ] **Step 1: Implement `DocUpload.tsx`**

```tsx
"use client";
import { useState } from "react";

export function DocUpload() {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    setStatus("uploading");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body });
    setStatus(res.ok ? "done" : "error");
  };

  return (
    <div className="p-4">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f); }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center text-sm ${dragOver ? "border-blue-500 bg-blue-50" : "border-neutral-300"}`}
      >
        <span>Drop a PDF or text file, or click to upload</span>
        <input
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
        />
      </label>
      <p role="status" className="mt-2 text-xs text-neutral-500">
        {status === "uploading" && "Processing…"}
        {status === "done" && "Ready ✓"}
        {status === "error" && "Upload failed"}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `pnpm --filter @contentmind/web build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(web): document upload with drag/drop + status"
```

---

### Task 4.7: Accessibility + reduced-motion pass

**Files:**
- Modify: `apps/web/src/app/globals.css`, components as needed

- [ ] **Step 1: Add reduced-motion + focus styles to `globals.css`**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
```

- [ ] **Step 2: Manual a11y checklist (document results in PR)**
  - Tab through landing → sign in → composer → send; focus visible throughout.
  - Screen reader announces streamed assistant text via the `role="log"` region.
  - Tool "running" state announced via `role="status"`.
  - Color contrast AA for text + chips.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(web): reduced-motion, focus-visible, sr-only utilities"
```

---

## Phase 5 — E2E + CI

### Task 5.1: Playwright e2e against the mock provider

**Files:**
- Create: `apps/web/playwright.config.ts`, `apps/web/tests/e2e/chat.spec.ts`

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: { AI_PROVIDER: "mock", E2E_BYPASS_AUTH: "1" }
  }
});
```

- [ ] **Step 2: Write the e2e test — `tests/e2e/chat.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("user can ask a question and see a cited streamed answer", async ({ page }) => {
  await page.goto("/chat");
  await page.getByLabel("Message").fill("Does the document say yes?");
  await page.getByRole("button", { name: "Send" }).click();

  // The mock model streams: "Based on your document, the answer is yes [1]."
  await expect(page.getByText(/the answer is yes/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Source 1/i })).toBeVisible();
});
```

> Add an `E2E_BYPASS_AUTH` short-circuit in `(app)/layout.tsx` and the chat route that injects a fixed test user id when the flag is set, so e2e runs without real GitHub OAuth. Guard it so it is impossible to enable in production (`process.env.NODE_ENV !== "production" && process.env.E2E_BYPASS_AUTH`).

- [ ] **Step 3: Install browsers + run**

Run: `pnpm --filter @contentmind/web exec playwright install --with-deps chromium`
Run: `pnpm --filter @contentmind/web test:e2e`
Expected: PASS (mock provider, no live API calls). Requires a reachable `DATABASE_URL` or a seeded test doc; if DB-free e2e is desired, stub `retrieve()` to return a fixed source when `AI_PROVIDER=mock`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test(web): e2e chat flow against mock provider"
```

---

### Task 5.2: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: {}

jobs:
  verify:
    runs-on: ubuntu-latest
    env:
      AI_PROVIDER: mock
      E2E_BYPASS_AUTH: "1"
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm --filter @contentmind/web exec playwright install --with-deps chromium
      - run: pnpm --filter @contentmind/web build
      - run: pnpm --filter @contentmind/web test:e2e
```

- [ ] **Step 2: Verify locally that each command passes**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: typecheck, lint, unit, build, e2e on PRs"
```

---

## Phase 6 — Deploy

### Task 6.1: Provision Neon + deploy to Vercel

**Files:** (config only)

- [ ] **Step 1: Create a Neon Postgres DB** (Vercel Marketplace or neon.tech free tier). Copy `DATABASE_URL`.

- [ ] **Step 2: Enable pgvector + push schema**

Run (with `DATABASE_URL` exported locally):
```bash
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"
pnpm --filter @contentmind/web exec drizzle-kit push
```
Expected: tables + HNSW index created.

- [ ] **Step 3: Create a GitHub OAuth app** (callback `https://<your-vercel-domain>/api/auth/callback/github`). Copy client id/secret.

- [ ] **Step 4: Configure Vercel project**
  - Root directory: `apps/web` (monorepo) with build command `pnpm build` at repo root, or use Vercel's Turborepo detection.
  - Env vars: `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, `AI_PROVIDER=google`, `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 33`), `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `RATE_LIMIT_PER_MINUTE`.

- [ ] **Step 5: Deploy + smoke test**

Run: deploy via Vercel (dashboard or `vercel --prod`).
Verify: sign in with GitHub → upload a doc → ask a question → streamed answer with a clickable citation.

- [ ] **Step 6: Add README with live link + CI badge + "built with Claude Code" note. Commit.**

```bash
git add -A
git commit -m "docs: add README with live demo + architecture overview"
```

---

## Phase 7 — Stretch (only if time remains)

### Task 7.1 (STRETCH): Expo React Native chat screen reusing `@contentmind/core`
- Scaffold `apps/mobile` with Expo (`pnpm dlx create-expo-app`).
- Add `@contentmind/core` as a workspace dep; configure Metro for monorepo resolution.
- Build a single chat screen using `@ai-sdk/react`'s `useChat` pointed at the deployed `/api/chat`, reusing `computeScrollState` and `toolCardReducer` from core.
- Capture screenshots for the README.

### Task 7.2 (STRETCH): Feature-flagged model/prompt variant
- Add a `FEATURE_VARIANT` env flag read in `chatModel()` / system prompt selection.
- Document it as the seed of an A/B experiment (assign by user id hash; log which variant served).

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Front-end craft (streaming, agentic cards, citations, a11y, perf) → Phase 4 (Tasks 4.2–4.7). ✓
- Cross-platform monorepo + shared core → Phases 0–1, Task 7.1. ✓
- Lean backend: Gemini + Groq failover, Neon + pgvector, Auth.js, rate limiting → Phases 2–3. ✓
- Testing (Vitest unit incl. AI client/mock, Playwright e2e) + CI → Phase 1 (mock provider noted), Phase 5. ✓
- Deploy on Vercel free → Phase 6. ✓
- Stretch (RN, feature flag) → Phase 7. ✓

**Known soft spots flagged inline for the implementer (not placeholders — explicit doc-check callouts):**
- Exact AI SDK API names (`tool` input key, `useChat` shape, message part `state` strings, `toUIMessageStreamResponse`, `convertToModelMessages`, `MockLanguageModelV2`/`simulateReadableStream`) must be confirmed against the installed version via context7. Tasks 1.4, 1.5, 3.1, 3.3, 4.2, 4.5 carry these callouts.
- Auth.js v5 adapter table requirements (possible `verificationTokens` table) — Task 2.4.
- E2E without a live DB: stub `retrieve()` under `AI_PROVIDER=mock` — Task 5.1.

**Type consistency:** `Chunk`, `Citation`, `ToolCall`, `ScoredChunk`, `ToolContext`, `computeScrollState`, `toolCardReducer`, `extractCitations`, `checkRateLimit`, `pickProvider/providerOrder` are defined once in core and consumed with matching signatures in web. ✓
