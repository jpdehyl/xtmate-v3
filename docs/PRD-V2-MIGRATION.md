# PRD: XtMate V2 → V3 Feature Migration

**Document Version**: 1.0
**Created**: January 20, 2026
**Methodology**: RALPH (Requirements Analysis for LLM-Powered Handoff)
**Status**: Active Development

---

## Executive Summary

Migrate all production-ready features from XtMate V2 (localhost:3001) to V3 (xtmate-v3.vercel.app) while maintaining V3's cleaner architecture and Vercel deployment compatibility.

### Current State

| Aspect | V2 | V3 |
|--------|-----|-----|
| Database Tables | 45 | 1 (estimates only) |
| Components | 90+ | ~15 |
| API Routes | 55+ | 10 |
| Features | Full restoration app | MVP estimates |
| Deployment | Local only | Vercel production |

### Target State

V3 with all V2 features, deployed to Vercel, with cleaner code patterns.

---

## Migration Sprints Overview

| Sprint | Focus | Tasks | Status |
|--------|-------|-------|--------|
| **M1** | Dashboard & Navigation | 8 | 🔴 NOT STARTED |
| **M2** | Database Schema Expansion | 6 | ✅ COMPLETE |
| **M3** | Rooms & Sketch Editor | 10 | ✅ COMPLETE |
| **M4** | Line Items & Pricing | 8 | ✅ COMPLETE |
| **M5** | Photos & Documentation | 6 | ✅ COMPLETE |
| **M6** | SLA & Workflow | 6 | ✅ COMPLETE |
| **M7** | Portfolio & Analytics | 6 | ✅ COMPLETE |
| **M8** | Vendor Portal | 6 | 🔴 NOT STARTED |

---

## Sprint M1: Dashboard & Navigation 🔴 NOT STARTED

**Goal**: Match V2's rich dashboard experience with sidebar navigation, metrics, and map.

### User Stories

#### US-M1-1: Sidebar Navigation
**As a** user
**I want** a collapsible sidebar with all navigation options
**So that** I can quickly access all app sections

**Acceptance Criteria**:
- [ ] Sidebar shows: Dashboard, Estimates, Command Center, Portfolio, QA Review, Analytics, Team, Settings
- [ ] Sidebar collapses on mobile
- [ ] Active route is highlighted
- [ ] Icons match V2 (Lucide icons)
- [ ] Company logo/name at top

**Source Files (V2)**:
- `src/components/dashboard/sidebar.tsx`

**Progress Check**: File exists at `src/components/dashboard/sidebar.tsx` AND contains "Dashboard" AND "Portfolio"

---

#### US-M1-2: Welcome Banner
**As a** user
**I want** a personalized welcome banner on the dashboard
**So that** I see my name and today's summary at a glance

**Acceptance Criteria**:
- [ ] Shows "Good morning/afternoon/evening, {name}!"
- [ ] Shows date
- [ ] Shows active claims count
- [ ] "View Active Claims" button

**Source Files (V2)**:
- `src/components/dashboard/welcome-banner.tsx`

**Progress Check**: File contains "Good" AND "morning" OR "afternoon" OR "evening"

---

#### US-M1-3: Stat Cards Row
**As a** user
**I want** quick stat cards showing key metrics
**So that** I can see my performance at a glance

**Acceptance Criteria**:
- [ ] In Progress count with icon
- [ ] Complete count with icon
- [ ] This Month count with icon
- [ ] Total Value with currency format
- [ ] Cards have colored icons

**Source Files (V2)**:
- `src/components/dashboard/stat-card.tsx`
- `src/components/dashboard/performance-metrics.tsx`

**Progress Check**: StatCard component exists with "title" AND "value" props

---

#### US-M1-4: Monthly Claims Chart
**As a** user
**I want** a bar chart showing claims per month
**So that** I can visualize my workload trends

**Acceptance Criteria**:
- [ ] Bar chart with last 6 months
- [ ] Y-axis shows count
- [ ] Bars are colored (blue gradient)
- [ ] Tooltip on hover
- [ ] "Monthly Claims" header

