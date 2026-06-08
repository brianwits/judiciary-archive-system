# Builder Log

## Files created
| Path | Purpose |
| `supabase/migrations/20260602000001_query_performance_indexes.sql` | Indexes + optimized RPCs |
| `factory/*.md` | Factory run artifacts |

## Files modified
| Path | Change |
| `src/lib/data/supabase-queries.ts` | RPC archive fetch, case-scoped audit RPC |
| `src/lib/data/index.ts` | Cached audit logs, `getAuditLogsForCase` |
| `src/lib/data/cache-tags.ts` | `audit` tag |
| `src/contracts/archive.ts` | RPC row DTO |
| `src/types/database.ts` | RPC types |
| `src/app/(app)/cases/[id]/page.tsx` | Scoped audit query |
| `src/app/actions/*.ts` | Audit cache invalidation |

## DB changes applied — migration pending deploy via `supabase db push`

## Tests written — none (no test runner configured)

## Lint/type errors resolved — pending verification run

## Anything deferred — dashboard query consolidation (already cached 120s)
