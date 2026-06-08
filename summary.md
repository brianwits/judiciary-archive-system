# Session Implementation Summary

## Implemented Features

- Added a contracts-first layer for shared action results, validation, list query defaults, and domain DTO mapping.
- Standardized server action responses across auth, cases, documents, tracking, scanning, and users.
- Added shared UI primitives for async submit buttons, form errors, responsive table wrappers, and empty states.
- Added app-level loading and error surfaces for authenticated pages.
- Improved mobile navigation with a topbar sheet menu and hidden desktop sidebar on small screens.
- Added mock-session persistence so newly created demo cases remain available after redirects and page reloads.
- Migrated request handling to Next.js 16 `proxy.ts`.

## Bug Fixes And Cleanup

- Fixed mock-mode case creation redirecting to a missing detail page by persisting session-created cases.
- Fixed Base UI button/link semantics by replacing navigation `Button render={<Link />}` usage with styled `Link` components.
- Removed the TanStack Table hook from the simple cases table to eliminate the React Compiler incompatible-library warning.
- Excluded generated dev-server logs and Supabase local temp state from Git.
- Kept `.env.local`, `.next`, `node_modules`, and other local/generated artifacts out of the uploaded repository.

## Developer Experience

- Documented the contracts-first boundary in the project README and contracts README.
- Consolidated form and action response behavior around predictable `ActionResult` success/error shapes.
- Simplified the cases table implementation where a direct render was clearer than a table-state abstraction.
- Preserved existing behavior while reducing framework and design-system warnings.

## Verification

- `npm run lint` passed with zero warnings after the cases table cleanup.
- `npm run build` passed successfully.
- Browser checks passed for login, dashboard rendering, dashboard navigation, case creation, case search, expected tracking/scanning error states, authenticated page rendering, and mobile navigation.
- Runtime logs no longer show the Base UI native-button warning.

## Repository

- Created the initial Git commit: `783fb84 Initial judiciary archive system`.
- Uploaded the project to the private GitHub repository: `https://github.com/brianwits/judiciary-archive-system`.
- Configured `origin` to track `master` on GitHub.

---

## Session summary — 2026-05-25

### UI typography and visual polish

- Added [`src/lib/fonts.ts`](src/lib/fonts.ts) (`next/font/google`): Instrument Serif, DM Sans, Space Mono; wired in [`src/app/layout.tsx`](src/app/layout.tsx).
- Updated [`src/app/globals.css`](src/app/globals.css): Tailwind v4 `@theme` font stacks, tracking/shadow tokens, refined `h1–h6`, `code`, scrollbar (accent `color-mix`), focus ring, utilities (`.text-label`, `.font-display`, `.text-legal`, `.text-code`). Avoided a duplicate `.font-heading` utility so shadcn `CardTitle` keeps `text-base`.
- Polished [`PageHeader`](src/components/layout/page-header.tsx), [`AppSidebar`](src/components/layout/app-sidebar.tsx), [`AppTopbar`](src/components/layout/app-topbar.tsx) (gradients, blur, active rail, icon hover scale, pulsing notification dot).
- Dashboard [`KpiCard`](src/components/dashboard/kpi-card.tsx): gradient card, premium shadow, `.text-label`, larger icons.
- [`status-badge.tsx`](src/components/shared/status-badge.tsx): pill badges with Lucide icons and clearer semantic colors; [`users-table.tsx`](src/components/admin/users-table.tsx): `.text-label` headers.

### Tooling / build (WSL + mixed `node_modules`)

- Diagnosed **`Cannot find module '../lightningcss.linux-x64-gnu.node'`**: Windows-only optional package present while Node ran on Linux/WSL; fix is reinstall on the target OS (`rm -rf node_modules && npm ci` or `npm install`).
- Documented this in [README.md](README.md) under Quick start troubleshooting.
- Temporary MCP-style debug script was used then removed after confirmation.

### Auth clarifications

- **`demo1234`** applies only when **`NEXT_PUBLIC_USE_MOCK_DATA`** is not `false` (demo mode). Supabase mode requires real Auth users and passwords (e.g. seeded via `npm run db:seed-users` with service role, or Dashboard-created users). Supabase returns **“Invalid login credentials”** when Auth rejects email/password.

### Cursor + Supabase MCP

- Added [`.cursor/mcp.json`](.cursor/mcp.json): hosted `https://mcp.supabase.com/mcp` with placeholders `project_ref` and `read_only=true`.
- README section **“Supabase MCP (Cursor)”** and [.env.example](.env.example) comments for aligning project ref and optional CI/PAT docs.

### Verification notes

- `require('lightningcss')` succeeds after correct optional packages are installed; `npm run build` compiled successfully once the native binding issue was resolved (parallel `next build` lock can still block if multiple builds run).

### Supabase login / profiles alignment (implemented)

- Added [`src/lib/supabase/fetch-profile.ts`](src/lib/supabase/fetch-profile.ts) (`maybeSingle`) and wired [`getSessionProfile`](src/lib/auth.ts) plus [`updateSession`](src/lib/supabase/middleware.ts): **no fabricated role** when `profiles` is missing; redirect to **`/login?error=missing_profile`**; proxy **cookie `setAll`** forwards **options** to `request.cookies.set`.
- [`scripts/seed-users.mjs`](scripts/seed-users.mjs) now **`upsert`** profiles on `id`.
- Migration [`supabase/migrations/20260527000001_backfill_profiles_for_auth_users.sql`](supabase/migrations/20260527000001_backfill_profiles_for_auth_users.sql) backfills orphan `auth.users`.
- Login UI banner + README troubleshooting for missing-profile bounce; **`npm run db:types`** reminder after migrations.
