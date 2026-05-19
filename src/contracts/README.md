# Contracts-first interface guide

This app currently uses Next.js server actions as its internal API boundary.
Contracts live in this folder so pages, components, actions, mock data, and
Supabase adapters share the same request, response, and error vocabulary.

## Current internal API

- Mutations return `ActionResult<T>`.
- Expected failures return `{ ok: false, error: { code, message, fieldErrors? } }`.
- Successful actions return `{ ok: true, data }`; redirecting actions may not return.
- UI-facing data uses camelCase DTOs. Supabase snake_case rows are adapted before
  they reach components.
- List queries use `q`, `page`, `pageSize`, `sort`, and named filter keys.

## Future REST API convention

Expose external endpoints under `/api/v1` only when an external consumer exists.
Route handlers should use these same schemas.

- Success envelope: `{ data, meta? }`
- Error envelope: `{ error: { code, message, fieldErrors?, requestId? } }`
- Pagination defaults: `page=1`, `pageSize=25`, max `pageSize=100`
- Sort format: `field:asc` or `field:desc`
- Filtering: stable camelCase query keys matching DTO fields
