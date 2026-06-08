# Source Inventory

## Repo stack — Next.js 16, Supabase, Tailwind 4, TypeScript

## Affected files
| Path | Type | Reason |
| `supabase/migrations/20260602000001_query_performance_indexes.sql` | migration | Indexes + RPCs |
| `src/lib/data/supabase-queries.ts` | data layer | Query fixes |
| `src/lib/data/index.ts` | cache layer | Audit caching |
| `src/lib/data/cache-tags.ts` | config | `audit` tag |
| `src/contracts/archive.ts` | DTO | RPC row mapper |
| `src/types/database.ts` | types | RPC signatures |
| `src/app/(app)/cases/[id]/page.tsx` | page | Scoped audit fetch |
| `src/app/actions/{cases,tracking,documents,scanning}.ts` | actions | Audit cache invalidation |

## UI surfaces — `/cases/[id]` audit tab, `/audit`, `/archive`, dashboard archive map

## API surfaces — Supabase RPC: `list_archive_stored_cases`, `list_audit_logs_for_case`, `search_cases`

## Database schema — existing indexes (pre-change)
- `idx_cases_status_filed (status, filed_date)`
- `idx_cases_location_id (location_id) WHERE NOT NULL`
- `idx_profiles_role (role)`
- `idx_audit_logs_created_at (created_at DESC)`
- `idx_audit_logs_user_id (user_id)`

## Env vars required
| Key | Purpose | Present |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Y |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Y |
| `SUPABASE_SERVICE_ROLE_KEY` | Cached reads | Y |

## N+1 / over-fetch findings
| Location | Pattern | Severity |
| `fetchArchiveStoredCasesFromSupabase` | 3 queries: count + all locations + cases; path built in JS | High |
| `list_archive_stored_cases` (old SQL) | `archive_location_display_path()` per row | High |
| `cases/[id]/page.tsx` | `getAuditLogs()` full table, filter in JS | Critical |
| `fetchAuditLogsFromSupabase` | 2 queries (logs + profile batch) | Acceptable |
| `fetchDashboardFromSupabase` | 12 parallel count/select queries | Acceptable (cached) |
| `fetchMovementsFromSupabase` | Join cases + batch profiles | OK |

## Dead code candidates
| File | What | Safe |
| `buildArchiveCodesPath` in supabase-queries | Removed after RPC switch | Y |
