# Repository Guidelines

## Project Structure & Module Organization
Source code lives in `src/`, with the App Router under `src/app/`, shared UI in `src/components/`, business logic in `src/lib/`, and typed contracts in `src/contracts/` and `src/types/`. Test coverage is split between unit tests in `src/__tests__/` and end-to-end tests in `e2e/`. Supabase migrations and seed data live in `supabase/migrations/` and `supabase/seed.sql`; repo notes and research docs are in `docs/`.

## Build, Test, and Development Commands
- `npm run dev`: start the Next.js dev server.
- `npm run build`: production build and type check.
- `npm run lint`: run ESLint across the codebase.
- `npm test`: run Vitest unit tests.
- `npm run test:e2e`: run Playwright end-to-end tests.
- `npm run db:check`: verify Supabase connectivity and auth data paths.
- `npm run project:fast-track`: run the main release-readiness checks in sequence.

## Coding Style & Naming Conventions
Use TypeScript throughout and the `@/` import alias for project modules. Follow the existing formatting style in the repo: 2-space indentation, semicolons, double quotes, and small focused modules. Name React components in `PascalCase`, hooks and helpers in `camelCase`, and test files with `.test.ts` or `.spec.ts` suffixes.

## Testing Guidelines
Prefer Vitest for unit and contract tests in `src/__tests__/`, and Playwright for user flows in `e2e/`. Keep tests close to the behavior they verify and name them after the feature or route, such as `case-number.test.ts` or `login-flow.spec.ts`. Run `npm test` before committing logic changes and `npm run test:e2e` for navigation, auth, or workflow changes.

## Commit & Pull Request Guidelines
Recent history uses short imperative subjects, often prefixed with `feat:` or `chore:` for scoped changes, and plain verbs for larger release batches. Keep commits focused and descriptive, for example `feat: add scanning workflow`. PRs should include a short summary, testing notes, and screenshots or screen recordings for UI changes. Link related issues or migration notes when relevant.

## Security & Configuration Tips
Keep secrets in `.env.local` and never commit Supabase keys or Vercel tokens. Before changing auth, caching, or database behavior, check `.agents/project-fast-track.md` and validate with `npm run db:check` plus the relevant route smoke test.
