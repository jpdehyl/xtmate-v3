# XTmate V3 - Product Requirements Document

> **Version**: 3.0
> **Last Updated**: January 2026
> **Status**: In Development

---

## Executive Summary

XTmate V3 is a complete rewrite of the XTmate estimation platform, focusing on simplicity, maintainability, and reliability. This version addresses the technical debt and complexity issues from V2 while maintaining all essential functionality.

### Key Objectives
1. **Simplify Architecture**: Reduce from 94 API routes to ~30, from 35 tables to 15
2. **Improve Reliability**: Eliminate build failures, add proper testing
3. **Better DX**: Type-safe APIs, consistent patterns, clear documentation
4. **Staged Deployment**: Deploy early and often, validate each stage

---

## Problem Statement

### V2 Issues
| Problem | Impact | V3 Solution |
|---------|--------|-------------|
| 94 REST API routes | Hard to maintain, type drift | Simplified REST with Zod validation |
| 35 database tables | Over-engineering | 15 targeted tables |
| Auth duplication | Security risk, bugs | Clerk middleware pattern |
| Google Fonts CDN | Build failures | Local fonts |
| <5% test coverage | Fragile deployments | 30% minimum target |
| 60+ fields on estimates | God object anti-pattern | Split into focused tables |

---

## User Personas

### Primary: Field Estimator
- Creates estimates on-site using mobile device
- Needs offline access to estimates
- Exports to PDF/Excel for clients
- Typical workload: 5-10 estimates per day

### Secondary: Office Manager
- Reviews and approves estimates
- Tracks team performance
- Generates reports
- Manages templates

---

## Feature Stages

### Stage 1: Foundation ✅ COMPLETE
**Goal**: Empty shell that deploys to Vercel

**Acceptance Criteria**:
- [x] Next.js 15 + TypeScript setup
- [x] Clerk authentication working
- [x] Neon PostgreSQL connected
- [x] Drizzle ORM configured
- [x] Dashboard shell exists
- [x] Builds in <60s
- [x] Deploys to Vercel

---

### Stage 2: Estimates CRUD ✅ COMPLETE
**Goal**: Basic estimate management

**User Stories**:

**US-001: View Estimates List**
As an estimator, I want to see all my estimates in a list so I can quickly find and manage them.

Acceptance Criteria:
- [x] Dashboard shows all user's estimates
- [x] Sorted by most recently updated
- [x] Shows estimate name, status, job type, date
- [x] Click to open estimate detail

**US-002: Create New Estimate**
As an estimator, I want to create a new estimate with basic information.

Acceptance Criteria:
- [x] "New Estimate" button on dashboard
- [x] Form for name, job type, property address
- [x] Insurance fields shown only for insurance jobs
- [x] Redirects to detail page after creation

**US-003: Edit Estimate**
As an estimator, I want to edit my estimate details and have changes save automatically.

Acceptance Criteria:
- [x] All fields editable inline
- [x] Auto-save on field blur
- [x] Visual feedback when saving
- [x] Status can be changed (draft/in_progress/completed)

**US-004: Delete Estimate**
As an estimator, I want to delete estimates I no longer need.

Acceptance Criteria:
- [x] Delete button on estimate detail
- [x] Confirmation dialog before delete
- [x] Redirects to dashboard after delete

---

### Stage 3: ESX Export ✅ COMPLETE
**Goal**: PDF and Excel export functionality

**User Stories**:

**US-005: Export to PDF**
As an estimator, I want to export my estimate to PDF for client presentations.

Acceptance Criteria:
- [x] "Export PDF" button on estimate detail
- [x] PDF includes: name, address, job type, status
- [x] Professional formatting with XTmate branding
- [x] Downloads directly to browser

**US-006: Export to Excel**
As an estimator, I want to export my estimate to Excel for detailed editing.

Acceptance Criteria:
- [x] "Export Excel" button on estimate detail
- [x] Excel includes all estimate fields
- [x] Proper column headers and formatting
- [x] .xlsx format for compatibility

---

### Stage 4: AI Scope 🔲 PLANNED
**Goal**: AI-powered scope suggestions

**User Stories**:

**US-007: AI Scope Suggestions**
As an estimator, I want AI to suggest scope items based on job type and property details.

