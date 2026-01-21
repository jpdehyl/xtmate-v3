# XTmate V3 - Project Knowledge Base

## Project Overview
XTmate is an estimation tool for construction/landscaping projects. V3 is a complete rewrite focusing on simplicity, maintainability, and reliability.

**Live URL**: https://xtmate-v3.vercel.app
**Repository**: github.com/jpdehyl/xtmate-v3

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Auth**: Clerk 6
- **Database**: Neon PostgreSQL + Drizzle ORM
- **File Storage**: Vercel Blob
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest + React Testing Library
- **PDF Export**: jsPDF
- **Excel Export**: ExcelJS

## Architecture Decisions

### Why This Stack?
1. **Clerk for Auth**: Eliminates 94 duplicated auth patterns from V2. Single middleware handles all auth.
2. **Drizzle ORM**: Type-safe database access, simpler than Prisma, better edge support.
3. **Local Fonts**: No Google Fonts CDN dependency (caused V2 build failures).
4. **App Router**: Server components by default, better performance.

### V2 Problems Solved
| V2 Issue | V3 Solution |
|----------|-------------|
| 94 REST routes | Simplified API structure |
| 35 database tables | Target 15 tables |
| Auth duplication in routes | Clerk middleware |
| Build failures (Google Fonts) | Local fonts |
| 60+ fields on estimates | Split into focused tables |

### Database Schema (9 tables implemented, target 15)
Core tables (implemented):
- `estimates` - Core estimate records with property info
- `levels` - Floor levels (B, 1, 2, 3, A) with labels
- `rooms` - Room dimensions, materials, and geometry for sketch editor
- `annotations` - Damage markers with position, severity, affected surfaces
- `line_items` - Scope items with Xactimate codes and pricing
- `photos` - Documentation photos with GPS and timestamps
- `assignments` - E/A/R/P/C/Z assignment types with totals
- `price_lists` - User price lists with regions and effective dates
- `price_list_items` - Individual price list entries
- `carriers` - Insurance carrier configuration with SLA rules
- `carrier_sla_rules` - Carrier-specific SLA target hours per milestone
- `sla_events` - SLA milestone tracking with target/actual times

Enums:
- `estimate_status` - draft, in_progress, completed
- `job_type` - insurance, private
- `photo_type` - BEFORE, DURING, AFTER, DAMAGE, EQUIPMENT, OVERVIEW
- `assignment_type` - E, A, R, P, C, Z
- `assignment_status` - pending, in_progress, submitted, approved, completed
- `sla_milestone` - assigned, contacted, site_visit, estimate_uploaded, revision_requested, approved, closed

Planned tables:
- `templates` - Reusable estimate templates
- `materials` - Material catalog
- `labor_rates` - Labor pricing
- `vendors` - Vendor/subcontractor management
- `quotes` - Vendor quotes

## Directory Structure
```
src/
├── app/
│   ├── (auth)/              # Auth routes (sign-in, sign-up)
│   ├── dashboard/           # Protected app pages
│   │   ├── page.tsx         # Estimates list
│   │   ├── estimates/
│   │   │   ├── new/         # Create estimate
│   │   │   └── [id]/        # Edit estimate
│   │   └── command-center/  # Development tracking
│   └── api/
│       ├── estimates/       # Estimate CRUD + export
│       ├── photos/          # Photo upload and management
│       └── command-center/  # Status & prompts APIs
├── components/
│   ├── ui/                  # Base UI components
│   └── features/            # Feature-specific components
├── lib/
│   ├── db/                  # Database schema and queries
│   └── utils/               # Helper functions
└── middleware.ts            # Clerk auth middleware
```

## Development Commands
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run test         # Run tests
npm run db:studio    # Open Drizzle Studio
npm run db:migrate   # Run migrations
```

## Key Patterns

### Auth Pattern
All auth handled via Clerk middleware. No manual token checking in routes.

```typescript
// middleware.ts handles all auth
// Components just use:
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();
```

### Database Pattern
Use Drizzle for type-safe queries:

```typescript
import { db } from "@/lib/db";
import { estimates } from "@/lib/db/schema";

const result = await db.select().from(estimates).where(eq(estimates.userId, userId));
```

### API Pattern
Use Next.js route handlers with Zod validation:

```typescript
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });
const body = schema.parse(await req.json());
```

### Offline/PWA Pattern
Use the offline hooks and storage utilities for PWA functionality:

```typescript
// Check online status
import { useOnlineStatus, useSyncStatus } from "@/lib/offline/hooks";

