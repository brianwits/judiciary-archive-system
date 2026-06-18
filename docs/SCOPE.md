# Judiciary Archive & Court File Management System — Project Scope

## Executive Overview

The **Judiciary Archive & Court File Management System** is a production-ready web application designed to bring order and automation to the chaotic manual management of physical and digital court files, archival storage, and registry workflows. The system transforms ad-hoc paper-based processes into a structured, auditable, and scalable digital ecosystem for Kenya's court system.

## Problem Statement

Manual management of judicial archives and case registries suffers from critical inefficiencies:
- **Lack of visibility**: No centralized location tracking for physical case files
- **Chain-of-custody gaps**: Handwritten logs and informal file movements introduce errors and liability
- **Storage chaos**: Archive rooms lack occupancy maps and location hierarchies; overcrowding and misplacement are common
- **Registry bottlenecks**: Request queues are managed outside any system, causing delays
- **Audit trail failures**: No automated record of who accessed, moved, or modified what, when
- **Access control holes**: No role-based restrictions on sensitive case information or privileged operations
- **Document fragmentation**: Digital and physical files are tracked separately; scanning lacks categorization

## Core Solution

The system provides an **integrated, role-aware platform** that automates case file management across six operational domains:

### 1. **Dashboard & Analytics**
- ERP-style KPIs: case velocity, archive occupancy, file movement trends
- Archive occupancy heatmap showing room utilization in real-time
- Quick-glance notices for overdue movements and pending approvals
- Historical analytics via Recharts for compliance reporting

### 2. **Active Case Management**
- Unified case repository with full-text search and faceted filtering
- Create, edit, and query case files with structured metadata (parties, case type, assigned judge)
- Track case status transitions and workflow states
- Streamlined interface for registry clerks and judges

### 3. **Archive Storage Management**
- Room and location hierarchy mapping (building → floor → room → section → shelf → bay)
- Visual occupancy maps showing space utilization and remaining capacity
- Logical archive code format: `COURT-CASE_TYPE-YEAR-CASE_NO` (e.g., `KBT-ELC-2023-E018`)
- Location assignment and capacity planning to prevent overcrowding

### 4. **File Tracking & Chain of Custody**
- Check-out and check-in workflows with timestamp authentication
- Comprehensive movement history: who took the file, where, when, and for what purpose
- Location validation to ensure files are stored in authorized locations
- Movement tracking for compliance and audit investigations

### 5. **Registry Operations**
- Centralized request queue for all file requisitions
- Approval workflows for sensitive cases and privileged access
- SLA management and status notifications
- Integration with scanning workflows for paper-to-digital transitions

### 6. **Digital Scanning & Document Repository**
- Categorized document upload system with auto-tagging
- Audit trail for all uploaded documents
- Secure, role-based storage (case-documents bucket with signed URL access)
- Integration with file movements to mark cases as digitized and ready for archival

### 7. **Audit Logs & Compliance**
- Immutable, append-only audit trail of all system operations
- Automatic capture of: operator, action, affected entity, timestamp, result
- Separate audit-write enforcement to prevent log tampering via unauthenticated routes
- Exportable reports for judicial audits and regulatory compliance

### 8. **Role-Based Access Control**
- Six predefined roles with graduated permissions:
  - **Admin**: Full system access, user management, audit oversight
  - **ICT Officer**: System administration, audit inspection, digital uploads
  - **Registry Clerk**: Case queries, file movements, registry operations
  - **Archivist**: Archive storage mapping, movement validation, uploads
  - **Deputy Registrar**: Case approvals, audit review, registry oversight
  - **Judge**: Read-only case access, movement visibility
- Fine-grained permission checks on every operation; silent denials with audit trail

## Technical Architecture

**Frontend**: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui components  
**Database**: Supabase PostgreSQL with RLS (Row-Level Security) for row-based access control  
**Forms & Validation**: React Hook Form + Zod schema validation  
**Data Presentation**: TanStack Table (React) for high-performance grids; Recharts for analytics  
**Authentication**: Supabase Auth (email/password) with JWT-based session management  
**State & Contracts**: Contracts-first design with shared request/response/error schemas  
**Deployment**: Vercel (frontend) + Supabase (backend) with connection pooling for serverless scale

## Key Features

| Feature | Benefit |
|---------|---------|
| **Real-time KPIs** | Instant visibility into archive utilization, case velocity, and movement bottlenecks |
| **Chain-of-custody tracking** | Every file movement is logged with operator, timestamp, and purpose for legal defensibility |
| **Role-based workflows** | Deputy Registrars approve sensitive access; archivists validate storage locations |
| **Immutable audit logs** | Append-only trail prevents tampering; meets judicial compliance requirements |
| **Archive occupancy mapping** | Visual heat maps prevent overcrowding and guide optimal file placement |
| **Digital-physical bridge** | Scanned cases are marked and tracked separately; reduces duplicate storage |
| **n8n webhook integration** | External systems (e.g., case management, notifications) receive real-time file movement events |

## Data Models & Workflows

- **Courts**: Court entities with jurisdictional metadata
- **Cases**: Individual cases linked to courts, with party information and case type
- **Movements**: File check-out and check-in records with location and purpose
- **Archive Rooms & Locations**: Hierarchical storage structure with occupancy tracking
- **Staff & Profiles**: Court personnel with role-based access control
- **Audit Logs**: Immutable record of all system operations and data changes
- **Documents**: Scanned case files with categorization and signed-URL access

## Deployment & Operationalization

- **Local Development**: Mock data mode for rapid iteration; local Supabase stack for schema testing
- **Staging/QA**: Remote Supabase with seeded test roster (`@court.go.ke` users)
- **Production**: Vercel auto-scaling with connection pooler for managed PostgreSQL; environment variable isolation for secrets
- **Migrations**: Forward-only schema versioning; migrations applied before deployment
- **Monitoring**: Application Performance Monitoring (APM) via Vercel; Supabase metrics for database health

## Success Metrics

✓ **Order**: 100% of archive locations mapped with occupancy tracked in real-time  
✓ **Traceability**: Every file movement logged with operator, timestamp, and purpose  
✓ **Compliance**: Immutable audit trail meets judicial access and retention requirements  
✓ **Efficiency**: Registry request queue SLA < 4 hours; file retrieval time < 30 minutes  
✓ **Security**: Role-based access enforced at UI and database layers; unauthorized access attempts logged  
✓ **Scale**: Serverless deployment auto-scales to handle 10,000+ concurrent cases and 100+ daily movements  

## Conclusion

The Judiciary Archive & Court File Management System transforms chaotic, manual archive operations into a disciplined, auditable, and scalable digital backbone for Kenya's court system. By automating file tracking, enforcing role-based workflows, and maintaining immutable audit trails, the system brings transparency, efficiency, and legal defensibility to judicial case management.
