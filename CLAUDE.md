# XTmate V3 - Project Knowledge Base

## Project Overview
XTmate is an estimation tool for property restoration (water, fire, mold damage) claims processing. V3 is a complete rewrite focusing on simplicity, maintainability, and reliability. The platform supports multi-tenant organizations with role-based access control for restoration companies.

**Live URL**: https://xtmate-v3.vercel.app
**Repository**: github.com/jpdehyl/xtmate-v3

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Auth**: Clerk 6 (users) + Token-based (vendors)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **File Storage**: Vercel Blob
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest + React Testing Library
- **PDF Export**: jsPDF
- **Excel Export**: ExcelJS
- **Charts**: Recharts
- **Canvas**: Konva.js + react-konva
- **Email**: Google Gmail API (OAuth2)
- **AI**: Anthropic Claude + OpenAI

## Architecture Decisions

### Why This Stack?
1. **Clerk for Auth**: Eliminates 94 duplicated auth patterns from V2. Single middleware handles all auth.
2. **Drizzle ORM**: Type-safe database access, simpler than Prisma, better edge support.
3. **Local Fonts**: No Google Fonts CDN dependency (caused V2 build failures).
4. **App Router**: Server components by default, better performance.
5. **Multi-tenant Architecture**: Organizations with RBAC for team collaboration.

### V2 Problems Solved
| V2 Issue | V3 Solution |
|----------|-------------|
| 94 REST routes | Simplified API structure (51 routes) |
| 35 database tables | 24 tables (focused, normalized) |
| Auth duplication in routes | Clerk middleware + RBAC |
| Build failures (Google Fonts) | Local fonts |
| 60+ fields on estimates | Split into focused tables |
| No multi-tenant support | Organizations with RBAC |

---

## Database Schema (24 tables)

### Core Estimates (3 tables)
- `estimates` - Core estimate records with property info, workflow status, PM/Estimator assignments
- `levels` - Floor levels (B, 1, 2, 3, A) with labels and ordering
- `rooms` - Room dimensions, materials, and geometry for sketch editor

### Organizations & RBAC (2 tables)
- `organizations` - Multi-tenant organizations with branding, defaults, Stripe billing fields
- `organization_members` - Team membership with roles and custom permissions

### Damage & Scope (6 tables)
- `annotations` - Damage markers with position, severity, affected surfaces
- `line_items` - Scope items with Xactimate codes and pricing
- `photos` - Documentation photos with GPS and timestamps
- `pm_scope_items` - PM plain-language damage observations (converted to line items)
- `assignments` - E/A/R/P/C/Z assignment types with totals
- `esx_exports` - Export history tracking with version control

### Pricing (2 tables)
- `price_lists` - User/org price lists with regions and effective dates
- `price_list_items` - Individual price list entries

### SLA Tracking (3 tables)
- `carriers` - Insurance carrier configuration with contact info
- `carrier_sla_rules` - Carrier-specific SLA target hours per milestone
- `sla_events` - Milestone completions with target/actual timestamps

### Vendor Portal (5 tables)
- `vendors` - Subcontractor info with token-based access
- `quote_requests` - Quote requests linking estimates to vendors
- `quote_request_items` - Line items included in each request
- `vendor_quotes` - Vendor responses with pricing
- `vendor_quote_items` - Per-item pricing from vendors

### Email Integration (2 tables)
- `email_integrations` - Gmail OAuth connections per organization
- `incoming_emails` - Parsed incoming claim emails with auto-create

### Sync (1 table)
- `sync_queue` - Device-based sync queue for iOS app offline sync

### Enums
- `estimate_status` - draft, in_progress, completed
- `job_type` - insurance, private
- `photo_type` - BEFORE, DURING, AFTER, DAMAGE, EQUIPMENT, OVERVIEW
- `assignment_type` - E, A, R, P, C, Z
- `assignment_status` - pending, in_progress, submitted, approved, completed
- `sla_milestone` - assigned, contacted, site_visit, estimate_uploaded, revision_requested, approved, closed
- `quote_request_status` - pending, viewed, quoted, accepted, rejected, expired
- `workflow_status` - draft, pm_assigned, pm_in_progress, pm_completed, estimator_review, ready_for_export, exported, submitted
- `email_integration_status` - active, disconnected, expired, error
- `incoming_email_status` - pending, processing, parsed, estimate_created, ignored, failed

---

## RBAC System

