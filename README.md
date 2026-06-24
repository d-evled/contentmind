# ContentMind

> A front-end-forward AI assistant over your documents — upload files, then chat with an AI that answers **grounded in your content**, with inline citations and **agentic tool-call cards**. A focused, honest miniature of intelligent content management.

[![CI](https://github.com/d-evled/contentmind/actions/workflows/ci.yml/badge.svg)](https://github.com/d-evled/contentmind/actions/workflows/ci.yml)

**Live demo:** _coming soon_ · Built with [Claude Code](https://claude.com/claude-code).

---

## Why this exists

ContentMind demonstrates the craft of building **delightful, accessible, agentic AI experiences** on the front end: streaming UX, tool-calling rendered as live interactive cards, trustworthy citations back to source passages, and accessibility designed for a *streaming* interface from the start. The backend is deliberately lean — it exists to make the front-end real.

## Features

- **Streaming RAG chat** — token-by-token markdown, smart autoscroll with a jump-to-latest pill, stop / regenerate.
- **Agentic tool cards** — the model's `searchDocuments` tool call renders as a live card (`pending → running → result`).
- **Grounded citations** — inline citation chips correlate to the retrieved source passage; click one to open a highlighted source panel.
- **Document upload** — drag-and-drop PDFs / text; parsed, chunked, embedded, and stored.
- **Accessible streaming UI** — `role="log"` + `aria-live` transcript, `role="status"` tool state, full keyboard operation, `prefers-reduced-motion`, visible focus.
- **Resilient AI** — provider-agnostic interface with **Gemini → Groq failover**, streaming abort, and per-user rate limiting.
- **Multi-user isolation** — every document and chat is scoped to the signed-in user.

## Architecture

A pnpm + Turborepo monorepo that **shares logic, not UI** — the defensible cross-platform pattern (web today, React Native–ready).

```
contentmind/
├─ packages/
│  ├─ core/      # @contentmind/core — platform-agnostic, fully tested logic:
│  │            #   chunking · vector ranking · provider selection + failover
│  │            #   agentic tool defs · citation parsing · rate limiter
│  │            #   pure UI state machines (autoscroll, tool-card)
│  └─ config/    # shared tsconfig / eslint
└─ apps/
   └─ web/       # Next.js (App Router) — presentation, route handlers, auth, DB
```

The web app and a future React Native app both import `@contentmind/core`; each owns its own presentation.

## Tech stack

| Area | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| AI | Vercel AI SDK v6 · Google Gemini (free tier) + Groq failover |
| Data | Neon Postgres + pgvector (768-dim, `text-embedding-004`) via Drizzle ORM |
| Auth | Auth.js (next-auth v5) — GitHub OAuth |
| Testing | Vitest (incl. a deterministic AI mock-model test) + Playwright e2e |
| CI/CD | GitHub Actions → Vercel |

## Local development

```bash
pnpm install

# Run all checks (what CI runs)
pnpm typecheck
pnpm lint
pnpm test            # 44 core + 5 web unit tests

# Web app
pnpm --filter @contentmind/web dev
```

### Environment

Copy `.env.example` and fill in:

| Var | Purpose |
|---|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini (chat + embeddings), free tier |
| `GROQ_API_KEY` | Optional failover provider |
| `AI_PROVIDER` | `google` (prod) / `mock` (tests) |
| `DATABASE_URL` | Neon Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 33` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app |
| `RATE_LIMIT_PER_MINUTE` | Per-user chat rate limit (default 20) |

## Testing

- **Unit (Vitest):** pure logic in `@contentmind/core` plus front-end behavior; the AI client is tested against a deterministic mock model — no live API calls.
- **E2E (Playwright):** drives the full client → `/api/chat` → stream → UI path on the mock provider, so CI is deterministic and free.

```bash
pnpm --filter @contentmind/web test:e2e
```

## Status

Web app, shared core, backend, tests, and CI are complete and green. A React Native app reusing `@contentmind/core` and a feature-flagged A/B variant are planned next.