Acceptance Criteria:
- [ ] "Suggest Scope" button on estimate detail
- [ ] AI analyzes job type and property info
- [ ] Returns suggested scope items
- [ ] User can accept/dismiss suggestions

**US-008: AI Description Enhancement**
As an estimator, I want AI to improve my estimate descriptions.

Acceptance Criteria:
- [ ] "Enhance" button next to name field
- [ ] AI rewrites professionally
- [ ] Preview before applying
- [ ] One-click accept/dismiss

**Technical Requirements**:
- Anthropic Claude API integration
- POST /api/ai/suggest-scope
- POST /api/ai/enhance-description
- ANTHROPIC_API_KEY environment variable

---

### Stage 5: Mobile Sync 🔲 PLANNED
**Goal**: PWA with offline support

**User Stories**:

**US-009: PWA Installation**
As a field estimator, I want to install XTmate as an app on my phone.

Acceptance Criteria:
- [ ] App installable as PWA
- [ ] App icon and splash screen
- [ ] Works in standalone mode
- [ ] Responsive on mobile

**US-010: Offline Viewing**
As a field estimator, I want to view estimates when offline.

Acceptance Criteria:
- [ ] Service worker caches data
- [ ] Previously viewed estimates accessible
- [ ] Offline indicator visible
- [ ] Auto-sync when online

**Technical Requirements**:
- manifest.json with icons
- Service worker (next-pwa or custom)
- IndexedDB for offline cache
- Online/offline detection

---

### Stage 6: Polish 🔲 PLANNED
**Goal**: UX improvements

**User Stories**:

**US-011: Search & Filter**
As an estimator, I want to search and filter my estimates.

Acceptance Criteria:
- [ ] Search by name/address
- [ ] Filter by status
- [ ] Filter by job type
- [ ] Filters in URL for bookmarking

**US-012: Duplicate Estimate**
As an estimator, I want to duplicate an estimate as a starting point.

Acceptance Criteria:
- [ ] "Duplicate" button on detail page
- [ ] Copy with "(Copy)" suffix
- [ ] Opens new estimate immediately
- [ ] Dates reset to now

**US-013: Loading States**
As a user, I want polished loading states.

Acceptance Criteria:
- [ ] Skeleton loaders throughout
- [ ] Empty state illustrations
- [ ] Toast notifications
- [ ] Smooth transitions

---

## Future Stages (Post-MVP)

### Stage 7: Line Items & Pricing
- Estimate items table
- Material catalog
- Labor rates
- Automatic calculations

### Stage 8: Room Management
- Rooms table
- Room dimensions
- Room-specific scope items

### Stage 9: Templates
- Template creation
- Template library
- Clone from template

### Stage 10: Advanced Features
- Vendor portal
- Real-time collaboration
- Analytics dashboard

---

## Technical Architecture

### Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Auth**: Clerk 6
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS 3.4
- **PDF**: jsPDF
- **Excel**: ExcelJS

### Database Schema (Current)

```sql
-- estimates table
id: uuid (PK)
userId: text (Clerk user ID)
name: text
status: enum (draft, in_progress, completed)
jobType: enum (private, insurance)
propertyAddress: text
propertyCity: text
propertyState: text
propertyZip: text
claimNumber: text (insurance only)
policyNumber: text (insurance only)
createdAt: timestamp
updatedAt: timestamp
```

### API Routes (Current)

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/estimates | List user's estimates |
| POST | /api/estimates | Create estimate |
| GET | /api/estimates/[id] | Get estimate |
| PATCH | /api/estimates/[id] | Update estimate |
| DELETE | /api/estimates/[id] | Delete estimate |
| GET | /api/estimates/[id]/export | Export PDF/Excel |

---

## Success Metrics

### Performance
- Build time: <60 seconds
- Page load: <2 seconds
- API response: <500ms

### Quality
- Test coverage: >30%
- TypeScript strict: enabled
- Zero build errors

### User Experience
- Mobile responsive
- Offline capable (Stage 5)
- Auto-save functionality

---

## Appendix

### Environment Variables
```
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
DATABASE_URL=
ANTHROPIC_API_KEY= (Stage 4)
```

### Commands
```bash
npm run dev        # Development
npm run build      # Production build
npm run test       # Run tests
npm run db:studio  # Database GUI
npm run db:migrate # Run migrations
```

---

*Document maintained by Claude Code. Last updated: January 2026*