const { isOnline, wasOffline } = useOnlineStatus();
const { isSyncing, startSync } = useSyncStatus();

// Cache estimates offline
import { saveEstimateOffline, getEstimatesOffline, addToSyncQueue } from "@/lib/offline/storage";

await saveEstimateOffline(estimate);
const cached = await getEstimatesOffline(userId);

// Queue changes for sync
await addToSyncQueue({ type: 'update', estimateId: id, data: changes });
```

Key PWA files:
- `next.config.ts` - PWA configuration with 6 caching strategies
- `public/manifest.json` - PWA manifest with icons
- `src/lib/offline/storage.ts` - IndexedDB operations
- `src/lib/offline/sync.ts` - Sync queue management
- `src/lib/offline/hooks.ts` - React hooks for offline state
- `src/components/offline-indicator.tsx` - UI components

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
- [ ] userId scoped on database queries

---

## Migration Stages (from V2)

### Stage 1: Foundation ✅ COMPLETE
- Next.js 15 + TypeScript setup
- Clerk authentication
- Neon PostgreSQL + Drizzle ORM
- Basic landing page and auth flow
- Dashboard shell

### Stage 2: Estimates CRUD ✅ COMPLETE
- Estimates list page
- Create/edit estimate forms
- Delete with confirmation
- Auto-save on field blur
- Status tracking (draft/in_progress/completed)
- Job type (private/insurance)

### Stage 3: ESX Export ✅ COMPLETE
- PDF export with jsPDF
- Excel export with ExcelJS
- Professional formatting with XTmate branding
- Download buttons on estimate detail page

### Stage 4: AI Scope ✅ COMPLETE
**User Stories:**
- US-007: AI suggests scope items based on job type
- US-008: AI enhances estimate descriptions

**Technical:**
- Anthropic Claude Sonnet 4 integration
- POST /api/ai/suggest-scope (returns 5-10 scope items with categories)
- POST /api/ai/enhance-description (professional name rewriting)
- AIScopeModal and EnhanceDescriptionModal components

### Stage 5: Mobile Sync ✅ COMPLETE
**User Stories:**
- US-009: PWA installation on mobile
- US-010: Offline estimate viewing

**Technical:**
- IndexedDB storage with 3 object stores (src/lib/offline/storage.ts)
- Sync queue for pending changes (src/lib/offline/sync.ts)
- useOnlineStatus, useSyncStatus, useConnectionQuality hooks (src/lib/offline/hooks.ts)
- OfflineIndicator component (full + compact variants)
- PWA manifest with 8 icon sizes (/public/manifest.json, /public/icons/)
- Service worker via next-pwa (6 runtime caching strategies in next.config.ts)
- iOS/Android web app meta tags (src/app/layout.tsx)

### Stage 6: Polish ✅ COMPLETE
**User Stories:**
- US-011: Dashboard search & filter (name, address, city, claim#, policy#)
- US-012: Estimate duplication (with "(Copy)" suffix)
- US-013: Loading & empty states (skeleton components)

**Technical:**
- EstimatesFilters component with search + dropdowns
- POST /api/estimates/[id]/duplicate endpoint
- EstimatesTableSkeleton, EstimateDetailSkeleton, FiltersSkeleton
- TODO: URL-based filter state, toast notifications

### V2 Migration Sprints (see docs/PRD-V2-MIGRATION.md)

#### Sprint M2: Database Schema ✅ COMPLETE
Added 6 new tables for full restoration app functionality:
- `levels` - Floor levels with ordering
- `rooms` - Room dimensions, materials, geometry (JSONB)
- `annotations` - Damage markers with 3D positioning
- `line_items` - Xactimate codes, pricing, AI confidence
- `photos` - GPS, timestamps, type classification
- `assignments` - E/A/R/P/C/Z with totals calculations

**To apply to database**: `npx drizzle-kit push` (requires DATABASE_URL)

#### Sprint M3: Rooms & Sketch Editor ✅ COMPLETE
Full sketch editor built from scratch with Konva.js:

**Core Components** (in `src/components/sketch-editor/`):
- `SketchEditor.tsx` - Main editor with full-screen modal
- `SketchCanvas.tsx` - React Konva canvas with pan/zoom/touch
- `Toolbar.tsx` - Tool selection with keyboard shortcuts (V, W, D, O, F, S, M, P, G)
- `LevelTabs.tsx` - Multi-floor level management (B, 1, 2, 3, A)

**Layer Components** (in `src/components/sketch-editor/layers/`):
- `GridLayer.tsx`, `WallsLayer.tsx`, `DoorsLayer.tsx`, `WindowsLayer.tsx`, `FixturesLayer.tsx`, `StaircasesLayer.tsx`

**Geometry Utilities** (in `src/lib/geometry/`):
- `types.ts` - TypeScript interfaces
- `snapping.ts` - Wall snapping (6 types)
- `room-detection.ts` - Detect enclosed rooms from walls
- `staircase.ts` - Stair calculation

**API Routes**:
- `GET/POST /api/estimates/[id]/levels`
- `GET/PATCH/DELETE /api/estimates/[id]/levels/[levelId]`
- `GET/POST /api/estimates/[id]/rooms`
- `GET/PATCH/DELETE /api/estimates/[id]/rooms/[roomId]`

**UI Updates**:
- Tab navigation on estimate detail (Details, Rooms, Scope, Photos, SLA)
- RoomsTab component with room cards
- `src/components/ui/tabs.tsx` - Reusable tabs component

#### Sprint M4: Line Items & Pricing ✅ COMPLETE
Full line item management with Xactimate compatibility:

**API Routes** (in `src/app/api/line-items/`):
- `route.ts` - GET (list) and POST (create) line items
- `[id]/route.ts` - GET, PATCH, DELETE for single items
- `bulk/route.ts` - POST for bulk creation (AI suggestions)
- `reorder/route.ts` - PATCH for drag-and-drop reordering

**Price Lists API** (in `src/app/api/price-lists/`):
- `route.ts` - GET (list) and POST (create) price lists
- `import/route.ts` - POST for CSV/XLSX import with auto column detection

**Reference Data**:
- `src/lib/reference/xactimate-categories.ts` - 40+ Xactimate categories with unit types

**Calculations**:
- `src/lib/calculations/estimate-totals.ts` - Subtotal, overhead, profit, tax calculations

**UI Components**:
- `src/components/features/scope-tab.tsx` - Full line items table with inline editing, drag-and-drop
- `src/components/features/totals-summary.tsx` - Editable totals display with overhead/profit/tax

**Database Tables**:
- `price_lists` - User price lists with regions and effective dates
- `price_list_items` - Individual price list entries

**Export Updates**:
- PDF export includes line items table with totals
- Excel export includes separate "Line Items" worksheet

#### Sprint M5: Photos & Documentation ✅ COMPLETE
Full photo management system with upload, gallery, and export integration:

**API Routes** (in `src/app/api/photos/`):
- `GET/POST /api/photos` - List and upload photos
- `GET/PATCH/DELETE /api/photos/[id]` - Single photo operations

**Components** (in `src/components/features/`):
- `photo-gallery.tsx` - Grid view with thumbnails, type badges, delete
- `photo-lightbox.tsx` - Full-screen viewer with navigation, caption editing, room linking
- `photo-upload.tsx` - Upload modal with camera capture, GPS tagging, photo type selection
- `photos-tab.tsx` - Main Photos tab with filter by type, upload integration

**Features**:
- Vercel Blob storage for photos (max 10MB per file)
- 6 photo types: Before, During, After, Damage, Equipment, Overview
- GPS location tagging (optional)
- Photo-to-room linking
- Filter gallery by photo type
- PDF export includes up to 12 photos in grid layout
- Excel export includes photo counts by type

**Environment Variable**:
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token

#### Sprint M6: SLA & Workflow ✅ COMPLETE
Full SLA tracking system with carrier configuration and milestone management:

**Database Tables** (in `src/lib/db/schema.ts`):
- `carriers` - Insurance company configuration with contact info
- `carrier_sla_rules` - Carrier-specific SLA target hours per milestone
- `sla_events` - Milestone completions with target/actual timestamps
- `slaMilestoneEnum` - 7 milestones (assigned, contacted, site_visit, estimate_uploaded, revision_requested, approved, closed)
- Added `carrierId` to estimates table

**SLA Library** (in `src/lib/sla/`):
- `types.ts` - TypeScript types, milestone labels, descriptions
- `calculations.ts` - Status calculation, hours remaining, compliance rate
- `index.ts` - Module exports

**API Routes**:
- `GET/POST /api/carriers` - List and create carriers
- `POST /api/carriers/seed` - Seed 10 major insurance carriers
- `GET/POST /api/sla-events` - List events, initialize tracking
- `GET/PATCH/DELETE /api/sla-events/[id]` - Single event operations, complete milestone

**Components** (in `src/components/features/`):
- `sla-tab.tsx` - Timeline view with milestone progress and complete buttons
- `sla-badge.tsx` - SLABadge, SLAIndicator, SLADot components
- `sla-dashboard-widget.tsx` - Dashboard widget with at-risk/overdue counts
- `carrier-selector.tsx` - Carrier selection dropdown for insurance estimates

**Features**:
- 7 SLA milestones with configurable target hours
- Carrier-specific SLA rules (contact within 4h, site visit within 24h, etc.)
- Real-time status calculation (on_time, at_risk, overdue, completed, pending)
- Dashboard widget with compliance percentage and critical items list
- Visual timeline with completion tracking and overdue alerts

#### Sprint M7: Portfolio & Analytics ✅ COMPLETE
Full portfolio and analytics dashboards with charts and data visualization:

**Pages**:
- `/dashboard/portfolio` - Portfolio overview with summary metrics
- `/dashboard/analytics` - Analytics dashboard with date range filtering

**Components** (in `src/components/portfolio/`):
- `activity-feed.tsx` - Activity log with user avatars, timestamps, action types
- `carrier-breakdown.tsx` - Donut chart with carrier stats table
- `at-risk-list.tsx` - SLA at-risk/overdue estimates with urgency sorting

**Components** (in `src/components/analytics/`):
- `date-range-picker.tsx` - Date range selection with presets (7d, 30d, 90d, 1y, YTD, All time)
- `revenue-chart.tsx` - Area chart with trend calculation
- `team-metrics.tsx` - Sortable metrics table per team member
- `export-analytics.tsx` - PDF/Excel export with jsPDF and ExcelJS

**API Routes**:
- `GET /api/portfolio` - Portfolio stats, activities, carriers, at-risk estimates
- `GET /api/analytics?start=&end=` - Analytics stats, charts data, team metrics (date range filtered)

**Features**:
- Portfolio summary metrics (6 stat cards)
- Activity feed with action icons and relative timestamps
- At-risk estimates list with SLA status badges
- Carrier breakdown donut chart with clickable segments
- Revenue over time area chart with trend indicators
- Claims by status pie chart
- Monthly claims volume bar chart
- Team performance metrics with sortable columns
- Export to PDF (jsPDF) and Excel (ExcelJS)
- Date range filtering with preset options

### Future Migration Sprints
- **M1**: Dashboard & Navigation (sidebar, charts, map) - P2 Priority
- **M8**: Vendor Portal - P3 Priority (defer until customer demand)

### Future Stages (Post-MVP)

**Priority Order** (based on Business Analysis - January 2026):

| Stage | Feature | Priority | ROI |
|-------|---------|----------|-----|
| **Stage 7** | Templates System | **P1** | 9/10 - Saves 50-70% estimate time |
| Stage 8 | Room Management Enhancements | P3 | Medium |
| Stage 9 | ESX Import/Export | P2 | High - Migration path from Xactimate |
| Stage 10 | Vendor Portal | P3 | Defer |
| Stage 11 | Real-time Collaboration | P4 | Future |
| Stage 12 | Advanced Analytics | P4 | Future |

See `docs/BUSINESS-ANALYSIS.md` for full ROI analysis and recommendations.

---

## Command Center

The Command Center (`/dashboard/command-center`) tracks development progress:

### Features
- **Progress Tracking**: File-based checks determine task completion
- **Category Breakdown**: Database, API, Web UI, Export, etc.
- **Implementation Prompts**: Copy-paste prompts for each phase
- **Gap Tracking**: Critical missing features highlighted

### How It Works
The status API checks for file existence and content:
```typescript
// Example: Check if PDF export exists
fileExists('src/app/api/estimates/[id]/export/route.ts')
fileContains('src/app/api/estimates/[id]/export/route.ts', 'jsPDF')
```

### Accessing
- URL: `/dashboard/command-center`
- Requires authentication

---

## Testing Strategy
- Unit tests for utilities
- Component tests for UI
- Integration tests for API routes
- E2E tests for critical paths

Run tests: `npm run test`

## Environment Variables
See `.env.example` for required variables:
- `CLERK_SECRET_KEY` - Clerk backend key
- `CLERK_PUBLISHABLE_KEY` - Clerk frontend key
- `DATABASE_URL` - Neon connection string
- `ANTHROPIC_API_KEY` - For AI features (Stage 4)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token (Sprint M5)

## Common Issues

### Build Failures
- Ensure no Google Fonts imports (use local fonts)
- Check Clerk keys are set
- Verify DATABASE_URL is valid

### Type Errors
- Run `npm run build` to check types
- Drizzle schemas must match migrations

### Auth Issues
- Check middleware.ts configuration
- Verify Clerk keys in environment

---

*Document maintained by Claude Code. Last updated: January 2026*
