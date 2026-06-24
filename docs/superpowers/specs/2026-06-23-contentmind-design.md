# ContentMind — Design Spec

**Date:** 2026-06-23
**Status:** Approved (pending implementation plan)
**Working name:** ContentMind *(may be renamed during implementation)*

---

## 1. Purpose

A portfolio project built to demonstrate fitness for **Frontend Engineer II, AI Experiences at Box**.

**Product:** An Intelligent Content assistant. A user uploads their own documents, then
chats with an AI that answers **grounded in that content** — with inline citations back to
the source — and can invoke **agentic tools** over the documents. It is a focused, honest
miniature of Box AI.

**Positioning:** *A front-end engineer's take on Box AI.* The front-end is the centerpiece;
the backend is solid but deliberately lean and acts as the supporting cast — mirroring the
JD's framing of the role as "primarily front-end development… partnering closely with backend
teams to ship delightful Box AI user experiences."

This project is itself built with Claude Code, satisfying the JD's bonus bullet:
*"Bonus points if you have a link to a project you built with Cursor/Claude."*

---

## 2. Goals and non-goals

### Goals (mapped to the JD)
- Ship front-end features for **AI chat and agentic experiences** on web (and React Native as a stretch).
- Demonstrate a **shared cross-platform codebase** via a monorepo with a shared logic core.
- Integrate AI **APIs/services** in a performant, resilient way (streaming, provider failover, cancellation).
- Stand up **CI/CD** suitable for frequent releases.
- Uphold **accessibility, performance, and quality** with a real (focused) test suite.
- Use **current AI model capabilities** (real tool-calling, structured extraction).
- Produce clean documentation and reviewable history.

### Non-goals
- Enterprise auth, RBAC, org/team management, or compliance features.
- Exhaustive test coverage — tests are focused and meaningful, not a coverage chase.
- Heavy/clever backend. RAG exists only to make the front-end experience real; it stays boring.
- Java (a JD "plus", not a requirement; forcing it in would be contrived).
- On-call/ops tooling.

---

## 3. Architecture — Turborepo monorepo (pnpm)

```
contentmind/
├─ apps/
│  ├─ web/          # Next.js (App Router) → deployed to Vercel   (MUST-HAVE)
│  └─ mobile/       # Expo React Native app                        (STRETCH)
├─ packages/
│  ├─ core/         # shared, platform-agnostic logic
│  └─ config/       # shared tsconfig / eslint presets
└─ .github/workflows/ci.yml
```

**Core principle: share logic, not UI.** `packages/core` contains everything that runs
identically in React and React Native — types, the provider-agnostic AI client,
chunking/retrieval helpers, the agentic tool definitions, and the **chat state hooks**. Each
app owns its own presentation layer. This is the defensible cross-platform pattern and a
deliberate interview talking point ("shared core, platform-specific surface").

---

## 4. ⭐ Front-end craft (the centerpiece)

This is where the effort, polish, and the interview story concentrate.

- **Streaming chat UX:** token-by-token markdown rendering (code blocks, lists) with zero
  layout thrash; smart auto-scroll with a "jump to latest" pill that appears only when the
  user has scrolled up; **stop** and **regenerate** controls; optimistic message send.
- **Agentic UX:** the model's tool calls render as live, interactive **cards** that stream
  through `pending → running → result` states — a semantic-search results card and an
  `extractFields` table. Makes "agentic experiences" visible rather than hidden in logs.
- **Citation interaction:** inline citation chips in answers that, on click, scroll to and
  highlight the source passage in the document panel — grounded, trustworthy AI over content.
- **Accessibility of a streaming, dynamic interface:** ARIA live regions for incremental
  responses, correct focus management across send/stream/complete, full keyboard operation,
  `prefers-reduced-motion` support, and sufficient contrast — targeting clean axe and
  Lighthouse passes. This is the differentiator most AI portfolios miss.
- **Performance:** virtualized message list, minimized re-renders, optimistic UI, and a
  Core Web Vitals budget.
- **Distinctive visual design:** an intentional, polished aesthetic — not generic AI-app
  boilerplate. (Specific visual direction decided during implementation.)

---

## 5. Cross-platform approach

- `packages/core` exposes framework-agnostic logic plus React hooks (e.g. a `useChat`-style
  hook) usable by both apps.
- `apps/web` is the primary, must-have surface (Next.js App Router, deployed to Vercel).
- `apps/mobile` (Expo) is a stretch goal: it renders the chat screen by reusing
  `packages/core`, proving "one codebase, web + mobile." Demonstrated via Expo + README
  screenshots if completed.

---

## 6. Backend (intentionally lean — supporting cast)

