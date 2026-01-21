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
| **M3** | Rooms & Sketch Editor | 10 | 🔴 NOT STARTED |
| **M4** | Line Items & Pricing | 8 | 🔴 NOT STARTED |
| **M5** | Photos & Documentation | 6 | 🔴 NOT STARTED |
| **M6** | SLA & Workflow | 6 | 🔴 NOT STARTED |
| **M7** | Portfolio & Analytics | 6 | 🔴 NOT STARTED |
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

## Sprint M3: Rooms & Sketch Editor 🔴 NOT STARTED

**Goal**: Port the full sketch editor from V2 with all drawing tools.

### Components to Port

#### US-M3-1: Rooms Tab on Estimate Detail
- [ ] Tab navigation: Details, Rooms, Scope, Photos, SLA
- [ ] Rooms list showing all rooms for estimate
- [ ] Room cards with dimensions
- [ ] Add Room button
- [ ] Edit/Delete room actions

**Progress Check**: estimates/[id]/page.tsx contains tab for "Rooms"

---

#### US-M3-2: Sketch Canvas (Konva.js)
- [ ] React Konva canvas setup
- [ ] Grid layer with snapping
- [ ] Pan and zoom controls
- [ ] Touch support for mobile

**Source Files (V2)**:
- `src/components/sketch-editor/SketchCanvas.tsx`

**Progress Check**: SketchCanvas.tsx exists AND imports "react-konva"

---

#### US-M3-3: Wall Drawing Tool
- [ ] Click to start wall
- [ ] Click to end wall
- [ ] Wall snapping (6 types)
- [ ] Wall thickness display
- [ ] Double-click to finish

**Source Files (V2)**:
- `src/components/sketch-editor/layers/WallsLayer.tsx`
- `src/lib/geometry/snapping.ts`

**Progress Check**: WallsLayer.tsx exists with "onWallClick" handler

---

#### US-M3-4: Door Tool
- [ ] Place door on wall
- [ ] Door types: single, double, pocket, bi-fold, sliding
- [ ] Swing direction
- [ ] Door symbol rendering

**Progress Check**: DoorsLayer.tsx exists with door types

---

#### US-M3-5: Window Tool
- [ ] Place window on wall
- [ ] Window types: hung, casement, sliding, picture
- [ ] Window symbol rendering

**Progress Check**: WindowsLayer.tsx exists

---

#### US-M3-6: Fixture Tool
- [ ] Kitchen fixtures: sink, stove, fridge, dishwasher
- [ ] Bathroom fixtures: toilet, tub, shower, vanity
- [ ] Laundry fixtures: washer, dryer

**Progress Check**: FixturesLayer.tsx exists with fixture types

---

#### US-M3-7: Staircase Tool
- [ ] Straight stairs
- [ ] L-shaped stairs
- [ ] U-shaped stairs
- [ ] Auto tread calculation

**Source Files (V2)**:
- `src/lib/geometry/staircase.ts`
- `src/components/sketch-editor/layers/StaircasesLayer.tsx`

**Progress Check**: StaircasesLayer.tsx exists

---

#### US-M3-8: Room Detection
- [ ] Detect enclosed rooms from walls
- [ ] Calculate room area
- [ ] Room naming
- [ ] Room category assignment

**Source Files (V2)**:
- `src/lib/geometry/room-detection.ts`

**Progress Check**: room-detection.ts exists with "detectRooms" function

---

#### US-M3-9: Toolbar Component
- [ ] Tool selection buttons
- [ ] Active tool highlight
- [ ] Keyboard shortcuts
- [ ] Tool options panel

**Progress Check**: Toolbar.tsx exists with tool selection

---

#### US-M3-10: Level Tabs
- [ ] Multi-level support (B, 1, 2, 3, A)
- [ ] Add/remove levels
- [ ] Level switching
- [ ] Per-level sketch data

**Progress Check**: LevelTabs.tsx exists

---

## Sprint M4: Line Items & Pricing 🔴 NOT STARTED

**Goal**: Full line item management with Xactimate compatibility.

#### US-M4-1: Line Items API
- [ ] GET /api/line-items?estimateId=X
- [ ] POST /api/line-items
- [ ] PATCH /api/line-items/[id]
- [ ] DELETE /api/line-items/[id]
- [ ] POST /api/line-items/bulk (for AI suggestions)

**Progress Check**: /api/line-items/route.ts exists with GET and POST

---

#### US-M4-2: Scope Tab UI
- [ ] Line items table with columns
- [ ] Inline editing
- [ ] Category grouping
- [ ] Add item form
- [ ] Delete confirmation

**Progress Check**: Scope tab exists with editable table

---

#### US-M4-3: Xactimate Categories
- [ ] Category reference data (WTR, DRY, DEM, etc.)
- [ ] Selector code lookup
- [ ] Unit type validation

**Source Files (V2)**:
- `src/lib/reference/xactimate-categories.ts`

**Progress Check**: xactimate-categories.ts exists

---

#### US-M4-4: Price List Import
- [ ] CSV upload endpoint
- [ ] XLSX support
- [ ] Column mapping
- [ ] Price list storage

**Source Files (V2)**:
- `src/lib/pricing/parser.ts`

**Progress Check**: price-lists API route exists

---

#### US-M4-5: Totals Calculation
- [ ] Line item total = qty × unit price
- [ ] Subtotal = sum of line totals
- [ ] Overhead = subtotal × overhead%
- [ ] Profit = subtotal × profit%
- [ ] Tax = (subtotal + overhead + profit) × tax%
- [ ] Grand total calculation

