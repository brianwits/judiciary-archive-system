# Judiciary Archive & Court File Management System

Production-ready web application for managing physical and digital court files, registry workflows, archive storage, file movement tracking, scanning, audit logs, and role-based access control.

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Supabase**, **React Hook Form**, **Zod**, **TanStack Table**, and **Recharts**.

## Features

### Core modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | ERP-style KPIs, archive map, movements, notices |
| Active Cases | `/cases` | Search, filter, create, edit case files |
| Archive Storage | `/archive` | Room occupancy map, location hierarchy |
| File Tracking | `/tracking` | Check-out/in, chain of custody |
| Registry Operations | `/registry` | Registry request queue |
| Digital Scanning | `/scanning` | Document upload with categories |
| Reports | `/reports` | Analytics charts (Recharts) |
| Audit Logs | `/audit` | System activity trail |
| User Management | `/users` | Roles and user administration |
| Settings | `/settings` | Profile and preferences |

### Roles

- **Admin** — Full access
- **ICT Officer** — System admin, audit, uploads
- **Registry Clerk** — Cases, registry, movements
- **Archivist** — Archive storage, movements, uploads
- **Deputy Registrar** — Approvals, audit, registry
- **Judge** — View cases, file movements

## Quick start (mock data mode)

1. **Install dependencies**

   ```bash
   npm install
   ```

   **Troubleshooting (Tailwind / `lightningcss` build error):** If `next build` fails with `Cannot find module '../lightningcss.linux-...'` (or similar), `node_modules` was almost certainly produced on a **different OS or CPU** (for example Windows vs WSL/Linux). Delete `node_modules` and reinstall on the machine where you run Node:

   ```bash
   rm -rf node_modules && npm install
   ```

   Use `npm ci` if you rely on `package-lock.json` for reproducible installs.

   **Windows: “Failed to load SWC binary for win32/x64”:** Next installs the **`@next/swc-win32-x64-msvc`** binary as an **optional dependency**. If that package is missing, `next build` will fail immediately. Usually this means installs were done with **`--omit=optional`**, **`npm install --production`**, or a broken `node_modules`. Fix:

   ```bash
   rm -rf node_modules
   npm install
   ```

   Prefer a Node version that matches Next 16 (recent **LTS**). If binaries are still missing, run **`npm rebuild`** or check **`npm ls @next/swc-win32-x64-msvc`** to confirm it is linked. Developing under **WSL** with Linux `node_modules` is also valid (`npm install` inside WSL, not on `node_modules` copied from Windows).

2. **Environment**

   Copy `.env.example` to `.env.local`:

   ```env
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```

   Production builds (`npm run build`, `NODE_ENV=production`) **force mock mode off in code** regardless of this variable, so demo auth never runs in production deployments.

3. **Run**

   ```bash
   npm run dev
   ```