- **Next.js route handlers** for: upload (parse → chunk → embed → store) and chat
  (`streamText` with tools + retrieval).
- **AI provider:** Google **Gemini free tier** for chat and embeddings, behind a
  provider-agnostic interface, with **Groq** as a failover provider (resilience story).
  Swappable to the Vercel AI Gateway later in ~one line.
- **Vector store / DB:** **Neon Postgres + pgvector** (free tier), all rows scoped by
  `user_id` for genuine multi-user content isolation.
- **Auth:** Auth.js with GitHub OAuth.
- **Rate limiting** per user/IP to protect free-tier provider limits and keep the public
  demo safe.
- Upload validation (size/type) and graceful embedding-failure handling.

### Data model (Postgres / pgvector)
- `users` — from Auth.js.
- `documents(id, user_id, name, status, created_at)`
- `chunks(id, document_id, content, embedding vector, metadata)`
- `chats(id, user_id, title, created_at)`
- `messages(id, chat_id, role, content, tool_calls, citations, created_at)`

### AI layer (`packages/core`)
- Provider-agnostic interface over the AI SDK; default Gemini, Groq failover.
- Functions: `chunk()`, `embed()`, `retrieve(query, userId, k)`, `chatStream({messages, tools})`.
- Two agentic tools with zod-typed I/O:
  - `searchDocuments` — semantic search across the user's workspace.
  - `extractFields` — structured extraction (e.g. parties, dates, amounts) returning typed JSON.

### Resilience
- Provider failover (Gemini → Groq), streaming **abort/cancel**, graceful error states.

---

## 7. Testing and CI (real, focused)

- **Unit (Vitest):**
  - Core logic: chunking, retrieval ranking, tool input/output schemas, citation mapping.
  - Front-end behavior: streaming render, auto-scroll logic, tool-card state machine.
  - AI client against a **mocked model** for deterministic, cost-free AI tests.
- **E2E (Playwright):** against the mock provider — upload → ask → streamed answer with a
  working citation chip.
- **GitHub Actions CI:** typecheck → lint → unit → build → e2e. Status badge in the README.

CI uses the mock provider so it is deterministic and incurs no API cost.

---

## 8. Accessibility and performance targets

- Keyboard-operable throughout; visible focus; logical focus order.
- ARIA live region announces streamed responses without flooding screen readers.
- `prefers-reduced-motion` respected for streaming/scroll animations.
- Color contrast meets WCAG AA.
- Clean axe checks; Lighthouse performance/accessibility budgets defined and met.

---

## 9. Deployment and cost

- **Hosting:** Vercel **Hobby** (free).
- **DB:** Neon via the Vercel Marketplace (auto-provisioned env vars).
- **Secrets:** all provider keys server-side only; never in the client bundle.
- **Sustaining cost:** ~$0 within free-tier rate limits; serverless = no idle cost. Rate
  limiting + a "demo mode" protect against a public link exhausting free limits.

---

## 10. Scope

### Committed (sections 4–9) — a complete, accessible, tested, deployed front-end-forward artifact in 1–2 days
1. Turborepo monorepo with shared `packages/core`.
2. Next.js web app: auth-gated workspace, document upload, streaming RAG chat with citations,
   one+ agentic tool rendered as interactive cards.
3. Lean backend: Gemini + Groq failover, Neon + pgvector, Auth.js, rate limiting.
4. Focused Vitest + Playwright suite and GitHub Actions CI; deployed to Vercel.

### Stretch (same shared core, only if time allows)
- Expo React Native chat screen reusing `packages/core`.
- Feature-flagged prompt/model variant (seed of an A/B-testing story).

---

## 11. Decisions deferred to implementation

These are intentionally left open and will be settled while building:
- Final product **name**.
- Exact **visual design** direction.
- Precise definition of the two **agentic tools** (`searchDocuments`, `extractFields`) and
  any third tool.

---

## 12. JD alignment summary

| JD signal | Covered by |
|---|---|
| Front-end AI **chat + agentic** experiences | Section 4 |
| **Cross-platform** shared codebase | Sections 3, 5 |
| Integrate **APIs**, performant/resilient AI | Section 6 (streaming, failover, cancel) |
| **CI/CD** for frequent releases | Section 7 |
| **A/B tests / feature flags** | Section 10 (stretch) |
| **Accessibility, performance, quality** | Sections 4, 7, 8 |
| Current **AI model capabilities** | Section 6 (tool-calling, extraction) |
| **Built with Claude** (bonus) | Whole project |
| React / **TypeScript** / FE architecture | Sections 3–5 |
| Willing to learn **React Native** | Sections 5, 10 |
| **REST API** integration | Section 6 |