### Roles (7 internal roles)
| Role | Level | Description |
|------|-------|-------------|
| `admin` | 100 | Full organization access including billing, API keys, user management |
| `general_manager` | 90 | All data read access, team metrics, analytics (no backend changes) |
| `qa_manager` | 80 | Review queue management, approve/reject estimates, SLA tracking |
| `estimator` | 70 | Create/edit estimates, line items, price lists, export to ESX |
| `pm` | 70 | Field work, LiDAR capture, photos, damage annotation, vendor dispatch |
| `project_admin` | 60 | Documentation, invoicing support, limited estimate edits |
| `field_staff` | 50 | View assigned work orders only, time tracking, task completion |

### Permission Domains (60+ permissions)
- **Estimates**: create, read_own, read_assigned, read_team, update_own, update_any, update_limited, delete_own, delete_any, approve, reject, export, assign_team
- **Rooms**: create, read, update, delete, capture_lidar
- **Line Items**: create, read, update, delete, verify, ai_generate
- **Photos**: upload, read, annotate, delete
- **Annotations**: create, read, update, delete
- **Documents**: upload, read, delete
- **Analytics**: view_own, view_team, view_revenue, export
- **Work Orders**: create, read_own, read_team, update_own, update_any, assign, clock, complete
- **Vendors**: view, create, update, delete, invite, request_quotes
- **QA**: view_queue, approve, reject, view_scorecards, manage_sla
- **Settings**: view, manage_price_lists, manage_carriers, manage_users, manage_roles, manage_org, manage_billing, manage_integrations
- **Preliminary Reports**: create, read, update, submit, export_pdf

### Auth Library (`src/lib/auth/`)
- `types.ts` - Role/Permission type definitions
- `permissions.ts` - Role-permission mappings and helpers
- `authorize.ts` - Authorization layer for API routes
- `vendor.ts` - Vendor token auth (non-Clerk)
- `index.ts` - Module exports

---

## Directory Structure
```
src/
├── app/
│   ├── (auth)/                    # Auth routes (sign-in, sign-up)
│   ├── dashboard/
│   │   ├── page.tsx               # Estimates list
│   │   ├── estimates/
│   │   │   ├── new/               # Create estimate
│   │   │   └── [id]/              # Edit estimate (tabs: Details, Rooms, Scope, Photos, SLA, Vendors)
│   │   ├── portfolio/             # Portfolio overview
│   │   ├── analytics/             # Analytics dashboard
│   │   ├── command-center/        # Development tracking
│   │   ├── onboarding/            # Organization setup
│   │   ├── incoming-requests/     # Email-parsed claims
│   │   └── settings/
│   │       └── integrations/      # Gmail connection
│   ├── vendor/                    # Vendor portal (token auth)
│   │   ├── page.tsx               # Vendor dashboard
│   │   ├── login/                 # Token-based login
│   │   └── quotes/[id]/           # Quote submission
│   └── api/
│       ├── estimates/             # Estimate CRUD + export + ESX
│       ├── photos/                # Photo upload and management
│       ├── line-items/            # Line item CRUD + bulk + reorder
│       ├── price-lists/           # Price list management + import
│       ├── carriers/              # Carrier management + seed
│       ├── sla-events/            # SLA milestone tracking
│       ├── vendors/               # Vendor management
│       ├── quote-requests/        # Quote request management
│       ├── vendor/                # Vendor auth + quote submission
│       ├── ai/                    # AI endpoints (6 routes)
│       ├── gmail/                 # Gmail OAuth + sync
│       ├── pm-scope/              # PM scope item management
│       ├── sync/                  # iOS device sync
│       ├── onboarding/            # Organization setup
│       ├── auth/                  # Auth context
│       ├── portfolio/             # Portfolio data
│       ├── analytics/             # Analytics data
│       └── command-center/        # Status & prompts
├── components/
│   ├── ui/                        # Base UI components (button, input, tabs, etc.)
│   ├── features/                  # Feature-specific components (17 components)
│   ├── sketch-editor/             # Konva.js floor plan editor
│   ├── portfolio/                 # Portfolio dashboard components
│   └── analytics/                 # Analytics dashboard components
├── lib/
│   ├── auth/                      # RBAC + vendor auth
│   ├── db/                        # Drizzle schema and connection
│   ├── gmail/                     # Gmail API client, parser, service
│   ├── esx/                       # ESX XML generator
│   ├── sla/                       # SLA calculations and types
│   ├── geometry/                  # Sketch editor geometry utilities
│   ├── offline/                   # PWA offline storage and sync
│   ├── calculations/              # Estimate totals calculations
│   ├── reference/                 # Xactimate categories reference
│   ├── hooks/                     # Custom React hooks
│   └── validation/                # Zod schemas
└── middleware.ts                  # Clerk auth middleware
```

