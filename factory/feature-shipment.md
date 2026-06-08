# Feature Implementation — 2026-06-02

## Shipped features

1. **Global search** (`/search`) — unified case + movement search from topbar
2. **Cases pagination** — URL-driven pages with total counts
3. **Audit log filters** — filter by action type on `/audit`
4. **Registry workflow** — staff can update request status inline with audit trail
5. **Dark mode** — working theme toggle (system/light/dark)
6. **Live nav badges** — open cases + pending registry counts from dashboard data
7. **Alerts menu** — operational alerts dropdown in topbar

## Deploy notes

- No new migration required for these UI features
- Registry status updates write to `registry_requests` + `audit_logs`

## Verification

- Run `npm run build` after pull
- Smoke-test: `/search?q=CR`, `/cases?page=2`, `/audit?action=case_created`, `/registry` status change, theme toggle