**Progress Check**: Estimate shows calculated total

---

#### US-M4-6: AI Scope Integration
- [ ] AI suggestions save to line_items table
- [ ] Accept/reject individual suggestions
- [ ] Bulk accept all
- [ ] Source tracking (ai_generated)

**Progress Check**: AI modal saves to database

---

#### US-M4-7: Line Item Reordering
- [ ] Drag to reorder within category
- [ ] Order persisted to database
- [ ] Smooth animation

**Progress Check**: Line items have drag handle

---

#### US-M4-8: Export with Line Items
- [ ] PDF includes line items table
- [ ] Excel includes line items sheet
- [ ] ESX includes scope data

**Progress Check**: PDF export shows line items

---

## Sprint M5: Photos & Documentation 🔴 NOT STARTED

**Goal**: Photo upload, gallery, and documentation management.

#### US-M5-1: Photo Upload API
- [ ] POST /api/photos/upload (multipart)
- [ ] Resize and thumbnail generation
- [ ] EXIF data extraction
- [ ] Storage integration (Vercel Blob or similar)

**Progress Check**: /api/photos/upload/route.ts exists

---

#### US-M5-2: Photo Gallery Component
- [ ] Grid view of photos
- [ ] Filter by type (Before, During, After, Damage)
- [ ] Lightbox zoom
- [ ] Caption editing

**Source Files (V2)**:
- `src/components/property-viewer/PhotoGallery.tsx`

**Progress Check**: PhotoGallery component exists

---

#### US-M5-3: Photo Capture (Mobile)
- [ ] Camera access on mobile
- [ ] Photo type selection
- [ ] GPS tagging
- [ ] Timestamp capture

**Progress Check**: Camera input in photo upload

---

#### US-M5-4: Photo Linking
- [ ] Link photo to room
- [ ] Link photo to annotation
- [ ] Photo counts on room cards

**Progress Check**: Photo form has room selector

---

#### US-M5-5: Photos Tab on Estimate
- [ ] Photos tab in estimate detail
- [ ] Upload button
- [ ] Gallery view
- [ ] Delete with confirmation

**Progress Check**: Photos tab exists

---

#### US-M5-6: Export with Photos
- [ ] PDF includes photo thumbnails
- [ ] ESX includes photos in ZIP

**Progress Check**: PDF shows photos

---

## Sprint M6: SLA & Workflow 🔴 NOT STARTED

**Goal**: Insurance carrier SLA tracking and workflow management.

#### US-M6-1: Carrier Configuration
- [ ] Carriers table/config
- [ ] SLA rules per carrier
- [ ] Target hours configuration

**Source Files (V2)**:
- `src/lib/db/schema.ts` (carriers, carrierSlaRules)

**Progress Check**: carriers table exists

---

#### US-M6-2: SLA Events Tracking
- [ ] SLA event log table
- [ ] Milestone tracking
- [ ] Status transitions

**Progress Check**: sla_events table exists

---

#### US-M6-3: SLA Tab on Estimate
- [ ] Timeline of milestones
- [ ] Target vs actual times
- [ ] At-risk warnings
- [ ] Overdue indicators

**Progress Check**: SLA tab exists with timeline

---

#### US-M6-4: Status Workflow
- [ ] Draft → In Progress → Complete flow
- [ ] Status transitions API
- [ ] Validation rules

**Progress Check**: Status change API exists

---

#### US-M6-5: SLA Dashboard Widget
- [ ] At-risk estimates count
- [ ] SLA compliance rate
- [ ] Overdue list

**Progress Check**: Dashboard shows SLA widget

---

#### US-M6-6: SLA Badges
- [ ] On-time badge (green)
- [ ] At-risk badge (yellow)
- [ ] Overdue badge (red)
- [ ] In estimates list

**Progress Check**: SLA badge component exists

---

## Sprint M7: Portfolio & Analytics 🔴 NOT STARTED

**Goal**: Portfolio dashboard and analytics views.

#### US-M7-1: Portfolio Page
- [ ] /portfolio route
- [ ] Summary metrics
- [ ] Activity feed
- [ ] At-risk list

**Source Files (V2)**:
- `src/app/(dashboard)/portfolio/page.tsx`

**Progress Check**: /portfolio page exists

---

#### US-M7-2: Analytics Page
- [ ] /analytics route
- [ ] Date range picker
- [ ] Revenue chart
- [ ] Trends visualization

**Source Files (V2)**:
- `src/app/(dashboard)/analytics/page.tsx`

**Progress Check**: /analytics page exists

---

#### US-M7-3: Team Metrics
- [ ] Per-user stats
- [ ] Claims completed
- [ ] Average time
- [ ] Revenue breakdown

**Progress Check**: Team metrics component exists

---

#### US-M7-4: Carrier Breakdown
- [ ] Claims by carrier
- [ ] Pie/donut chart
- [ ] Carrier badges

**Progress Check**: Carrier breakdown chart exists

---

#### US-M7-5: Activity Feed
- [ ] Recent activity log
- [ ] User avatars
- [ ] Action descriptions
- [ ] Timestamps

**Source Files (V2)**:
- `src/components/portfolio/ActivityFeed.tsx`

**Progress Check**: ActivityFeed component exists

---

#### US-M7-6: Export Analytics
- [ ] PDF report generation
- [ ] Date range export
- [ ] Metrics summary

**Progress Check**: Analytics export button exists

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