---

## API Routes (51 routes)

### Estimates
- `GET/POST /api/estimates` - List and create
- `GET/PATCH/DELETE /api/estimates/[id]` - Single estimate ops
- `POST /api/estimates/[id]/duplicate` - Duplicate estimate
- `GET /api/estimates/[id]/export` - PDF/Excel export
- `GET /api/estimates/[id]/esx` - ESX XML export
- `GET/POST /api/estimates/[id]/levels` - Level management
- `GET/PATCH/DELETE /api/estimates/[id]/levels/[levelId]`
- `GET/POST /api/estimates/[id]/rooms` - Room management
- `GET/PATCH/DELETE /api/estimates/[id]/rooms/[roomId]`

### Line Items
- `GET/POST /api/line-items` - List and create
- `GET/PATCH/DELETE /api/line-items/[id]` - Single item ops
- `POST /api/line-items/bulk` - Bulk creation
- `PATCH /api/line-items/reorder` - Drag-and-drop reorder

### Photos
- `GET/POST /api/photos` - List and upload
- `GET/PATCH/DELETE /api/photos/[id]` - Single photo ops

### Price Lists
- `GET/POST /api/price-lists` - List and create
- `POST /api/price-lists/import` - CSV/XLSX import

### SLA & Carriers
- `GET/POST /api/carriers` - List and create carriers
- `POST /api/carriers/seed` - Seed 10 major carriers
- `GET/POST /api/sla-events` - List and initialize
- `GET/PATCH/DELETE /api/sla-events/[id]` - Complete milestones

### Vendors
- `GET/POST /api/vendors` - List and create
- `GET/PATCH/DELETE /api/vendors/[id]` - Single vendor ops
- `POST/DELETE /api/vendors/[id]/token` - Token management
- `GET/POST /api/quote-requests` - Quote request management
- `GET/PATCH/DELETE /api/quote-requests/[id]`
- `POST /api/vendor/auth/login` - Vendor login
- `POST /api/vendor/auth/logout` - Vendor logout
- `GET/POST /api/vendor/quotes` - Quote submission

### AI (6 endpoints)
- `POST /api/ai/suggest-scope` - AI scope suggestions based on job type
- `POST /api/ai/enhance-description` - Professional name rewriting
- `POST /api/ai/analyze-photo` - Vision-based damage detection
- `POST /api/ai/assistant` - Multi-persona AI assistant (6 roles)
- `POST /api/ai/generate-report` - Report generation (5 types)
- `POST /api/ai/fill-data` - AI field suggestions

### Gmail Integration
- `GET/POST /api/gmail/connect` - OAuth connection flow
- `GET /api/gmail/callback` - OAuth callback
- `POST /api/gmail/disconnect` - Revoke access
- `GET /api/gmail/status` - Connection status
- `POST /api/gmail/sync` - Sync and parse emails
- `GET /api/gmail/emails` - List incoming emails

### PM Workflow
- `GET/POST /api/pm-scope` - PM scope items
- `GET/PATCH/DELETE /api/pm-scope/[id]`

### Sync
- `POST /api/sync` - Device sync (rooms, photos, PM scope)
- `POST /api/sync/complete` - Complete sync process

### Other
- `GET /api/auth/context` - Auth context with permissions
- `POST /api/onboarding/complete` - Organization creation
- `GET /api/portfolio` - Portfolio stats and data
- `GET /api/analytics` - Analytics with date filtering
- `GET /api/command-center/status` - Development status
- `GET /api/command-center/prompts` - Implementation prompts

---

## Development Commands
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (includes prebuild status generation)
npm run test         # Run tests
npm run db:studio    # Open Drizzle Studio
npm run db:migrate   # Run migrations
npm run db:generate  # Generate migrations from schema
```

---

## Key Patterns

### Auth Pattern
All auth handled via Clerk middleware. RBAC checked in API routes.

```typescript
// middleware.ts handles Clerk auth
// API routes use RBAC:
import { authorize } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/auth/types";

const authResult = await authorize(PERMISSIONS.ESTIMATES_CREATE);
if (!authResult.authorized) {
  return NextResponse.json({ error: authResult.error }, { status: authResult.status });
}
const { context } = authResult; // userId, organizationId, role, permissions
```

### Database Pattern
Use Drizzle for type-safe queries, scope by organizationId for multi-tenant:

```typescript
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";

