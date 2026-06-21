# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptGenius AI is a commercial SaaS prompt-generator product: a live-AI engine that generates high-quality structured prompts via Claude, bundled with a modern marketing site, a full web app (with auth, dashboard, pricing, billing), and a native mobile app. All features run end-to-end **today with zero external accounts** via deterministic mocks; real integration keys (Anthropic, Clerk, Stripe) are optional and drop in via environment variables.

---

## Architecture: The Big Picture

### Monorepo Layout (pnpm workspaces + Turborepo)

```
PromptGenius AI/
├─ apps/web/        Next.js 15 App Router — landing page + SaaS dashboard + API routes
├─ apps/mobile/     Expo (React Native) — thin client of the same web API
└─ packages/core/   @promptgenius/core — isomorphic TypeScript engine (types, logic, mocks)
```

**Critical constraint:** pnpm uses `nodeLinker: hoisted` mode (not isolated) because Expo's Metro bundler cannot traverse pnpm's nested dependency tree to resolve transitive packages. This flattens all deps into one `node_modules`. Both web and mobile use **unified React 18.3.1** (Expo/RN 0.76 requirement; Next.js 15 supports it) to avoid type conflicts under the flat layout.

### The Three Tiers

1. **`packages/core`** — No React, no `@anthropic-ai/sdk`, no native deps. Safe to import from both web and mobile.
   - **Types:** GenerationInput, GeneratedPrompt, Bundle, Tier, IndustryFramework
   - **System prompts:** Base Claude system prompt for generation + bundle generation
   - **Frameworks:** 12 industries mapped to proven structures (AIDA/PAS for Marketing, SOAP for Healthcare, SWOT for Business, etc.)
   - **Tiers & gating:** Feature definitions, quotas, pricing; server-side enforcement of access rules
   - **Generation engine:** Deterministic mock (offline mode) + real Claude call (live mode)
   - **Parsing:** Markdown → 6-part prompt (title, use-case description, copy-paste prompt, customization variables, example output, optimization tips)

2. **`apps/web`** — Next.js 15 App Router. API routes call Claude and manage billing/auth.
   - Landing page (hero, features, live demo, pricing, Framer Motion)
   - SaaS dashboard (filters, streaming generation, saved/favorited library, prompt editor, bundle generator)
   - Pricing page with 3-tier display and annual toggle
   - API routes: `/api/generate` (streams), `/api/bundles` (structured output), `/api/prompts` CRUD, `/api/checkout` + Stripe webhooks
   - Middleware: Clerk auth (with demo-user fallback when no keys)
   - Persistence: Prisma + PostgreSQL (Neon); no DB configured falls back to an in-memory demo store

3. **`apps/mobile`** — Expo app with tab navigation (Generate, Library, Pricing, Profile).
   - Calls web API routes (`EXPO_PUBLIC_API_URL`); offline mock fallback
   - Clerk auth (with demo-user fallback)
   - NativeWind styling for visual consistency with web

### The Mock-First Design

Every integration point has a graceful fallback:
- **No `ANTHROPIC_API_KEY`?** Generate deterministic sample prompts (no API calls).
- **No Clerk keys?** Single "demo" user, no actual auth flow.
- **No Stripe keys?** Tier upgrades flip the tier directly in Prisma (no charge).
- **No `DATABASE_URL`?** Use an in-memory demo store (see `persistenceEnabled` in `apps/web/src/lib/env.server.ts`). A `postgresql://` URL switches on real Prisma persistence.

This lets the product run end-to-end immediately for testing, demos, and CI/CD. Production integration keys are optional overlays.

### Server-Side Gating (the SaaS backbone)

Feature access is enforced in `packages/core/src/gating.ts`, not in the UI:
- **quotaStatus()** — checks if user has remaining generations for their tier
- **canUseOutputType()** — Starter can only use simple prompts; Pro+ unlocks advanced
- **canUseBundleGenerator()** — Professional tier only
- **evaluateGeneration()** — blocks over-quota requests before Claude call

The API routes check tier before processing requests. The UI reads tier and displays contextual upgrade CTAs, but the server is the source of truth.

### Streaming Generation API

`POST /api/generate` returns Server-Sent Events (SSE) with streaming markdown. Client parses it with `parseGeneratedMarkdown()` (tolerant of drift) into the 6-part prompt structure. This gives users real-time feedback and avoids timeout issues with long Claude completions.

### Structured Outputs for Bundles

`POST /api/bundles` uses Anthropic SDK's `output_config.format` with a JSON schema to generate a deterministic 3-tier bundle object (the same tier definitions from core, fully structured and validated by Claude).

---

## Commands