4. **Sign in** at [http://localhost:3000/login](http://localhost:3000/login)

   - Select any demo user from the dropdown
   - Password: `demo1234`

   **Supabase troubleshooting:** If Auth accepts your password but you are bounced back to login with **“Account not linked to staff profiles”**, your user exists in `auth.users` but not in `public.profiles`. Run **`npm run db:seed-users`** (with `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` per [`.env.example`](.env.example)) or apply pending migrations—including any **profile backfill** migration—and try again.

## Supabase MCP (Cursor)

This repo ships a Cursor MCP preset at [.cursor/mcp.json](.cursor/mcp.json) so your agent can talk to Supabase (list tables, run read-only SQL, search docs, etc.) via the [hosted Supabase MCP server](https://supabase.com/docs/guides/ai-tools/mcp).

1. **Replace the project ref** in `url` inside `.cursor/mcp.json`: use the same **Project ID / ref** as in your dashboard URL (`https://supabase.com/dashboard/project/<ref>`) — it matches the hostname in `https://<ref>.supabase.co`.
2. **Defaults:** `read_only=true` is set — remove it only if you truly need mutating MCP tools (migrations, deploys, writes). Prefer a **dev project**, not production.
3. In **Cursor**, open **Cursor Settings → Tools & MCP**. Add or refresh the Supabase MCP entry if needed — you will be prompted to **sign in to Supabase** (OAuth); no personal access token is required for hosted MCP in Cursor.
4. **Local CLI:** when `npm run db:start` is running, you can alternatively point MCP at `http://127.0.0.1:54321/mcp` ([docs](https://supabase.com/docs/guides/ai-tools/mcp)); that server exposes a subset of tools and does not use the same OAuth flow.

You can tighten scope with URL query params (`features=database,docs`, etc.) — see [Supabase MCP options](https://github.com/supabase-community/supabase-mcp#options).

### Vercel MCP (same workspace)

The repo also includes **Vercel** remote MCP in [.cursor/mcp.json](.cursor/mcp.json) using the [documented](https://vercel.com/docs/agent-resources/vercel-mcp) `url`-only entry for Cursor (no extra transport fields). After changing it, use **Cursor Settings → Tools & MCP** and complete **Needs login** for Vercel.

If the automatic config ever looks wrong, run from the project root:

```bash
npm run mcp:add-vercel
```

That uses Vercel’s [`add-mcp`](https://vercel.com/docs/agent-resources/vercel-mcp) helper to register the server for detected agents.

### MCP login troubleshooting

**General**

- Use a **current Cursor** release; OAuth redirect allowlists are updated on the provider side over time.
- Fully **quit** Cursor (not only close the window), then reopen the project so `.cursor/mcp.json` is re-read.
- In **Cursor Settings → Tools & MCP**, toggle the server **off/on** or use the control to **reconnect** and complete the browser flow again.

**Vercel — “The app redirect URL is invalid” / OAuth stops before returning to Cursor**

- This error is returned by Vercel’s authorize page when the redirect URI used by Cursor (typically `cursor://anysphere.cursor-mcp/oauth/callback`) is not yet allowed for the integration. It is **not** something you can fix in this repo’s JSON; **update Cursor** and retry, or follow [Vercel MCP / Cursor](https://vercel.com/docs/agent-resources/vercel-mcp) and community threads until the allowlist matches your client build.
- Try `npm run mcp:add-vercel` so the official installer writes the expected entry.
- Ensure your OS opens **`cursor://` links** with Cursor (default handler), or complete any **alternate “open URL” / callback** flow the client offers after authorization.

**Supabase — OAuth never completes or tools stay unauthorized**

- During login, pick the **Supabase organization** that owns the project in your `project_ref` query string.
- Regenerate a known-good URL from the dashboard: **Project → Connect → MCP** ([Supabase MCP tab](https://supabase.com/dashboard/project/_?showConnect=true&tab=mcp)) and align `project_ref` + options with [.cursor/mcp.json](.cursor/mcp.json).
- **Manual auth (no browser):** create a [personal access token](https://supabase.com/dashboard/account/tokens) and keep it **out of git**. Then either:
  - Use the [Supabase **Manual authentication** example](https://supabase.com/docs/guides/ai-tools/mcp#manual-authentication): same hosted URL with `project_ref` in the query string and an `Authorization: Bearer …` header (their docs show `${SUPABASE_ACCESS_TOKEN}` placeholders for CI); or
  - Run the **stdio** server via `npx @supabase/mcp-server-supabase` with `--read-only` and `--project-ref=<your-ref>`, and supply `SUPABASE_ACCESS_TOKEN` in the `env` block **only** through a user-local or client-managed config (for example `~/.cursor/mcp.json`), not in a committed file.

If you switch from hosted HTTP OAuth to stdio PAT, **remove** the old `supabase` server entry so Cursor does not start two competing connections.

## Supabase mode

Set `NEXT_PUBLIC_USE_MOCK_DATA=false` and configure:

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Optional (server-side admin operations only — never expose to the browser):

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Local Supabase (recommended for development)

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Start local stack and apply migrations + seed:

   ```bash
   npm run db:start
   npm run db:reset
   ```

3. Point `.env.local` at local URLs from `supabase status` output

4. Regenerate TypeScript types after schema changes:

   ```bash
   npm run db:types
   ```

### Remote Supabase (staging/production)

1. Create a Supabase project
2. Link and push migrations:

   ```bash
   npx supabase link --project-ref your-project-ref
   npm run db:push
   ```

   Or apply SQL files in order from `supabase/migrations/` via the Supabase SQL Editor.

3. Run seed data (optional):

   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```

   Or paste `supabase/seed.sql` into the SQL Editor.

### First admin user

Signing in requires a row in **`public.profiles`** for your `auth.users` id. If that row is missing, the app redirects to `/login?error=missing_profile` after a successful Auth response.

Use **publishable** and **anon** keys only in the browser and in [`createServerClient`](src/lib/supabase/server.ts); keep **[`SUPABASE_SERVICE_ROLE_KEY`](.env.example)** server-only (never `NEXT_PUBLIC_`).

**Option A — Seed all court staff (recommended for dev):**

1. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (from Supabase Dashboard → Settings → API)
2. Apply migrations: `npx supabase login && npx supabase link --project-ref <ref> && npm run db:push`
3. Seed users:

   ```bash
   npm run db:seed-users
   ```

   Creates the courts.go.ke demo roster (`demo1234`) plus **QA users** on `@court.go.ke` (including alias addresses like `admin@court.go.ke`) with password `court1234` (see table below).

**Validate connectivity (hosted + keys in `.env.local`):**

```bash
npm run db:check
```

**Option B — Manual single admin:**

1. Create a user in Supabase Auth (Dashboard → Authentication → Users → Add user)
2. Promote role using [`supabase/scripts/promote-admin.sql`](supabase/scripts/promote-admin.sql) in the SQL Editor (update the email in the script first):

   ```sql
   UPDATE public.profiles SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@example.com' LIMIT 1);
   ```

3. Sign in at `/login` with that user's email and password

After schema changes, regenerate types: `npm run db:types`.

#### Hosted QA test users (`@court.go.ke`)

After `npm run db:seed-users`, these integration-test accounts exist (same script as courts.go.ke roster). **Password:** `court1234` (synced on each seed run for accounts that already exist).

| Login email | Role (app) |
|-------------|------------|
| `brian.mugendi@court.go.ke` | admin |
| `admin@court.go.ke` | admin |
| `samuel.maina@court.go.ke` | admin |
| `rita.otieno@court.go.ke` | registry_clerk |
| `paul.kamau@court.go.ke` | judge |

Prefer these on Vercel when `demo1234` does not apply or roster emails were never created.

### Users database

Court staff are stored in two linked tables:

- `auth.users` — Supabase Auth (email, password)
- `public.profiles` — court metadata (name, PJ number, department, role, `is_active`)

New signups auto-create a profile via the `handle_new_user` trigger (default role: `judge`).

### Court roles (database)

Profiles use the `court_user_role` enum:

| Role | Database value |
|------|----------------|
| Admin | `admin` |
| ICT Officer | `ict_officer` |
| Registry Clerk | `registry_clerk` |
| Archivist | `archivist` |
| Deputy Registrar | `deputy_registrar` |
| Judge | `judge` |

New auth users default to `judge` (read-heavy access). Admins promote roles via **User Management**.

### Production database notes

- Enable [Supavisor connection pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler) for serverless (Vercel) deployments
- Migrations are forward-only — apply in timestamp order, never edit applied files
- `audit_logs` is append-only; plan retention/archival for long-running deployments
- **Audit writes:** After migration `20260529000002_audit_logs_insert_service_only`, `authenticated` JWTs can no longer `INSERT` into `audit_logs` (prevents trivial log forgery via PostgREST). The app records audit rows with the **service role** (`SUPABASE_SERVICE_ROLE_KEY` on the server). Ensure that key is set wherever Server Actions run.
- **Storage (`case-documents` bucket):** Treat the bucket as **private**. Reads should go through **short-lived signed URLs** (the app uses `createSignedUrl` with a 60s TTL). In the Supabase Dashboard, confirm **no public anonymous read** on this bucket; `npm run db:setup-hosted` applies storage policies when you use that path.

### Vercel deployment

The Vercel project (`judiciary-archive-system`) connects to hosted Supabase project `zjzqogrrlvxavxicdcec`. Migrations are **not** applied during the Vercel build — run them separately before or after the first deploy.

#### 1. Prepare hosted Supabase (one-time)

```bash
# Create a personal access token: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN=your-access-token

npm run db:setup-hosted
```

This script links the project, runs `db push`, configures Auth redirect URLs for Vercel, applies `seed.sql` + storage policies, and seeds 6 court staff (`demo1234`).

Then configure Vercel env vars and redeploy:

```bash
npm run vercel:configure-supabase   # sets Vercel env + updates .env.local
vercel --prod
```

#### 2. Environment variables (Vercel)

Set for **Production** and **Development** (Preview: add in Vercel dashboard — CLI may prompt for a Git branch):

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_USE_MOCK_DATA` | `false` | Disables mock auth/data |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zjzqogrrlvxavxicdcec.supabase.co` | Browser-safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | From Supabase → Settings → API | Browser-safe |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API | **Server-only** — User Management emails, `db:seed-users` |

CLI example (production):

```bash
vercel env update NEXT_PUBLIC_USE_MOCK_DATA production --yes --value "false"
vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes --force --value "https://zjzqogrrlvxavxicdcec.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production --yes --force --value "<publishable-key>"
vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes --force --value "<service-role-key>"
```

Pull env locally for dev parity:

```bash
vercel env pull .env.local
```

#### 3. Supabase Auth redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://judiciary-archive-system.vercel.app` |
| Redirect URLs | `https://judiciary-archive-system.vercel.app/**`, `https://judiciary-archive-system-*.vercel.app/**`, `https://*.vercel.app/**`, `http://localhost:3000/**` |

Or run `npm run vercel:configure-supabase` with `SUPABASE_ACCESS_TOKEN` set — it PATCHes these via the Management API.

#### 4. Deploy and verify

```bash
vercel --prod
```

Verify on `https://judiciary-archive-system.vercel.app`:

1. `/login` — no demo user dropdown (mock mode off)
2. Sign in with a QA account: `admin@court.go.ke` / `court1234`, `brian.mugendi@court.go.ke` / `court1234`, or `samuel.maina@court.go.ke` / `court1234` (or `brian.mugendi@courts.go.ke` / `demo1234` if that roster was seeded)
3. Dashboard loads live KPIs from Supabase
4. `/users` lists staff with emails (requires `SUPABASE_SERVICE_ROLE_KEY` on Vercel)

Do **not** prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`.

## Design system

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#013220` | Sidebar, topbar |
| Secondary | `#014D3A` | Active nav |
| Accent | `#C9A227` | Highlights, badges |
| Background | `#F5F4EF` | Main workspace |
| Success | `#047857` | Available status |
| Warning | `#B45309` | Near-full status |
| Danger | `#B91C1C` | Missing, overdue |

## Archive code format

```
COURT-CASE_TYPE-YEAR-CASE_NO
```

Example: `KBT-ELC-2023-E018`

## Optional: n8n webhooks

Set `N8N_FILE_MOVEMENT_WEBHOOK_URL` to receive file movement events from `src/lib/webhooks/n8n.ts`.

## Contracts-first boundaries

The current internal API is the Next.js server-action layer, not public REST route
handlers. Shared request, response, error, filtering, and DTO contracts live in
`src/contracts/`. Expected mutation failures use a consistent
`{ ok: false, error: { code, message, fieldErrors? } }` envelope. Future public
REST APIs should be versioned under `/api/v1` and reuse the same contracts.

## Project structure

```
src/
  app/(app)/          # Authenticated routes
  app/login/          # Login page
  app/actions/        # Server actions
  components/
    layout/           # Sidebar, topbar, shell
    dashboard/        # Dashboard widgets
    cases/            # Case management
    archive/          # Storage map
    tracking/         # File movements
    scanning/         # Document repository
    reports/          # Charts
    audit/            # Audit logs
    shared/           # Reusable UI
  data/seed/          # Mock seed data
  lib/
    data/             # Repository layer
    auth.ts           # RBAC helpers
    webhooks/         # n8n integration
  types/              # Domain types
supabase/migrations/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:start` | Start local Supabase stack |
| `npm run db:stop` | Stop local Supabase stack |
| `npm run db:reset` | Reset local DB (migrations + seed) |
| `npm run db:migrate` | Apply pending migrations locally |
| `npm run db:push` | Push migrations to linked remote project |
| `npm run db:setup-hosted` | Link hosted Supabase, push migrations, seed SQL, seed users |
| `npm run db:seed-users` | Create 6 court staff in Supabase Auth + profiles |
| `npm run vercel:configure-supabase` | Set Vercel Supabase env vars + Auth redirect URLs |
| `npm run db:types` | Regenerate `src/types/database.ts` from local schema |

## Demo users

| Name | Role | Email |
|------|------|-------|
| Brian Mugendi | Admin | brian.mugendi@courts.go.ke |
| Mary Wanjiku | ICT Officer | mary.wanjiku@courts.go.ke |
| Peter Ochieng | Registry Clerk | peter.ochieng@courts.go.ke |
| Grace Akinyi | Archivist | grace.akinyi@courts.go.ke |
| David Mutua | Deputy Registrar | david.mutua@courts.go.ke |
| Hon. Justice Njeri | Judge | j.njeri@courts.go.ke |
