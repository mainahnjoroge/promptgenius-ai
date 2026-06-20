# PromptGenius AI

A commercial, SaaS-ready **prompt-generator product** — a live-AI engine, a modern
marketing site, a full web app, and a native mobile app, in one type-safe monorepo.

> The LLM generates high-quality, structured prompts. The **app** implements the
> SaaS — bundles, pricing tiers, feature gating, quotas, billing, and persistence —
> in real, enforced code (not "simulated" by a model).

Everything runs **today with zero external accounts** thanks to graceful mock
fallbacks. Drop in real keys to go live.

---

## What's inside

| Surface | Stack | Highlights |
|---|---|---|
| **Landing page** | Next.js 15, Tailwind, Framer Motion | Hero with a live in-browser demo, features, how-it-works, pricing, CTA |
| **Web app** | Next.js App Router | Auth, dashboard (filters + streaming generation), library (save/favorite/edit), bundle generator, pricing & upgrade |
| **AI engine** | `@anthropic-ai/sdk` (Claude) | Streaming generation, structured-output bundles, deterministic offline mock |
| **Mobile app** | Expo (React Native) | Generate, Library, Pricing, Profile — a thin client of the same API |
| **Core** | TypeScript (`@promptgenius/core`) | Isomorphic engine: types, system prompt, industry frameworks, tiers, gating, parsing, mocks |

### Monorepo layout

```
.
├─ apps/
│  ├─ web/        # Next.js 15 — landing + SaaS dashboard + API routes
│  └─ mobile/     # Expo / React Native app
└─ packages/
   └─ core/       # @promptgenius/core — shared, isomorphic engine (no native deps)
```

---

## Quick start

Requires **Node ≥ 20** and **pnpm** (`npm i -g pnpm`).

```bash
pnpm install
pnpm core:build               # build the shared engine once
pnpm --filter web db:push     # create the local SQLite database
pnpm web                      # http://localhost:3000  (builds core, runs web)
```

Open <http://localhost:3000> — the landing page, dashboard, and pricing all work
in **sample mode** immediately. Generate a prompt, save it, upgrade your plan
(simulated), and unlock advanced prompts, workflows, and the bundle generator.

### Mobile

```bash
pnpm mobile                   # builds core, starts the Expo dev server
```

Then open it in Expo Go or a simulator. The app calls the web API at
`EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`; use your machine's LAN
IP on a physical device) and falls back to the local engine when offline.

---

## Going live (optional)

Every integration is optional and gated behind an env var. With none set, the app
runs fully in mock mode. Copy `.env.example` → `.env` (root) and/or
`apps/web/.env.local`, then fill in what you need:

| Capability | Env vars | Mock behavior when unset |
|---|---|---|
| **Live AI** (Claude) | `ANTHROPIC_API_KEY` | Deterministic sample prompts (no API calls) |
| **Auth** (Clerk) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Single local "demo" user |
| **Billing** (Stripe) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs | Upgrades flip the tier directly (no charge) |
| **Database** | `DATABASE_URL` | Local SQLite at `apps/web/prisma/dev.db` |

The default model is `claude-opus-4-8` (streaming, configurable `effort`). For
production Postgres, switch the Prisma datasource `provider` to `postgresql` and
point `DATABASE_URL` at Neon/Supabase.

---

## Pricing & gating (enforced in code)

| Tier | Price | Generations | Unlocks |
|---|---|---|---|
| **Starter** | Free | 5 / mo | Simple prompts, all industries, save & favorite |
| **Professional** | $29/mo (−20% annual) | 100 / mo | Advanced structured prompts, frameworks, bundle generator |
| **Enterprise** | $199/mo (−25% annual) | Unlimited | Multi-step workflows, API access, priority effort |

Quotas, allowed output types, the bundle generator, and API access are all
enforced server-side (`packages/core/src/gating.ts`), with contextual upgrade CTAs
in the UI.

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm build` | Build all packages (topological: core → web) |
| `pnpm test` | Run unit tests (`@promptgenius/core`) |
| `pnpm typecheck` | Typecheck every package |
| `pnpm web` / `pnpm mobile` | Run the web / mobile dev server (builds core first) |
| `pnpm db:push` | Sync the Prisma schema to the dev database |

> A `turbo.json` is included for environments where Turborepo's binary runs; the
> root scripts use pnpm's recursive runner so they work everywhere.

---

## Tech notes

- **pnpm uses the hoisted node-linker** (`pnpm-workspace.yaml`) so Expo/Metro can
  resolve transitive deps. Web and mobile share a single React (18.3.1) so the
  flat layout stays conflict-free.
- **`@promptgenius/core` is isomorphic** (no `@anthropic-ai/sdk`, no React) so both
  web and mobile import it safely; the live Claude call lives only in
  `apps/web/src/lib/engine.server.ts`.
- **Streaming**: `/api/generate` streams markdown; the client parses it into the
  structured 6-part prompt with `parseGeneratedMarkdown` (tolerant of drift).
