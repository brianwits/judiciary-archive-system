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

---

## Session summary — 2026-07-10

### Family/FAM case type removed + dropdowns to names only

**Core taxonomy**
- Removed `"Family"` from `CASE_FAMILIES`, `CASE_TYPES`, `COURT_DIVISIONS`
- Removed 6 Family case type definitions (IDs 22, 23, 25, 26, 62, 108)
- Renamed `HCFP&A` → `"High Court Probate and Administration"`
- Added ELC court group (IDs 401, 402, 403, 405) to case form, reports, taxonomy breakdown
- Changed all case-type dropdowns to show name only (`caseType`) instead of code + name (`fullLabel`)

**Type system, lib layer, seed data**
- Removed `CASE_FAMILIES`, `"Family Division"` from `COURT_DIVISIONS`
- Removed `caseFamily` from `CaseFilters`, `ReportFilters`, DTO schemas, form input types
- Removed `FAM` prefix from `inferCaseType`; updated `legacyCaseTypeForFamily` (Children & Protection → Civil)
- Removed Family from case-category mappings, case-filtering, supabase-queries, actions
- Removed `FAM/089/2025` case, movement, registry request from seed data
- Renamed Room C → `"Succession Cases"`; removed `HC_FAMILY` / Family from dashboard stats
- Removed `familyStats` from `ReportData`, `family` from `caseTypeStats`

**UI Components**
- Removed Family column from cases table and search results
- Removed Family filter from case-filters, report-filters
- Removed Family detail from case detail page, archive storage, scanning console
- Removed `familyStats` section from taxonomy breakdown report

**3 caseFamily field fixes**
- Fixed missing `caseFamily` in `archive.ts` (`caseRowToArchiveStoredCase` + `archiveStoredCaseRpcRowToDto`)
- Fixed missing `caseFamily` in `mock-store.ts` (`getArchiveStoredCases`)

**Tests**
- Updated authoritative-case-types: 67 total (33 Magistrate, 30 High Court, 4 ELC)
- Updated case-category, case-filtering, reports-parsing tests
- All 283 vitest tests passing

**Production migration**
- Created `supabase/migrations/20260710000000_deactivate_family_case_types.sql`
- Deactivated IDs 22, 23, 25, 26, 62, 108 in production (`active = false`)
- Verified: 0 production cases affected by cleanup

**Build**
- `npx next build`: pass, no type errors
- All routes compiled: static `/login`, dynamic `/audit`, `/cases`, `/cases/[id]`, `/cases/new`, `/registry`, `/reports`, `/scanning`, `/search`, `/settings`, `/tracking`, `/users`

**Git**
- Commit `3d4d9a2`: 44 files changed (37 modified + 1 deleted + 6 new)

**E2E Playwright config fixes**
- Fixed `baseURL` from `127.0.0.1:3000` → `localhost:3000` in both `e2e/playwright-no-ws.config.ts` and `e2e/playwright.config.ts`
- Added `webServer` config to `playwright-no-ws.config.ts` for auto server lifecycle management
- Login-flow tests: 10 passed, 1 pre-existing warmup timeout (matches baseline)
