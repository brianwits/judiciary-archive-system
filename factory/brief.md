# Strategic Brief

## Goal — Cut database latency 30–50% by indexing hot columns and eliminating over-fetch/N+1 patterns in case, archive, and audit log reads.

## Audience — Registry clerks, archivists, and admins loading `/cases`, `/cases/[id]`, `/archive`, `/audit`, and dashboard aggregates.

## Source inputs — `supabase/migrations/*`, `src/lib/data/supabase-queries.ts`, `src/lib/data/index.ts`

## Public route changes — none (performance-only)

## Internal artifact changes
- New migration `20260602000001_query_performance_indexes.sql`
- Query layer + case detail audit fetch
- Cached audit log reads

## Non-goals
- UI redesign
- New features
- Auth/RLS changes
- E2E test suite

## Success criteria
- [ ] Migration adds indexes on `cases.status`, `cases.created_at`, `cases.location_id`, `profiles.role`, `audit_logs.entity_id`
- [ ] Archive inventory uses single RPC round-trip (not 3 queries)
- [ ] Case detail loads case-scoped audit logs (not full table + JS filter)
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes

## Risk register
| Risk | Likelihood | Impact | Mitigation |
| Index creation lock on large tables | Low | Medium | `IF NOT EXISTS`, additive only |
| RPC path regression | Low | Medium | Recursive CTE builds all paths once |
| Stale audit cache | Low | Low | `revalidateTag(CACHE_TAGS.audit)` on writes |

## Agent sequencing notes — Strategist → Scraper → Architect → Builder → QA (gates bypassed per user request)