const result = await db.select().from(estimates)
  .where(and(
    eq(estimates.organizationId, context.organizationId),
    eq(estimates.userId, context.userId)
  ));
```

### API Pattern
Use Next.js route handlers with Zod validation:

```typescript
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });
const body = schema.parse(await req.json());
```

### Offline/PWA Pattern
```typescript
// Check online status
import { useOnlineStatus, useSyncStatus } from "@/lib/offline/hooks";

const { isOnline, wasOffline } = useOnlineStatus();
const { isSyncing, startSync } = useSyncStatus();

// Cache estimates offline
import { saveEstimateOffline, getEstimatesOffline } from "@/lib/offline/storage";
```

### Gmail Integration Pattern
```typescript
import { GmailService } from "@/lib/gmail/service";

// Sync emails and auto-create estimates
const service = new GmailService(integration);
const newEmails = await service.syncEmails();
for (const email of newEmails) {
  const parsed = await service.parseClaimEmail(email);
  if (parsed.confidence > 0.7) {
    await createEstimateFromEmail(parsed);
  }
}
```

---

## RALPH Methodology

RALPH = **R**equirements **A**nalysis for **L**LM-**P**owered **H**andoff

Follow this methodology for all feature implementations:

### 1. Requirements Analysis
- Read the PRD completely before coding
- Identify all acceptance criteria
- Note edge cases and error handling requirements
- Understand the user personas affected

### 2. Architecture Review
- Check existing patterns in the codebase
- Identify reusable components/utilities
- Plan file structure before implementation
- Consider how this integrates with existing features

### 3. Implementation
- Follow patterns established in this file
- Use existing UI components
- Implement incrementally, testing each piece
- DO NOT over-engineer - keep it simple

### 4. Progress Tracking
- Update the Command Center after completing each task
- Mark tasks in PRD as completed
- Add implementation notes for future reference
- Note any deviations from the original plan

### 5. Validation Checklist
Before marking any task complete:
- [ ] TypeScript types are complete (no `any`)
- [ ] Error handling for all async operations
- [ ] Loading states for async UI
- [ ] Proper HTTP status codes in API routes
- [ ] Auth check on all protected routes
- [ ] organizationId scoped on database queries (multi-tenant)
- [ ] RBAC permissions checked for sensitive operations

---

## Migration Stages (from V2)

### Stage 1-6: Foundation through Polish ✅ COMPLETE
See previous documentation for details on:
- Foundation (Next.js 15, Clerk, Neon/Drizzle)
- Estimates CRUD
- ESX Export
- AI Scope
- Mobile Sync (PWA)
- Polish (search, filter, skeleton states)

### Sprint M2-M8 ✅ COMPLETE
- M2: Database Schema (6 core tables)
- M3: Rooms & Sketch Editor (Konva.js)
- M4: Line Items & Pricing
- M5: Photos & Documentation
- M6: SLA & Workflow
- M7: Portfolio & Analytics
- M8: Vendor Portal

### Sprint M9: Organizations & RBAC ✅ COMPLETE
Full multi-tenant architecture with role-based access control:

**Database Tables**:
- `organizations` - Multi-tenant organizations with branding, billing, defaults
- `organization_members` - Team membership with roles

**RBAC System** (`src/lib/auth/`):
- 7 roles with hierarchical levels (admin=100 to field_staff=50)
- 60+ granular permissions across 8 domains
- Custom permission overrides per member
- Limited update fields for restricted roles

**API Routes**:
- `GET /api/auth/context` - Returns user's auth context with permissions
- `POST /api/onboarding/complete` - Creates organization and assigns admin role

**Pages**:
- `/dashboard/onboarding` - Organization creation with role selection

### Sprint M10: Gmail Integration ✅ COMPLETE
Full Gmail API integration for automatic claim intake:

**Database Tables**:
- `email_integrations` - OAuth connections per organization
- `incoming_emails` - Parsed emails with claim data

**Gmail Library** (`src/lib/gmail/`):
- `client.ts` - Gmail API OAuth2 client
- `parser.ts` - AI-powered claim parsing from email body
- `service.ts` - High-level service for sync operations
- `state.ts` - OAuth state management

**API Routes**:
- `GET/POST /api/gmail/connect` - OAuth flow initiation
- `GET /api/gmail/callback` - OAuth callback handler
- `POST /api/gmail/disconnect` - Revoke access
- `GET /api/gmail/status` - Connection status check
- `POST /api/gmail/sync` - Sync emails and parse claims
- `GET /api/gmail/emails` - List incoming emails

**Pages**:
- `/dashboard/settings/integrations` - Gmail connection UI
- `/dashboard/incoming-requests` - View and process parsed claims

**Features**:
- OAuth2 authentication with Gmail
- Automatic email polling and parsing
- AI-powered claim data extraction
- Confidence scoring for parsed data
- Auto-create estimates from high-confidence parses

### Sprint M11: PM/Estimator Workflow ✅ COMPLETE
Complete workflow system for field-to-office handoff:

**Database Tables**:
- `pm_scope_items` - PM plain-language damage observations
- `esx_exports` - Export history with versioning
- `sync_queue` - Device-based sync for iOS app

**Workflow Status** (8 stages):
1. `draft` - Initial creation
2. `pm_assigned` - PM assigned to job
3. `pm_in_progress` - PM at site capturing data
4. `pm_completed` - PM finished site capture
5. `estimator_review` - Estimator building estimate
6. `ready_for_export` - Complete, ready for ESX
7. `exported` - ESX generated
8. `submitted` - Submitted to carrier

**API Routes**:
- `GET/POST /api/pm-scope` - PM scope item management
- `GET/PATCH/DELETE /api/pm-scope/[id]`
- `POST /api/sync` - Device sync endpoint
- `POST /api/sync/complete` - Mark sync complete

**Components**:
- `pm-scope-panel.tsx` - PM scope item capture
- `convert-scope-modal.tsx` - Convert PM observations to line items
- `workflow-status-badge.tsx` - Visual workflow status

**Features**:
- PM captures damage in plain language
- Photos linked to scope items
- Offline iOS app sync with local ID mapping
- Estimator converts PM observations to Xactimate line items
- ESX export with version history

### Sprint M12: Advanced AI ✅ COMPLETE
Extended AI capabilities beyond scope suggestions:

**API Routes** (6 total):
- `POST /api/ai/suggest-scope` - Scope item suggestions
- `POST /api/ai/enhance-description` - Name enhancement
- `POST /api/ai/analyze-photo` - Vision damage detection
- `POST /api/ai/assistant` - Multi-persona assistant
- `POST /api/ai/generate-report` - Report generation
- `POST /api/ai/fill-data` - Field suggestions

**Photo Analysis**:
- Damage type detection (water, fire, mold, etc.)
- Severity assessment
- Affected area identification
- Suggested scope items from photos

**AI Assistant Personas**:
- Estimator, Project Manager, Adjuster, Homeowner, Technician, Admin

**Report Types**:
- Executive summary, Detailed scope, Damage assessment
- Insurance narrative, Homeowner summary

---

## Future Stages (Post-MVP)

| Stage | Feature | Priority | Status |
|-------|---------|----------|--------|
| Stage 7 | Templates System | P1 | Planned |
| Stage 8 | Room Management Enhancements | P3 | Planned |
| Stage 9 | ESX Import | P2 | Planned |
| Stage 13 | Work Orders | P2 | Permissions defined |
| Stage 14 | Real-time Collaboration | P4 | Future |

---

## Command Center

The Command Center (`/dashboard/command-center`) tracks development progress:

### Features
- **Progress Tracking**: File-based checks determine task completion
- **Category Breakdown**: Database, API, Web UI, Export, etc.
- **Implementation Prompts**: Copy-paste prompts for each phase
- **Gap Tracking**: Critical missing features highlighted

### Accessing
- URL: `/dashboard/command-center`
- Requires authentication

---

## Testing Strategy
- Unit tests for utilities (`src/lib/__tests__/`)
- Component tests for UI
- Integration tests for API routes
- E2E tests for critical paths

Run tests: `npm run test`

---

## Environment Variables
See `.env.example` for required variables:
```
# Clerk Auth
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

# Database
DATABASE_URL=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=

# Gmail Integration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GMAIL_REDIRECT_URI=
```

---

## Common Issues

### Build Failures
- Ensure no Google Fonts imports (use local fonts)
- Check Clerk keys are set
- Verify DATABASE_URL is valid
- Run `npm run build` to check for type errors

### Type Errors
- Run `npm run build` to check types
- Drizzle schemas must match migrations
- Use `npx drizzle-kit push` to sync schema

### Auth Issues
- Check middleware.ts configuration
- Verify Clerk keys in environment
- For RBAC issues, check `src/lib/auth/permissions.ts`

### Gmail Integration Issues
- Verify Google OAuth credentials
- Check redirect URI matches environment
- Ensure proper scopes in Google Cloud Console

---

*Document maintained by Claude Code. Last updated: January 2026*