**Source Files (V2)**:
- Uses Recharts BarChart component

**Progress Check**: File imports from "recharts" AND contains "BarChart"

---

#### US-M1-5: Loss Types Donut Chart
**As a** user
**I want** a donut chart showing damage type distribution
**So that** I can see what types of claims I handle most

**Acceptance Criteria**:
- [ ] Donut/pie chart
- [ ] Legend with damage types (Fire, Water, Other)
- [ ] Color-coded segments
- [ ] "Loss Types" header

**Progress Check**: Contains "PieChart" OR "DonutChart" from recharts

---

#### US-M1-6: Claims Table with Tabs
**As a** user
**I want** a tabbed table showing claims by status
**So that** I can filter and find specific claims quickly

**Acceptance Criteria**:
- [ ] Tabs: All, Draft, Working, Synced, Revision
- [ ] Table columns: Claim/Project, Insured, Profile, Status, Total, Modified, User
- [ ] Sortable columns
- [ ] Row click navigates to estimate
- [ ] Status badges with colors

**Source Files (V2)**:
- `src/components/dashboard/estimate-table.tsx`

**Progress Check**: EstimateTable contains "tabs" AND maps over estimates

---

#### US-M1-7: Projects Map
**As a** user
**I want** a map showing claim locations
**So that** I can visualize my geographic coverage

**Acceptance Criteria**:
- [ ] Google Maps embed
- [ ] Markers for each estimate with coordinates
- [ ] Different colors for In Progress vs Approved
- [ ] Cluster markers when zoomed out
- [ ] Click marker to see estimate name

**Source Files (V2)**:
- `src/components/dashboard/projects-map.tsx`

**Progress Check**: File contains "@googlemaps" OR "google.maps"

---

#### US-M1-8: Dashboard Layout Integration
**As a** user
**I want** all dashboard components assembled in the correct layout
**So that** the dashboard matches V2's design

**Acceptance Criteria**:
- [ ] Sidebar on left (collapsible)
- [ ] Welcome banner at top
- [ ] Stat cards below banner
- [ ] Charts row (Monthly Claims + Loss Types)
- [ ] Map + Table row below
- [ ] Responsive grid layout

**Progress Check**: Dashboard page imports Sidebar, WelcomeBanner, StatCard, and has grid layout

---

## Sprint M2: Database Schema Expansion ✅ COMPLETE

**Goal**: Add all required tables for rooms, line items, photos, and assignments.

**Completed**: January 2026

### What's Implemented

All 6 tables have been added to `src/lib/db/schema.ts`:

- **levels** - Floor levels (B, 1, 2, 3, A) with labels
- **rooms** - Room dimensions, materials, and geometry for sketch editor
- **annotations** - Damage markers with position, severity, and affected surfaces
- **lineItems** - Scope items with Xactimate codes, pricing, and AI confidence
- **photos** - Documentation photos with GPS, timestamps, and type classification
- **assignments** - E/A/R/P/C/Z assignment types with totals calculations

Additional features:
- 3 new pgEnums: `photoTypeEnum`, `assignmentTypeEnum`, `assignmentStatusEnum`
- Full TypeScript types exported for all tables
- Cascade delete relationships to estimates
- JSONB columns for geometry and affected surfaces

### Database Tables Added

#### US-M2-1: Levels Table ✅
**Purpose**: Track floor levels (Basement, 1st, 2nd, 3rd, Attic)

