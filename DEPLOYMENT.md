# Deployment Guide

PromptGenius AI runs in two modes, decided automatically by environment variables:

- **Demo mode (default, zero setup):** No `DATABASE_URL` → users, prompts, and
  tiers live in an in-memory store. Everything works end-to-end but does not
  persist across server restarts. This is how the public Vercel deploy runs today.
- **Production mode:** A PostgreSQL `DATABASE_URL` is set → real persistence.

This guide takes you from demo mode to a real, persistent, publicly-reachable SaaS.

---

## 1. Make the site publicly reachable (required)

By default Vercel puts the whole project behind a login wall (you'll see HTTP 401
for anyone but you).

1. Vercel Dashboard → **promptgenius-ai** → **Settings** → **Deployment Protection**
2. Set **Vercel Authentication** to **Disabled** (or "Only Preview Deployments"
   if you want previews protected but production public).
3. Save. The production URL is now public.

---

## 2. Provision a PostgreSQL database (Neon)

We use **Neon** — serverless Postgres with autoscaling, scale-to-zero, and the
tightest Vercel integration.

### Option A — Vercel-native (simplest)
1. Vercel Dashboard → **Storage** → **Create Database** → **Neon** (Marketplace).
2. Connect it to the `promptgenius-ai` project. Vercel injects the connection
   strings into the project's environment automatically.
3. Make sure the injected pooled string is exposed as **`DATABASE_URL`** and the
   direct string as **`DIRECT_URL`** (see naming in step 3 below).

### Option B — Neon directly
1. Create a free account at https://neon.tech and a new project.
2. In the Neon dashboard → **Connection Details**, copy **two** strings:
   - **Pooled** connection (host contains `-pooler`) → `DATABASE_URL`
   - **Direct** connection (no `-pooler`) → `DIRECT_URL`

---

## 3. Set environment variables in Vercel

Vercel Dashboard → **Settings** → **Environment Variables**. Add these for the
**Production** environment (and Preview/Development if you want them there too):

| Variable        | Value                                                                                          | Required |
|-----------------|------------------------------------------------------------------------------------------------|----------|
| `DATABASE_URL`  | `postgresql://USER:PASS@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require&pgbouncer=true` | for persistence |
| `DIRECT_URL`    | `postgresql://USER:PASS@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=require`                      | for persistence |
| `NEXT_PUBLIC_APP_URL` | `https://promptgenius-ai-power-tek.vercel.app` (your prod URL)                            | recommended |

> The `&pgbouncer=true` flag on the **pooled** URL tells Prisma it's talking to a
> transaction-mode pooler — required to avoid prepared-statement errors on
> serverless. The **direct** URL (no pooler) is used only for migrations.

Optional integrations (each is independent; unset = that feature stays mocked):

| Variable | Enables |
|----------|---------|
| `ANTHROPIC_API_KEY` | Live Claude generation instead of deterministic mocks |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Real auth instead of the shared demo user |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + price IDs | Real billing instead of mock tier flips |

---

## 4. Create the database schema

Prisma needs to push the schema into the new database **once** (and after any
schema change). Run locally with the same `DATABASE_URL` + `DIRECT_URL` set:

```bash
# from repo root, with DATABASE_URL and DIRECT_URL exported (or in .env)
pnpm db:push
```

This creates the `User` and `SavedPrompt` tables. For a versioned history later,
switch to `prisma migrate deploy` with migration files.

---

## 5. Redeploy

Push to `master` (auto-deploys) or click **Redeploy** in Vercel. On boot the app
sees a `postgresql://` `DATABASE_URL`, switches out of demo mode, and persists
real data.

### Verify
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<your-prod-url>/            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<your-prod-url>/dashboard   # 200
curl -s https://<your-prod-url>/api/me                                       # demo or real user JSON
```

---

## Local development

- **No database:** just `pnpm install && pnpm web`. Runs in demo mode (in-memory).
- **With persistence:** create a Neon **dev branch** (or run local Postgres), set
  `DATABASE_URL` + `DIRECT_URL` in `apps/web/.env.local`, then `pnpm db:push`.

There is no SQLite anymore — dev and prod both use Postgres, so behavior matches.

---

## Security checklist (with a real DB)

- [ ] `DATABASE_URL` / `DIRECT_URL` stored only as Vercel secrets — never committed
      (`.env*` is gitignored).
- [ ] `sslmode=require` on both connection strings (Neon enforces TLS).
- [ ] App uses the **pooled** URL; migrations use the **direct** URL.
- [ ] Point-in-time recovery / backups enabled in the Neon dashboard.
- [ ] Vercel Deployment Protection set intentionally (off for a public SaaS).
- [ ] The fail-closed `getCurrentUser` and the production `DATABASE_URL` guard in
      `apps/web/src/lib/db.ts` are left in place.