### Development

| Command | What it does |
|---------|-------------|
| `pnpm install` | Install all dependencies (do this first after cloning) |
| `pnpm core:build` | Build `@promptgenius/core` once (needed before running web/mobile) |
| `pnpm web` | Start web dev server at http://localhost:3000 (builds core first) |
| `pnpm mobile` | Start Expo dev server (builds core first; open in Expo Go or simulator) |
| `pnpm --filter web dev` | Dev web without rebuilding core (faster iteration if core didn't change) |
| `pnpm db:push` | Sync Prisma schema to the Postgres DB (`DATABASE_URL`/`DIRECT_URL` must be set) |

### Build & Test

| Command | What it does |
|---------|-------------|
| `pnpm build` | Build all packages (web, mobile, core) in topological order |
| `pnpm test` | Run unit tests (core package only) |
| `pnpm test -- --testNamePattern="promptName"` | Run a single test by name pattern |
| `pnpm typecheck` | Typecheck all packages (Next.js + mobile + core) |
| `pnpm lint` | Lint all packages |

### Environment Setup

1. **Local dev (no integration keys):** Just `pnpm install && pnpm core:build && pnpm web`. Entire product works in mock mode.

2. **With real integrations:** Copy `.env.example` → `.env` (root) and `apps/web/.env.local`, then fill in:
   - `ANTHROPIC_API_KEY` — live Claude calls instead of mocks
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — real auth instead of demo user
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs — real billing
   - `DATABASE_URL` — Postgres connection string for production

---

## Key Files by Purpose

### Core Logic

| Path | Purpose |
|------|---------|
| `packages/core/src/types.ts` | All domain types (GenerationInput, GeneratedPrompt, Bundle, Tier, etc.) |
| `packages/core/src/gating.ts` | Feature access rules per tier (the SaaS enforcement engine) |
| `packages/core/src/frameworks.ts` | Industry → framework mapping (12 industries, AIDA/SOAP/SWOT/etc.) |
| `packages/core/src/tiers.ts` | Tier definitions with pricing, quotas, feature list, upsell copy |
| `packages/core/src/generation.ts` | Base system prompt, parsing logic, deterministic mock |
| `packages/core/src/bundles.ts` | Bundle generation system prompt, JSON schema, mock bundles |

### Web API & Backend

| Path | Purpose |
|------|---------|
| `apps/web/src/lib/engine.server.ts` | Streaming Claude calls and mock fallback (server-only) |
| `apps/web/src/lib/user.ts` | getCurrentUser(), incrementUsage(), setUserTier() |
| `apps/web/src/lib/db.ts` | Prisma singleton |
| `apps/web/src/lib/flags.ts` | Feature flags (authEnabled, billingEnabled) |
| `apps/web/src/app/api/generate` | `POST /api/generate` — streams GeneratedPrompt |
| `apps/web/src/app/api/bundles` | `POST /api/bundles` — structured output bundle generation |
| `apps/web/src/app/api/prompts` | `GET/POST /api/prompts` — CRUD saved prompts |
| `apps/web/src/app/api/checkout` | `POST /api/checkout` — Stripe Checkout or mock upgrade |
| `apps/web/src/app/api/webhooks/stripe` | Stripe subscription events, updates tier in DB |

### Web Frontend

| Path | Purpose |
|------|---------|
| `apps/web/src/app/(marketing)/page.tsx` | Landing page with hero, features, pricing, CTA |
| `apps/web/src/app/dashboard/page.tsx` | Dashboard server component (loads user, prompts, tier) |
| `apps/web/src/app/(app)/dashboard/dashboard-client.tsx` | Main SaaS UI (filters, streaming generation, library, bundles) |
| `apps/web/src/app/pricing/page.tsx` | Pricing page with 3 tiers, annual toggle |
| `apps/web/src/components/hero-demo.tsx` | Interactive in-browser demo (uses mock prompts) |
| `apps/web/src/components/prompt-view.tsx` | Renders 6-part prompt read-only |

### Mobile

| Path | Purpose |
|------|---------|
| `apps/mobile/src/app/(tabs)/_layout.tsx` | Tab navigator (Generate, Library, Pricing, Profile) |
| `apps/mobile/src/app/(tabs)/index.tsx` | Generate screen (filters, button, PromptCard) |
| `apps/mobile/src/api.ts` | Fetch wrapper over web API (getMe, generate, listPrompts, etc.) with mock fallbacks |
| `apps/mobile/src/theme.ts` | Color palette, spacing, radius (matching web) |

### Config & Schema

| Path | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | **nodeLinker: hoisted** (critical for Expo/Metro) |
| `packages/core/tsconfig.json` | Isomorphic: no decorators, no ES2020+ (web/mobile compat) |
| `apps/web/prisma/schema.prisma` | User, SavedPrompt, subscription tier schema |
| `.env.example` | All placeholders documented |

---

## Common Patterns & Decisions

### Why Isomorphic Core?

The core package has **zero platform-specific imports**:
- No `@anthropic-ai/sdk` (only in web's `engine.server.ts`)
- No React
- No native modules

This lets mobile import `packages/core` safely. When mobile needs to call Claude, it calls the web API instead (`EXPO_PUBLIC_API_URL`).

### Why Hoisted Node Linker?

Expo's Metro bundler doesn't understand pnpm's nested dependency isolation. It needs transitive packages like `@expo/metro-runtime` to be flat in `node_modules`. The trade-off: risk of type mismatches across web/mobile. Solution: unified React 18.3.1 everywhere.

### Streaming vs. Structured Output

- **Streaming (`/api/generate`):** For user-facing generation (UX feedback, no timeout). Client parses markdown into the 6-part structure.
- **Structured output (`/api/bundles`):** For bundles (JSON schema enforced by Claude). Returns fully validated, deterministic tier objects.

### Feature Gating in Depth

Quotas and features are **tier-based**, not user-based:
- **Starter (free):** 5 generations/month, simple prompts only, no bundles
- **Professional ($29/mo):** 100 generations/month, advanced prompts, bundle generator
- **Enterprise ($199/mo):** Unlimited, workflows, API access, priority effort

The gating layer (`packages/core/src/gating.ts`) is a black box to the UI. The UI calls `canUseBundleGenerator(tier)` and gets true/false. The API enforces the same rules before touching Claude.

### Auth in Mock Mode

When no Clerk keys are present, the system creates a single "demo" user on first request. All subsequent requests are scoped to that user. This lets you demo the full SaaS experience locally without signing up anywhere.

### Testing

Core package has 11 unit tests covering:
- Prompt generation (mock mode)
- Bundle generation (mock mode)
- Markdown parsing (6-part extraction with tolerance)
- Gating logic (quota checking, output type validation)

Run with `pnpm test` or a specific test with `pnpm test -- --testNamePattern="generatePrompt"`.

---

## Troubleshooting

### Expo/Metro Can't Resolve @expo/metro-runtime

**Cause:** pnpm linker is not hoisted.
**Fix:** Ensure `nodeLinker: hoisted` in `pnpm-workspace.yaml`.

### React Type Mismatch Between Web and Mobile

**Cause:** Different React versions installed (e.g., web has React 19, mobile pinned to 18).
**Fix:** Both must use React 18.3.1. Check `apps/web/package.json` and `apps/mobile/package.json` have the same `"react": "18.3.1"`.

### Web API Returns 401 Unauthorized

**Cause:** Middleware expects Clerk auth but no keys are set.
**Fix:** Make sure the middleware has fallback logic. Verify `flags.ts` reports `authEnabled: false` when no Clerk keys. The middleware should skip auth check in mock mode.

### Bundle Generation Returns Error

**Cause:** Likely quota exceeded or user tier doesn't have bundle access.
**Fix:** Check `gating.ts` — call `canUseBundleGenerator(tier)` and verify the user's tier is Professional or Enterprise.

---

## What Was Locked In

These architectural decisions are **load-bearing**. Changes require wide review:

1. **Isomorphic core** — Core cannot import from web/mobile or add platform-specific code.
2. **Hoisted node-linker** — Changing back to isolated breaks Expo.
3. **React 18.3.1 unified** — Changing either web or mobile's React version breaks type alignment.
4. **Server-side gating** — The UI can suggest features, but the API enforces access. Do not move gating logic to the client.
5. **Mock fallbacks everywhere** — Every integration point must have a graceful offline/no-keys mode for the product to run end-to-end.

---

## Next Steps for New Code

- **Adding a new tier feature?** Update `packages/core/src/tiers.ts` first, then add gating rule in `gating.ts`, then UI CTAs.
- **Adding a new industry framework?** Update `packages/core/src/frameworks.ts` and test the generation system prompt with mock prompts.
- **Modifying the 6-part prompt structure?** Update `packages/core/src/generation.ts` (system prompt and `parseGeneratedMarkdown`), test with `pnpm test`, then update UI in `prompt-view.tsx`.
- **Adding a new API route?** Implement in `apps/web/src/app/api/`, call it from mobile's `api.ts` wrapper, provide mock fallback.
- **Changing the database schema?** Update `apps/web/prisma/schema.prisma`, run `pnpm db:push`, then update API routes that touch the schema.