```typescript
export const levels = pgTable('levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "1", "2", "B", "A"
  label: text('label'), // "First Floor", "Basement"
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Progress Check**: ✅ schema.ts contains "levels" table definition

---

#### US-M2-2: Rooms Table ✅
**Purpose**: Store room dimensions and metadata

```typescript
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  levelId: uuid('level_id').references(() => levels.id),
  name: text('name').notNull(),
  category: text('category'), // kitchen, bathroom, bedroom, etc.
  lengthIn: real('length_in'),
  widthIn: real('width_in'),
  heightIn: real('height_in').default(96),
  squareFeet: real('square_feet'),
  cubicFeet: real('cubic_feet'),
  perimeterLf: real('perimeter_lf'),
  wallSf: real('wall_sf'),
  ceilingSf: real('ceiling_sf'),
  floorMaterial: text('floor_material'),
  wallMaterial: text('wall_material'),
  ceilingMaterial: text('ceiling_material'),
  geometry: jsonb('geometry'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Progress Check**: ✅ schema.ts contains "rooms" table with "squareFeet"

---

#### US-M2-3: Annotations Table ✅
**Purpose**: Damage markers with position and severity

```typescript
export const annotations = pgTable('annotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  damageType: text('damage_type'), // water, fire, smoke, mold
  severity: text('severity'), // light, moderate, heavy, severe
  category: text('category'), // cat1, cat2, cat3
  positionX: real('position_x'),
  positionY: real('position_y'),
  positionZ: real('position_z'),
  affectedSurfaces: jsonb('affected_surfaces'),
  affectedHeightIn: real('affected_height_in'),
  affectedAreaSf: real('affected_area_sf'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Progress Check**: ✅ schema.ts contains "annotations" table with "damageType"

---

#### US-M2-4: Line Items Table ✅
**Purpose**: Scope of work items with pricing

```typescript
export const lineItems = pgTable('line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id),
  annotationId: uuid('annotation_id').references(() => annotations.id),
  category: text('category'), // WTR, DRY, DEM, FLR, PNT
  selector: text('selector'), // Xactimate code
  description: text('description'),
  quantity: real('quantity'),
  unit: text('unit'), // SF, LF, EA, SY, HR
  unitPrice: real('unit_price'),
  total: real('total'),
  source: text('source').default('manual'),
  aiConfidence: real('ai_confidence'),
  verified: boolean('verified').default(false),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Progress Check**: ✅ schema.ts contains "lineItems" with "selector"

---

#### US-M2-5: Photos Table ✅
**Purpose**: Claim documentation photos

```typescript
export const photoTypeEnum = pgEnum('photo_type', ['BEFORE', 'DURING', 'AFTER', 'DAMAGE', 'EQUIPMENT', 'OVERVIEW']);

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id),
  annotationId: uuid('annotation_id').references(() => annotations.id),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  filename: text('filename'),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  photoType: photoTypeEnum('photo_type'),
  caption: text('caption'),
  takenAt: timestamp('taken_at'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Progress Check**: ✅ schema.ts contains "photos" table with "photoType" enum

---

#### US-M2-6: Assignments Table ✅
**Purpose**: Track E/A/R/P/C/Z assignment types

```typescript
export const assignmentTypeEnum = pgEnum('assignment_type', ['E', 'A', 'R', 'P', 'C', 'Z']);
export const assignmentStatusEnum = pgEnum('assignment_status', ['pending', 'in_progress', 'submitted', 'approved', 'completed']);

export const assignments = pgTable('assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  type: assignmentTypeEnum('type').notNull(),
  status: assignmentStatusEnum('status').default('pending'),
  subtotal: real('subtotal').default(0),
  overhead: real('overhead').default(0),
  profit: real('profit').default(0),
  tax: real('tax').default(0),
  total: real('total').default(0),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Progress Check**: ✅ schema.ts contains "assignments" table with "type" enum

### Migration Notes

Run `npx drizzle-kit push` with DATABASE_URL set to apply schema to database.

---

## Sprint M3: Rooms & Sketch Editor ✅ COMPLETE

**Goal**: Port the full sketch editor from V2 with all drawing tools.

**Completed**: January 2026

### What's Implemented

The complete sketch editor has been built from scratch with all required functionality:

**Core Components** (in `src/components/sketch-editor/`):
- `SketchEditor.tsx` - Main editor component with full-screen modal
- `SketchCanvas.tsx` - React Konva canvas with pan/zoom/touch support
- `Toolbar.tsx` - Tool selection with keyboard shortcuts
- `LevelTabs.tsx` - Multi-floor level management

**Layer Components** (in `src/components/sketch-editor/layers/`):
- `GridLayer.tsx` - Grid background with major/minor lines
- `WallsLayer.tsx` - Wall drawing with length labels
- `DoorsLayer.tsx` - 5 door types (single, double, pocket, bi-fold, sliding)
- `WindowsLayer.tsx` - 4 window types (hung, casement, sliding, picture)
- `FixturesLayer.tsx` - Kitchen, bathroom, and laundry fixtures
- `StaircasesLayer.tsx` - Straight, L-shaped, and U-shaped stairs

**Geometry Utilities** (in `src/lib/geometry/`):
- `types.ts` - TypeScript interfaces for all geometry objects
- `snapping.ts` - Wall snapping (endpoint, midpoint, perpendicular, grid)
- `room-detection.ts` - Detect enclosed rooms from walls
- `staircase.ts` - Stair calculation utilities

**API Routes**:
- `GET/POST /api/estimates/[id]/levels` - Level management
- `GET/PATCH/DELETE /api/estimates/[id]/levels/[levelId]` - Single level operations
- `GET/POST /api/estimates/[id]/rooms` - Room management
- `GET/PATCH/DELETE /api/estimates/[id]/rooms/[roomId]` - Single room operations

**UI Integration**:
- Tab navigation on estimate detail page (Details, Rooms, Scope, Photos, SLA)
- RoomsTab component with room cards and add/edit/delete functionality
- Sketch editor opens in full-screen modal from Rooms tab

### Components Completed

#### US-M3-1: Rooms Tab on Estimate Detail ✅
- [x] Tab navigation: Details, Rooms, Scope, Photos, SLA
- [x] Rooms list showing all rooms for estimate
- [x] Room cards with dimensions
- [x] Add Room button
- [x] Edit/Delete room actions

---

#### US-M3-2: Sketch Canvas (Konva.js) ✅
- [x] React Konva canvas setup
- [x] Grid layer with snapping
- [x] Pan and zoom controls
- [x] Touch support for mobile

---

#### US-M3-3: Wall Drawing Tool ✅
- [x] Click to start wall
- [x] Click to end wall
- [x] Wall snapping (6 types)
- [x] Wall thickness display
- [x] Double-click to finish

---

#### US-M3-4: Door Tool ✅
- [x] Place door on wall
- [x] Door types: single, double, pocket, bi-fold, sliding
- [x] Swing direction
- [x] Door symbol rendering

---

#### US-M3-5: Window Tool ✅
- [x] Place window on wall
- [x] Window types: hung, casement, sliding, picture
- [x] Window symbol rendering

---

#### US-M3-6: Fixture Tool ✅
- [x] Kitchen fixtures: sink, stove, fridge, dishwasher
- [x] Bathroom fixtures: toilet, tub, shower, vanity
- [x] Laundry fixtures: washer, dryer

---

#### US-M3-7: Staircase Tool ✅
- [x] Straight stairs
- [x] L-shaped stairs
- [x] U-shaped stairs
- [x] Auto tread calculation

---

#### US-M3-8: Room Detection ✅
- [x] Detect enclosed rooms from walls
- [x] Calculate room area
- [x] Room naming
- [x] Room category assignment

---

#### US-M3-9: Toolbar Component ✅
- [x] Tool selection buttons
- [x] Active tool highlight
- [x] Keyboard shortcuts
- [x] Tool options panel

---

#### US-M3-10: Level Tabs ✅
- [x] Multi-level support (B, 1, 2, 3, A)
- [x] Add/remove levels
- [x] Level switching
- [x] Per-level sketch data

---

## Sprint M4: Line Items & Pricing ✅ COMPLETE

**Goal**: Full line item management with Xactimate compatibility.

**Completed**: January 2026

### What's Implemented

All 8 tasks completed with full line item management:

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
- `src/components/features/scope-tab.tsx` - Full line items table with inline editing
- `src/components/features/totals-summary.tsx` - Editable totals display

**Export Updates**:
- PDF export now includes line items table with totals
- Excel export includes separate "Line Items" worksheet

#### US-M4-1: Line Items API ✅
- [x] GET /api/line-items?estimateId=X
- [x] POST /api/line-items
- [x] PATCH /api/line-items/[id]
- [x] DELETE /api/line-items/[id]
- [x] POST /api/line-items/bulk (for AI suggestions)

**Progress Check**: /api/line-items/route.ts exists with GET and POST

---

#### US-M4-2: Scope Tab UI ✅
- [x] Line items table with columns
- [x] Inline editing
- [x] Category grouping
- [x] Add item form
- [x] Delete confirmation

**Progress Check**: Scope tab exists with editable table

---

#### US-M4-3: Xactimate Categories ✅
- [x] Category reference data (WTR, DRY, DEM, etc.)
- [x] Selector code lookup
- [x] Unit type validation

**Source Files (V2)**:
- `src/lib/reference/xactimate-categories.ts`

**Progress Check**: xactimate-categories.ts exists

---

#### US-M4-4: Price List Import ✅
- [x] CSV upload endpoint
- [x] XLSX support
- [x] Column mapping
- [x] Price list storage

**Source Files (V2)**:
- `src/lib/pricing/parser.ts`

**Progress Check**: price-lists API route exists

---

#### US-M4-5: Totals Calculation ✅
- [x] Line item total = qty × unit price
- [x] Subtotal = sum of line totals
- [x] Overhead = subtotal × overhead%
- [x] Profit = subtotal × profit%
- [x] Tax = (subtotal + overhead + profit) × tax%
- [x] Grand total calculation

**Progress Check**: Estimate shows calculated total

---

#### US-M4-6: AI Scope Integration ✅
- [x] AI suggestions save to line_items table
- [x] Accept/reject individual suggestions
- [x] Bulk accept all
- [x] Source tracking (ai_generated)

**Progress Check**: AI modal saves to database

---

#### US-M4-7: Line Item Reordering ✅
- [x] Drag to reorder within category
- [x] Order persisted to database
- [x] Smooth animation

**Progress Check**: Line items have drag handle

---

#### US-M4-8: Export with Line Items ✅
- [x] PDF includes line items table
- [x] Excel includes line items sheet
- [ ] ESX includes scope data (deferred to future sprint)

**Progress Check**: PDF export shows line items

---

## Sprint M5: Photos & Documentation ✅ COMPLETE

**Goal**: Photo upload, gallery, and documentation management.

**Completed**: January 2026

### What's Implemented

Full photo management system with Vercel Blob storage:

**API Routes** (in `src/app/api/photos/`):
- `GET /api/photos?estimateId=X` - List photos with optional type/room filters
- `POST /api/photos` - Upload photo (multipart/form-data)
- `GET/PATCH/DELETE /api/photos/[id]` - Single photo operations

**Components** (in `src/components/features/`):
- `photo-gallery.tsx` - Grid view with thumbnails, type badges, hover actions
- `photo-lightbox.tsx` - Full-screen viewer with keyboard nav, caption editing, room linking
- `photo-upload.tsx` - Upload modal with drag-drop, camera capture, GPS tagging
- `photos-tab.tsx` - Main Photos tab with type filters and upload button

**Features**:
- Vercel Blob storage (max 10MB per file)
- 6 photo types: Before, During, After, Damage, Equipment, Overview
- GPS location tagging (optional, user-controlled)
- Photo-to-room linking in lightbox
- Filter gallery by photo type
- PDF export with up to 12 photos in 2-column grid
- Excel export with photo counts by type

#### US-M5-1: Photo Upload API ✅
- [x] POST /api/photos (multipart)
- [x] File validation (type, size)
- [x] Vercel Blob storage integration
- [x] Metadata (GPS, timestamp, type) capture

---

#### US-M5-2: Photo Gallery Component ✅
- [x] Grid view of photos
- [x] Filter by type (Before, During, After, Damage, Equipment, Overview)
- [x] Lightbox zoom with keyboard navigation
- [x] Caption editing in lightbox

---

#### US-M5-3: Photo Capture (Mobile) ✅
- [x] Camera access on mobile via capture="environment"
- [x] Photo type selection before upload
- [x] GPS tagging (optional toggle)
- [x] Timestamp capture

---

#### US-M5-4: Photo Linking ✅
- [x] Link photo to room (in lightbox dropdown)
- [x] Room indicator on photo thumbnails
- [x] Note: Photo counts on room cards deferred to future sprint

---

#### US-M5-5: Photos Tab on Estimate ✅
- [x] Photos tab in estimate detail
- [x] Upload button with modal
- [x] Gallery view with type filters
- [x] Delete with confirmation

---

#### US-M5-6: Export with Photos ✅
- [x] PDF includes photo thumbnails (up to 12 photos)
- [x] Excel includes photo counts by type
- [x] Note: ESX ZIP format deferred to future sprint

---

## Sprint M6: SLA & Workflow ✅ COMPLETE

**Goal**: Insurance carrier SLA tracking and workflow management.

**Completed**: January 2026

### What's Implemented

Full SLA tracking system with carrier configuration and milestone management:

**Database Tables** (in `src/lib/db/schema.ts`):
- `carriers` - Insurance company configuration with contact info
- `carrier_sla_rules` - Carrier-specific SLA target hours per milestone
- `sla_events` - Actual milestone completions with timestamps
- `slaMilestoneEnum` - 7 milestones (assigned, contacted, site_visit, estimate_uploaded, revision_requested, approved, closed)
- Added `carrierId` to estimates table for carrier association

**SLA Library** (in `src/lib/sla/`):
- `types.ts` - TypeScript types, milestone labels, and descriptions
- `calculations.ts` - Status calculation, hours remaining, compliance rate
- `index.ts` - Module exports

**API Routes**:
- `GET/POST /api/carriers` - List and create carriers
- `POST /api/carriers/seed` - Seed major insurance carriers (State Farm, Allstate, etc.)
- `GET/POST /api/sla-events` - List events, initialize tracking, create events
- `GET/PATCH/DELETE /api/sla-events/[id]` - Single event operations, complete milestone

**UI Components** (in `src/components/features/`):
- `sla-tab.tsx` - Timeline view with milestone cards, complete buttons, time remaining/overdue
- `sla-badge.tsx` - Status badges (SLABadge, SLAIndicator, SLADot)
- `sla-dashboard-widget.tsx` - Dashboard widget with at-risk/overdue counts, compliance rate
- `carrier-selector.tsx` - Dropdown to select carrier on insurance estimates

**Integration**:
- SLA Tab on estimate detail page (replaces placeholder)
- SLA Dashboard Widget in main dashboard layout
- Carrier selector in Insurance Details section for insurance jobs

#### US-M6-1: Carrier Configuration ✅
- [x] Carriers table/config
- [x] SLA rules per carrier
- [x] Target hours configuration
- [x] 10 major carriers seeded (State Farm, Allstate, Farmers, USAA, Progressive, GEICO, Liberty Mutual, Travelers, Nationwide, AIG)

**Progress Check**: ✅ carriers table exists

---

#### US-M6-2: SLA Events Tracking ✅
- [x] SLA event log table
- [x] Milestone tracking (7 milestones)
- [x] Status transitions with automatic overdue detection

**Progress Check**: ✅ sla_events table exists

---

#### US-M6-3: SLA Tab on Estimate ✅
- [x] Timeline of milestones with visual progress
- [x] Target vs actual times displayed
- [x] At-risk warnings (yellow, within 4 hours)
- [x] Overdue indicators (red, animated)
- [x] Complete milestone button

**Progress Check**: ✅ SLA tab exists with timeline

---

#### US-M6-4: Status Workflow ✅
- [x] Initialize SLA tracking on estimate
- [x] Status transitions API (PATCH /api/sla-events/[id])
- [x] Automatic overdue detection on completion

**Progress Check**: ✅ Status change API exists

---

#### US-M6-5: SLA Dashboard Widget ✅
- [x] At-risk estimates count
- [x] Overdue estimates count
- [x] SLA compliance percentage
- [x] Critical items list with quick links

**Progress Check**: ✅ Dashboard shows SLA widget

---

#### US-M6-6: SLA Badges ✅
- [x] On-time badge (green)
- [x] At-risk badge (yellow)
- [x] Overdue badge (red)
- [x] Completed badge (blue)
- [x] Pending badge (gray)
- [x] SLADot for minimal display with pulse animation

**Progress Check**: ✅ SLA badge component exists

---

## Sprint M7: Portfolio & Analytics ✅ COMPLETE

**Goal**: Portfolio dashboard and analytics views.

**Completed**: January 2026

### What's Implemented

Full portfolio and analytics dashboards with charts and data visualization:

**Portfolio Page** (`/dashboard/portfolio`):
- Summary metrics (total claims, completed, in progress, total value, avg completion, at-risk count)
- Activity feed showing recent estimate activities
- At-risk list with SLA status indicators
- Carrier breakdown donut chart

**Analytics Page** (`/dashboard/analytics`):
- Date range picker with presets (7d, 30d, 90d, 1y, YTD, All time)
- Revenue over time area chart with trends
- Claims by status pie chart
- Monthly claims volume bar chart
- Team performance metrics table with sortable columns
- Export to PDF and Excel

**Components** (in `src/components/portfolio/` and `src/components/analytics/`):
- `activity-feed.tsx` - Activity log with user avatars, timestamps, action types
- `carrier-breakdown.tsx` - Donut chart with carrier stats table
- `at-risk-list.tsx` - SLA at-risk/overdue estimates with urgency sorting
- `date-range-picker.tsx` - Date range selection with presets
- `revenue-chart.tsx` - Area chart with trend calculation
- `team-metrics.tsx` - Sortable metrics table per team member
- `export-analytics.tsx` - PDF/Excel export with jsPDF and ExcelJS

**API Routes**:
- `GET /api/portfolio` - Portfolio stats, activities, carriers, at-risk estimates
- `GET /api/analytics` - Analytics stats, charts data, team metrics (date range filtered)

**Navigation**:
- Portfolio link in sidebar (already existed)
- Analytics link added to sidebar with LineChart icon

#### US-M7-1: Portfolio Page ✅
- [x] /portfolio route
- [x] Summary metrics (6 stat cards)
- [x] Activity feed (recent 10 activities)
- [x] At-risk list with SLA status

**Progress Check**: ✅ /portfolio page exists

---

#### US-M7-2: Analytics Page ✅
- [x] /analytics route
- [x] Date range picker with presets
- [x] Revenue chart (area chart with trend)
- [x] Trends visualization (bar chart, pie chart)

**Progress Check**: ✅ /analytics page exists

---

#### US-M7-3: Team Metrics ✅
- [x] Per-user stats
- [x] Claims completed count
- [x] Average time (completion hours)
- [x] Revenue breakdown per member
- [x] Sortable columns

**Progress Check**: ✅ Team metrics component exists

---

#### US-M7-4: Carrier Breakdown ✅
- [x] Claims by carrier
- [x] Pie/donut chart with colors
- [x] Carrier stats table with click handler

**Progress Check**: ✅ Carrier breakdown chart exists

---

#### US-M7-5: Activity Feed ✅
- [x] Recent activity log
- [x] User avatars/initials
- [x] Action descriptions (created, updated, status changed)
- [x] Relative timestamps ("2h ago")
- [x] Activity type icons and colors

**Progress Check**: ✅ ActivityFeed component exists

---

#### US-M7-6: Export Analytics ✅
- [x] PDF report generation with jsPDF
- [x] Excel export with ExcelJS
- [x] Date range in report header
- [x] Metrics summary section

**Progress Check**: ✅ Analytics export button exists

---

## Sprint M8: Vendor Portal 🔴 NOT STARTED

**Goal**: Vendor/subcontractor portal for quotes.

#### US-M8-1: Vendor Data Model
- [ ] Vendors table
- [ ] Quote requests table
- [ ] Vendor quotes table

**Progress Check**: vendors table exists

---

#### US-M8-2: Vendor Portal Routes
- [ ] /vendor (dashboard)
- [ ] /vendor/login
- [ ] /vendor/quotes/[id]

**Progress Check**: /vendor routes exist

---

#### US-M8-3: Token-Based Auth
- [ ] Vendor invite with token
- [ ] Token validation
- [ ] Session management

**Progress Check**: Vendor auth middleware exists

---

#### US-M8-4: Quote Request Flow
- [ ] Create quote request
- [ ] Select line items
- [ ] Send to vendor (email)

**Progress Check**: Quote request API exists

---

#### US-M8-5: Vendor Quote Submission
- [ ] View scope details
- [ ] Enter pricing
- [ ] Submit quote
- [ ] Track status

**Progress Check**: Vendor quote form exists

---

#### US-M8-6: Quote Comparison
- [ ] View multiple quotes
- [ ] Side-by-side comparison
- [ ] Accept/reject quotes

**Progress Check**: Quote comparison view exists

---

## Progress Tracking

### Sprint Completion Formula

```
Sprint Progress = (Completed Tasks / Total Tasks) × 100
```

### Task Status Definitions

- **🔴 NOT STARTED**: No work begun
- **🟡 IN PROGRESS**: Work started, not complete
- **🟢 COMPLETE**: All acceptance criteria met

### Validation Rules

Each task has a **Progress Check** that can be validated by:
1. File existence check
2. Content string search
3. Database schema inspection

These checks are **non-server functions** - they run at build time or via file system inspection.

---

## RALPH Methodology Checklist

For each sprint:

1. **R**equirements - Read this PRD section
2. **A**rchitecture - Check CLAUDE.md patterns
3. **L**LM Implementation - Follow prompts from Command Center
4. **P**rogress - Update status in Command Center
5. **H**andoff - Document any deviations

---

## File Reference

### V2 Source Files by Sprint

```
Sprint M1 (Dashboard):
├── src/components/dashboard/sidebar.tsx
├── src/components/dashboard/welcome-banner.tsx
├── src/components/dashboard/stat-card.tsx
├── src/components/dashboard/estimate-table.tsx
├── src/components/dashboard/projects-map.tsx
└── src/components/dashboard/performance-metrics.tsx

Sprint M3 (Sketch Editor):
├── src/components/sketch-editor/SketchCanvas.tsx
├── src/components/sketch-editor/Toolbar.tsx
├── src/components/sketch-editor/layers/WallsLayer.tsx
├── src/components/sketch-editor/layers/DoorsLayer.tsx
├── src/components/sketch-editor/layers/WindowsLayer.tsx
├── src/components/sketch-editor/layers/FixturesLayer.tsx
├── src/components/sketch-editor/layers/StaircasesLayer.tsx
├── src/components/sketch-editor/layers/RoomsLayer.tsx
├── src/components/sketch-editor/LevelTabs.tsx
├── src/lib/geometry/snapping.ts
├── src/lib/geometry/room-detection.ts
└── src/lib/geometry/staircase.ts

Sprint M4 (Pricing):
├── src/lib/reference/xactimate-categories.ts
├── src/lib/pricing/parser.ts
└── src/lib/calculations/room-calculations.ts

Sprint M5 (Photos):
├── src/components/property-viewer/PhotoGallery.tsx
└── src/components/property-viewer/PhotoLightbox.tsx

Sprint M6 (SLA):
├── src/lib/sla/types.ts
├── src/lib/sla/calculations.ts
└── src/components/sla/SLAStatusBadge.tsx

Sprint M7 (Analytics):
├── src/components/portfolio/ActivityFeed.tsx
├── src/components/portfolio/CarrierBreakdown.tsx
├── src/components/analytics/BarChart.tsx
└── src/components/analytics/LineChart.tsx
```

---

*Last Updated: January 20, 2026*
