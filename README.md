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

2. **Environment**

   Copy `.env.example` to `.env.local`:

   ```env
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```

3. **Run**

   ```bash
   npm run dev
   ```

4. **Sign in** at [http://localhost:3000/login](http://localhost:3000/login)

   - Select any demo user from the dropdown
   - Password: `demo1234`

## Supabase mode

Set `NEXT_PUBLIC_USE_MOCK_DATA=false` and configure:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Apply migrations in `supabase/migrations/` via the Supabase SQL Editor or CLI.

### First admin user

1. Create user in Supabase Auth dashboard
2. Promote role:

   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
   ```

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

## Demo users

| Name | Role | Email |
|------|------|-------|
| John Kamau | Admin | john.kamau@courts.go.ke |
| Mary Wanjiku | ICT Officer | mary.wanjiku@courts.go.ke |
| Peter Ochieng | Registry Clerk | peter.ochieng@courts.go.ke |
| Grace Akinyi | Archivist | grace.akinyi@courts.go.ke |
| David Mutua | Deputy Registrar | david.mutua@courts.go.ke |
| Hon. Justice Njeri | Judge | j.njeri@courts.go.ke |
