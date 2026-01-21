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

### Database Schema (Target: 15 tables vs V2's 35)
Core tables:
- `estimates` - Core estimate records with property info
- `estimate_items` - Line items with quantities (planned)
- `rooms` - Room data with dimensions (planned)
- `templates` - Reusable estimate templates (planned)
- `materials` - Material catalog (planned)
- `labor_rates` - Labor pricing (planned)

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

### Stage 5: Mobile Sync 🟡 PARTIAL
**User Stories:**
- US-009: PWA installation on mobile (next-pwa installed, needs full config)
- US-010: Offline estimate viewing (working with IndexedDB)

**Technical:**
- IndexedDB storage (src/lib/offline/storage.ts)
- Sync queue for pending changes
- useOnlineStatus, useSyncStatus hooks
- OfflineIndicator component
- TODO: Full PWA manifest and service worker

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

### Future Stages (Post-MVP)
- Stage 7: Line Items & Pricing
- Stage 8: Room Management
- Stage 9: Templates System
- Stage 10: Vendor Portal
- Stage 11: Real-time Collaboration
- Stage 12: Advanced Analytics

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
