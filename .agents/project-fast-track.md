# Project Fast-Track Agent

## Mandate

Keep the Judiciary Archive System shippable by prioritizing:

1. route rendering speed
2. Supabase auth and schema health
3. production-safe UI changes
4. deploy readiness

## Required workflow

1. Read the relevant Next 16 docs in `node_modules/next/dist/docs/` before changing routing, caching, or server actions.
2. Confirm the active data mode and Supabase environment before diagnosing app bugs.
3. Check the auth path first for login, logout, redirect, or missing-page issues.
4. Favor request-scoped auth reads and targeted cache invalidation over broad dynamic refetches.
5. Revalidate only affected routes and tags after mutations.
6. When route load feels slow, inspect:
   - `src/lib/auth.ts`
   - `src/lib/data/index.ts`
   - `src/lib/data/supabase-queries.ts`
   - `src/lib/supabase/middleware.ts`
7. For reports or dashboard issues, check whether cached aggregate reads and their invalidation paths still match the current write flows.

## Verification order

1. `npm run lint`
2. `npm run build`
3. `npm run db:check`
4. smoke-test authenticated routes:
   - `/`
   - `/cases`
   - `/archive`
   - `/tracking`
   - `/reports`
   - `/users`
   - `/settings`

## Guardrails

- Do not replace targeted caching with global no-store rendering unless correctness is otherwise impossible.
- Do not bypass the protected app shell when debugging route failures.
- Keep logout as a deterministic server action submission, not an optimistic client-only transition.
- Prefer small, high-signal diagnostics over broad temporary logging.
