import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

interface AgentPrompt {
  id: string;
  name: string;
  category: "implementation" | "review" | "agent";
  description: string;
  icon: string;
  prompt: string;
  taskIds?: string[];
  agentRole?: string;
}

const STANDARD_HEADER = `## CRITICAL: Read These Files First

Before writing ANY code, you MUST read and understand:

1. **CLAUDE.md** - Project knowledge base with architecture, patterns, and constraints
2. **PRD.md** - Product Requirements Document at \`docs/PRD.md\`
3. **Database Schema** - Current tables and relationships at \`src/lib/db/schema.ts\`

---

## RALPH Methodology

Follow RALPH (Requirements Analysis for LLM-Powered Handoff):

1. **Requirements Analysis** - Identify all acceptance criteria from PRD
2. **Architecture Review** - Check existing patterns in CLAUDE.md, plan file structure
3. **Implementation** - Follow established patterns, keep it simple, no over-engineering
4. **Progress Tracking** - Update Command Center status after completing each task
5. **Validation** - Run through checklist before marking complete

---

`;

const VALIDATION_FOOTER = `

---

## Before Marking Complete

### Code Quality
- [ ] TypeScript types are complete (no \`any\`)
- [ ] Error handling for all async operations
- [ ] Loading states for async UI
- [ ] Proper HTTP status codes in API routes

### Security
- [ ] Auth check on all protected routes
- [ ] userId scoped on database queries
- [ ] Input validation with Zod

### UX
- [ ] Loading indicators present
- [ ] Error messages user-friendly
- [ ] Mobile responsive

---

## CRITICAL: Update Documentation After Completion

After completing work on this stage, you MUST update the following files:

### 1. Update PRD.md (\`docs/PRD.md\`)
- Mark completed acceptance criteria with [x]
- Update stage status (🟡 PARTIAL → ✅ COMPLETE)
- Add any new acceptance criteria discovered
- Note any deviations from original plan

### 2. Update CLAUDE.md
- Update "Migration Stages" section with completion status
- Add any new patterns or architectural decisions
- Document any new environment variables
- Update "Key Patterns" if new patterns were established

### 3. Update Command Center Prompts (if needed)
- If this stage is now complete, update the prompt to say "COMPLETE - Maintenance Only"
- Add "What's Implemented" section summarizing the work
- Move incomplete items to appropriate future stages

### Example Updates:
\`\`\`markdown
# In PRD.md - Change:
### Stage X: Feature Name 🟡 PARTIAL
# To:
### Stage X: Feature Name ✅ COMPLETE

# In CLAUDE.md - Change:
### Stage X: Feature Name 🟡 PARTIAL
# To:
### Stage X: Feature Name ✅ COMPLETE
\`\`\`

**DO NOT skip this step.** Documentation updates are required for proper handoff to future sessions.
`;

// ============================================================================
// IMPLEMENTATION PROMPTS - One per stage for continuing work
// ============================================================================
const implementationPrompts: AgentPrompt[] = [
  {
    id: "stage1-foundation",
    name: "Stage 1: Foundation",
    category: "implementation",
    description: "Next.js 15, Clerk Auth, Neon Postgres, Drizzle ORM setup",
    icon: "Layers",
    taskIds: ["S1-1", "S1-2", "S1-3", "S1-4", "S1-5", "S1-6"],
    prompt: `${STANDARD_HEADER}
## Task: Complete Stage 1 - Foundation

**Stage**: 1 - Foundation (COMPLETE - Maintenance Only)
**Task IDs**: S1-1 through S1-6

This stage is COMPLETE. Use this prompt only for maintenance or fixes.

### What's Implemented
- Next.js 15 with App Router
- Clerk authentication middleware
- Neon PostgreSQL with Drizzle ORM
- Database schema with estimates table
- Dashboard shell with Header component
- Tailwind CSS styling

### Key Files
- \`src/app/layout.tsx\` - Root layout
- \`src/middleware.ts\` - Clerk auth middleware
- \`src/lib/db/index.ts\` - Database client
- \`src/lib/db/schema.ts\` - Schema definitions

### Maintenance Tasks
If fixing issues, ensure:
- Environment variables are set correctly (CLERK_*, DATABASE_URL)
- Migrations are up to date (\`npm run db:migrate\`)
- No Google Fonts imports (use local fonts only)
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage2-crud",
    name: "Stage 2: Estimates CRUD",
    category: "implementation",
    description: "Create, Read, Update, Delete estimates with auto-save",
    icon: "Database",
    taskIds: ["S2-1", "S2-2", "S2-3", "S2-4", "S2-5", "S2-6"],
    prompt: `${STANDARD_HEADER}
## Task: Complete Stage 2 - Estimates CRUD

**Stage**: 2 - Estimates CRUD (COMPLETE - Maintenance Only)
**Task IDs**: S2-1 through S2-6

This stage is COMPLETE. Use this prompt for maintenance or enhancements.

### What's Implemented
- GET/POST /api/estimates - List and create
- GET/PATCH/DELETE /api/estimates/[id] - Single estimate operations
- Dashboard list page with table view
- Create estimate form (/dashboard/estimates/new)
- Edit estimate page (/dashboard/estimates/[id])
- Auto-save on field blur
- Delete with confirmation modal

### Key Files
- \`src/app/api/estimates/route.ts\` - List/Create API
- \`src/app/api/estimates/[id]/route.ts\` - Detail API
- \`src/app/dashboard/page.tsx\` - Estimates list
- \`src/app/dashboard/estimates/new/page.tsx\` - Create form
- \`src/app/dashboard/estimates/[id]/page.tsx\` - Edit page

### Enhancement Ideas
- Batch operations (multi-select delete)
- Sorting by columns
- Pagination for large lists
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage3-export",
    name: "Stage 3: ESX Export",
    category: "implementation",
    description: "PDF and Excel export with professional formatting",
    icon: "Download",
    taskIds: ["S3-1", "S3-2", "S3-3", "S3-4"],
    prompt: `${STANDARD_HEADER}
## Task: Complete Stage 3 - ESX Export

**Stage**: 3 - ESX Export (COMPLETE - Maintenance Only)
**Task IDs**: S3-1 through S3-4

This stage is COMPLETE. Use this prompt for maintenance or enhancements.

### What's Implemented
- GET /api/estimates/[id]/export?format=pdf - PDF generation
- GET /api/estimates/[id]/export?format=excel - Excel generation
- jsPDF for PDF creation with XTmate branding
- ExcelJS for Excel workbooks with formatting
- Export buttons in estimate detail page header

### Key Files
- \`src/app/api/estimates/[id]/export/route.ts\` - Export API

### PDF Features
- XTmate branded header
- Property information section
- Insurance details (if applicable)
- Status badge with color coding
- Professional fonts and layout

### Excel Features
- Formatted workbook with headers
- Merged cells for sections
- Color-coded status
- Proper column widths

### Enhancement Ideas
- Add line items to exports (when Stage 7 is done)
- Template-based PDF layouts
- Batch export multiple estimates
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage4-ai",
    name: "Stage 4: AI Scope",
    category: "implementation",
    description: "AI-powered scope suggestions using Claude Sonnet 4",
    icon: "Sparkles",
    taskIds: ["S4-1", "S4-2", "S4-3", "S4-4"],
    prompt: `${STANDARD_HEADER}
## Task: Complete Stage 4 - AI Scope

**Stage**: 4 - AI Scope (COMPLETE - Maintenance Only)
**Task IDs**: S4-1 through S4-4

This stage is COMPLETE. Use this prompt for maintenance or enhancements.

### What's Implemented
- @anthropic-ai/sdk installed
- POST /api/ai/suggest-scope - Returns scope suggestions
- POST /api/ai/enhance-description - Improves estimate names
- AIScopeModal component with accept/dismiss
- EnhanceDescriptionModal with preview

### Key Files
- \`src/app/api/ai/suggest-scope/route.ts\` - Scope suggestions API
- \`src/app/api/ai/enhance-description/route.ts\` - Name enhancement API
- \`src/components/features/ai-scope-modal.tsx\` - Suggestions modal
- \`src/components/features/enhance-description-modal.tsx\` - Name modal

### AI Response Format (suggest-scope)
\`\`\`json
{
  "suggestions": [
    {
      "id": "unique-id",
      "category": "Interior | Exterior | Structural",
      "item": "Item name",
      "description": "What needs to be done",
      "estimatedQuantity": 10,
      "unit": "SF | LF | EA"
    }
  ]
}
\`\`\`

### Enhancement Ideas
- Persist accepted suggestions to database (needs line_items table)
- Generate full estimates from AI
- Train on historical estimates for better suggestions
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage5-pwa",
    name: "Stage 5: Mobile Sync",
    category: "implementation",
    description: "PWA with offline support and sync queue",
    icon: "Smartphone",
    taskIds: ["S5-1", "S5-2", "S5-3", "S5-4"],
    prompt: `${STANDARD_HEADER}
## Task: Complete Stage 5 - Mobile Sync

**Stage**: 5 - Mobile Sync (PARTIAL - Needs PWA Config)
**Task IDs**: S5-1 through S5-4

This stage is PARTIALLY COMPLETE. Main remaining work: PWA manifest and service worker config.

### What's Implemented
- next-pwa package installed
- IndexedDB storage for offline cache (\`src/lib/offline/storage.ts\`)
- Sync queue for pending changes (\`src/lib/offline/sync.ts\`)
- useOnlineStatus and useSyncStatus hooks (\`src/lib/offline/hooks.ts\`)
- OfflineIndicator component shows status

### What's Missing
- [ ] manifest.json with proper icons (192x192, 512x512)
- [ ] App icons in public folder
- [ ] Full service worker configuration
- [ ] Splash screen assets

### Key Files
- \`src/lib/offline/storage.ts\` - IndexedDB operations
- \`src/lib/offline/sync.ts\` - Sync queue logic
- \`src/lib/offline/hooks.ts\` - React hooks
- \`src/components/offline-indicator.tsx\` - Status UI
- \`next.config.ts\` - next-pwa config

### TODO: Create manifest.json
\`\`\`json
{
  "name": "XTmate",
  "short_name": "XTmate",
  "description": "Construction estimation tool",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
\`\`\`
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage6-polish",
    name: "Stage 6: Polish",
    category: "implementation",
    description: "Search, filters, duplication, loading states",
    icon: "Wand2",
    taskIds: ["S6-1", "S6-2", "S6-3", "S6-4"],
    prompt: `${STANDARD_HEADER}
## Task: Complete Stage 6 - Polish

**Stage**: 6 - Polish (MOSTLY COMPLETE)
**Task IDs**: S6-1 through S6-4

### What's Implemented
- Dashboard search by name, address, city, claim#, policy#
- Status filter dropdown (draft, in_progress, completed)
- Job type filter dropdown (private, insurance)
- POST /api/estimates/[id]/duplicate endpoint
- Skeleton loaders (EstimatesTableSkeleton, EstimateDetailSkeleton, FiltersSkeleton)
- Empty state with illustration

### What's Missing
- [ ] Toast notifications (sonner or similar)
- [ ] URL-based filter state for bookmarking

### Key Files
- \`src/components/estimates-filters.tsx\` - Search and filter UI
- \`src/components/estimates-list.tsx\` - Table with filters
- \`src/app/api/estimates/[id]/duplicate/route.ts\` - Clone API
- \`src/components/ui/skeleton.tsx\` - Skeleton components

### TODO: Add Toast Notifications
\`\`\`bash
npm install sonner
\`\`\`

Add to layout.tsx:
\`\`\`tsx
import { Toaster } from 'sonner';
// In layout: <Toaster position="bottom-right" />
\`\`\`

Use in components:
\`\`\`tsx
import { toast } from 'sonner';
toast.success('Estimate saved');
toast.error('Failed to save');
\`\`\`
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage7-line-items",
    name: "Stage 7: Line Items & Pricing",
    category: "implementation",
    description: "Add line items with quantities, units, and pricing",
    icon: "List",
    taskIds: ["S7-1", "S7-2", "S7-3", "S7-4"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Stage 7 - Line Items & Pricing

**Stage**: 7 - Line Items & Pricing (NOT STARTED)
**Task IDs**: S7-1 through S7-4

This is the next major feature to implement.

### User Story
As an estimator, I want to add line items with quantities and pricing to my estimates.

### Database Schema Addition
Add to \`src/lib/db/schema.ts\`:

\`\`\`typescript
export const estimateItems = pgTable("estimate_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  estimateId: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // Interior, Exterior, Structural
  name: text("name").notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // SF, LF, EA, HR
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EstimateItem = typeof estimateItems.$inferSelect;
\`\`\`

### API Endpoints Needed
- GET /api/estimates/[id]/items - List items
- POST /api/estimates/[id]/items - Add item
- PATCH /api/estimates/[id]/items/[itemId] - Update item
- DELETE /api/estimates/[id]/items/[itemId] - Delete item
- POST /api/estimates/[id]/items/reorder - Reorder items

### UI Components Needed
- LineItemsTable - Editable table of items
- AddItemForm - Form to add new item
- CategoryGroup - Group items by category
- PricingSummary - Show totals

### Acceptance Criteria
- [ ] Add line items with name, quantity, unit, price
- [ ] Group items by category
- [ ] Calculate line totals (qty x price)
- [ ] Calculate estimate total
- [ ] Drag to reorder items
- [ ] Inline editing
- [ ] Export includes line items
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage8-rooms",
    name: "Stage 8: Room Management",
    category: "implementation",
    description: "Add rooms with dimensions to estimates",
    icon: "LayoutGrid",
    taskIds: ["S8-1", "S8-2", "S8-3", "S8-4"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Stage 8 - Room Management

**Stage**: 8 - Room Management (NOT STARTED)

### User Story
As an estimator, I want to add rooms with dimensions to organize my line items by location.

### Database Schema Addition
\`\`\`typescript
export const rooms = pgTable("rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  estimateId: uuid("estimate_id").notNull().references(() => estimates.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Master Bedroom", "Kitchen"
  floor: integer("floor").default(1),
  lengthFt: decimal("length_ft", { precision: 10, scale: 2 }),
  widthFt: decimal("width_ft", { precision: 10, scale: 2 }),
  heightFt: decimal("height_ft", { precision: 10, scale: 2 }).default("8"),
  squareFeet: decimal("square_feet", { precision: 10, scale: 2 }), // Calculated
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
\`\`\`

### Features
- Add/edit/delete rooms
- Auto-calculate square footage
- Organize line items by room
- Room summary with totals
- Floor plan visualization (future)
${VALIDATION_FOOTER}`,
  },
];

// ============================================================================
// SUB-AGENT PROMPTS - Specialized review agents
// ============================================================================
const agentPrompts: AgentPrompt[] = [
  {
    id: "agent-security",
    name: "Security Agent",
    category: "agent",
    agentRole: "Security & Compliance Officer",
    description: "OWASP Top 10, authentication, data protection review",
    icon: "Shield",
    prompt: `## Security Agent - XTmate V3

You are the Security Agent for XTmate V3. Your role is to ensure the application follows security best practices and protects user data.

### Your Responsibilities

1. **Authentication & Authorization**
   - Verify all API routes check for authenticated users
   - Ensure userId is scoped on ALL database queries
   - Check that Clerk middleware is properly configured
   - Verify no sensitive routes are publicly accessible

2. **OWASP Top 10 Compliance**
   - Injection: SQL injection prevented via Drizzle ORM
   - Broken Auth: Clerk handles session management
   - XSS: React escapes by default, check for dangerouslySetInnerHTML
   - Insecure Direct Object References: userId scoping
   - Security Misconfiguration: Environment variables secure
   - Sensitive Data Exposure: No secrets in client bundle
   - Missing Function Level Access Control: Route protection
   - CSRF: Next.js has built-in protection
   - Components with Known Vulnerabilities: npm audit
   - Insufficient Logging: Error tracking in place

3. **Data Protection**
   - PII handling (names, addresses, claim numbers)
   - Database encryption at rest (Neon handles this)
   - HTTPS only (Vercel handles this)
   - No sensitive data in logs

### Review Checklist

\`\`\`
□ Run: npm audit
□ Check all API routes for auth
□ Verify userId scoping in queries
□ Search for "dangerouslySetInnerHTML"
□ Check environment variable usage
□ Verify no secrets in client components
□ Review Zod validation on inputs
\`\`\`

### Key Files to Review
- \`src/middleware.ts\` - Auth configuration
- \`src/app/api/**/*.ts\` - All API routes
- \`src/lib/db/schema.ts\` - Data model
- \`.env.example\` - Required secrets

### Report Format
For each issue found:
\`\`\`
SEVERITY: Critical | High | Medium | Low
FILE: path/to/file.ts:lineNumber
ISSUE: Description of the security issue
REMEDIATION: How to fix it
\`\`\`

### After Review: Update Documentation
After completing your security review:
1. Update PRD.md with any security-related acceptance criteria changes
2. Update CLAUDE.md if new security patterns were established
3. Create GitHub issues for any critical/high severity findings`,
  },
  {
    id: "agent-design",
    name: "Design Agent",
    category: "agent",
    agentRole: "Brand & UX Designer",
    description: "Paul Davis branding, UI consistency, accessibility",
    icon: "Palette",
    prompt: `## Design Agent - XTmate V3

You are the Design Agent for XTmate V3. Your role is to ensure the application maintains brand consistency with Paul Davis Restoration standards and provides an excellent user experience.

### Paul Davis Brand Guidelines

**Colors**
- Primary Blue: #2563eb (brand accent)
- Dark Background: #0f172a (slate-900)
- Text Gray: #64748b (slate-500)
- Success Green: #22c55e
- Warning Amber: #f59e0b
- Error Red: #ef4444

**Typography**
- Headings: Font weight 600-700, clear hierarchy
- Body: Regular weight, good line height
- Monospace: For technical data, codes

**Design Principles**
- Professional and trustworthy
- Clean, uncluttered interfaces
- Clear call-to-action buttons
- Consistent spacing (4px grid)
- Mobile-first responsive design

### Your Responsibilities

1. **Brand Consistency**
   - Verify XTmate branding is consistent
   - Check color usage matches guidelines
   - Ensure professional appearance
   - Review PDF/Excel export branding

2. **UI/UX Quality**
   - Consistent component styling
   - Proper visual hierarchy
   - Clear navigation patterns
   - Intuitive form layouts
   - Loading and error states

3. **Accessibility (WCAG 2.1)**
   - Color contrast ratios (4.5:1 minimum)
   - Keyboard navigation
   - Screen reader compatibility
   - Focus indicators visible
   - Form labels properly associated

4. **Responsive Design**
   - Mobile breakpoints working
   - Touch targets 44px minimum
   - No horizontal scroll on mobile
   - Text readable without zoom

### Review Checklist

\`\`\`
□ Color palette consistency
□ Typography hierarchy
□ Button styles consistent
□ Form styling consistent
□ Loading states present
□ Error states styled
□ Mobile layout works
□ Dark mode works
□ Accessibility basics
\`\`\`

### Key Files to Review
- \`tailwind.config.ts\` - Theme configuration
- \`src/app/globals.css\` - Global styles
- \`src/components/ui/\` - Base components
- \`src/components/*.tsx\` - Feature components

### Report Format
\`\`\`
AREA: Branding | UX | Accessibility | Responsive
FILE: path/to/file.tsx
ISSUE: Description
RECOMMENDATION: Design improvement
VISUAL: [Screenshot or description]
\`\`\`

### After Review: Update Documentation
After completing your design review:
1. Update CLAUDE.md with any new design patterns or guidelines
2. Update tailwind.config.ts if new color/spacing tokens are needed
3. Document any accessibility requirements in PRD.md`,
  },
  {
    id: "agent-business",
    name: "Business Manager",
    category: "agent",
    agentRole: "Product & Business Analyst",
    description: "ROI analysis, feature prioritization, market trends",
    icon: "TrendingUp",
    prompt: `## Business Manager Agent - XTmate V3

You are the Business Manager Agent for XTmate V3. Your role is to ensure the product delivers business value and aligns with market needs.

### Business Context

**Target Market**: Construction/restoration contractors
**Primary Use Case**: Insurance claim estimates
**Key Differentiator**: AI-powered scope generation

**User Personas**:
1. Field Estimator - Creates estimates on-site
2. Office Admin - Reviews and exports estimates
3. Project Manager - Oversees multiple estimates

### Your Responsibilities

1. **Feature ROI Analysis**
   - Evaluate impact vs effort for features
   - Prioritize high-value, low-effort items
   - Identify quick wins vs long-term investments

2. **Market Alignment**
   - Compare to competitors (Xactimate, etc.)
   - Identify industry trends
   - Suggest differentiating features

3. **User Value Tracking**
   - Time saved per estimate
   - Accuracy improvements
   - User satisfaction metrics

4. **Business Metrics**
   - Feature adoption rates
   - User engagement patterns
   - Conversion points

### Current Feature Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Line Items & Pricing | High | Medium | P1 |
| Room Management | Medium | Medium | P2 |
| Templates | High | Low | P1 |
| Vendor Portal | Medium | High | P3 |
| Real-time Collab | Low | High | P4 |

### Business Questions to Answer

1. **Line Items (Stage 7)**
   - What pricing sources should integrate?
   - Should we support Xactimate pricing?
   - How do users typically price items?

2. **Templates (Stage 9)**
   - What templates would save most time?
   - By job type? By damage type?
   - Should templates be shareable?

3. **Growth Strategy**
   - How to acquire contractor users?
   - What integrations drive adoption?
   - Pricing model considerations?

### Report Format
\`\`\`
ANALYSIS TYPE: ROI | Market | User Value
FINDING: Key insight
DATA: Supporting evidence
RECOMMENDATION: Business action
IMPACT: Expected outcome
\`\`\`

### After Analysis: Update Documentation
After completing your business analysis:
1. Update PRD.md with any new user stories or acceptance criteria
2. Update the Feature Priority Matrix in this prompt if priorities changed
3. Document any new business requirements in CLAUDE.md`,
  },
  {
    id: "agent-qa",
    name: "QA Agent",
    category: "agent",
    agentRole: "Quality Assurance & Insurance SLA Compliance",
    description: "Test coverage, insurance carrier SLAs, data accuracy",
    icon: "CheckSquare",
    prompt: `## QA Agent - XTmate V3

You are the QA Agent for XTmate V3. Your role is to ensure quality standards and compliance with insurance carrier SLAs.

### Insurance Industry SLA Requirements

**Carrier Response Times**
- State Farm: 24-hour initial response
- Allstate: 48-hour estimate submission
- Farmers: 72-hour documentation
- USAA: 24-hour digital submission

**Data Accuracy Requirements**
- Claim numbers must match carrier format
- Policy numbers validated
- Property addresses verified
- Scope items match Xactimate categories (where applicable)

**Documentation Standards**
- Photos with timestamps
- Detailed scope descriptions
- Pricing transparency
- Digital signatures (future)

### Your Responsibilities

1. **Test Coverage**
   - Unit tests for utilities
   - Integration tests for APIs
   - E2E tests for critical paths
   - Mobile testing

2. **Data Validation**
   - Claim number format validation
   - Address verification
   - Required fields enforced
   - Price calculations accurate

3. **SLA Compliance**
   - Estimate creation within timeframes
   - Export formats accepted by carriers
   - Data fields match carrier requirements
   - Audit trail for changes

4. **Quality Metrics**
   - Build success rate
   - Test pass rate
   - Bug density
   - Performance benchmarks

### Test Strategy

**Critical Paths (Must Test)**
1. User sign-in → Create estimate → Export PDF
2. Search/filter estimates
3. AI scope suggestions flow
4. Offline → Online sync

**Test Commands**
\`\`\`bash
npm run test              # Run all tests
npm run test:coverage     # Coverage report
npm run build             # Type checking
\`\`\`

### Validation Rules

**Claim Number Formats**
- State Farm: SF-XXXXXXXX
- Allstate: ALL-XXXXXX
- Generic: Alphanumeric, 6-20 chars

**Required Fields by Job Type**
- Insurance: name, propertyAddress, claimNumber, policyNumber
- Private: name, propertyAddress

### Report Format
\`\`\`
TEST AREA: Unit | Integration | E2E | SLA
STATUS: Pass | Fail | Skip
FILE: test file or feature
ISSUE: Description (if fail)
SLA IMPACT: Which carrier affected
REMEDIATION: How to fix
\`\`\`

### Key Files
- \`vitest.config.ts\` - Test configuration
- \`src/**/*.test.ts\` - Test files
- \`playwright.config.ts\` - E2E config (if exists)

### After Testing: Update Documentation
After completing your QA review:
1. Update PRD.md with test coverage status and any SLA compliance issues
2. Update CLAUDE.md "Testing Strategy" section with new test patterns
3. Document any validation rules that need to be added to the codebase`,
  },
];

// ============================================================================
// REVIEW PROMPTS - Quick review checklists
// ============================================================================
const reviewPrompts: AgentPrompt[] = [
  {
    id: "review-pre-deploy",
    name: "Pre-Deploy Checklist",
    category: "review",
    description: "Verify everything before pushing to production",
    icon: "Rocket",
    prompt: `## Pre-Deploy Checklist

Run through this checklist before deploying to production.

### Build & Types
\`\`\`bash
npm run build
\`\`\`
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint warnings (or acceptable)

### Tests
\`\`\`bash
npm run test
\`\`\`
- [ ] All tests passing
- [ ] No skipped critical tests

### Environment
- [ ] All env vars set in Vercel
- [ ] CLERK_SECRET_KEY configured
- [ ] DATABASE_URL configured
- [ ] ANTHROPIC_API_KEY configured (for AI)

### Security
- [ ] No secrets in code
- [ ] npm audit shows no critical vulnerabilities
- [ ] Auth protecting all routes

### Database
- [ ] Migrations are up to date
- [ ] No pending schema changes

### Functionality Smoke Test
- [ ] Can sign in
- [ ] Can create estimate
- [ ] Can edit estimate
- [ ] Can export PDF/Excel
- [ ] AI features work (if API key set)
- [ ] Offline indicator shows
- [ ] Mobile layout works

### Performance
- [ ] First load under 3s
- [ ] No console errors
- [ ] Images optimized

### After Deploy: Update Documentation
After successful deployment:
1. Update PRD.md version number and deployment date
2. Update CLAUDE.md with any new environment variables or configuration
3. Note any deployment issues and resolutions for future reference`,
  },
  {
    id: "review-code-quality",
    name: "Code Quality Review",
    category: "review",
    description: "Check code quality and patterns",
    icon: "Code2",
    prompt: `## Code Quality Review

### TypeScript
- [ ] No \`any\` types (search: ": any" and "as any")
- [ ] Proper type imports from schema
- [ ] Zod schemas match TypeScript types
- [ ] No type assertions without validation

### Patterns
- [ ] Following patterns in CLAUDE.md
- [ ] Consistent file naming
- [ ] Components in correct directories
- [ ] No duplicate code

### Error Handling
- [ ] try/catch on all async operations
- [ ] User-friendly error messages
- [ ] Errors logged appropriately
- [ ] API returns proper status codes

### Performance
- [ ] No unnecessary re-renders
- [ ] Large lists virtualized (if applicable)
- [ ] Images use next/image
- [ ] No blocking operations

### Commands
\`\`\`bash
# Find any types
grep -r ": any" src/
grep -r "as any" src/

# Check bundle size
npm run build
\`\`\`

### After Review: Update Documentation
After completing your code quality review:
1. Update CLAUDE.md "Key Patterns" section if new patterns were identified
2. Document any new TypeScript conventions in CLAUDE.md
3. Update PRD.md quality metrics if standards have changed`,
  },
];

// ============================================================================
// V2 MIGRATION PROMPTS - Sprints M1-M8
// ============================================================================
const migrationPrompts: AgentPrompt[] = [
  {
    id: "migration-m1-dashboard",
    name: "Migration M1: Dashboard & Navigation",
    category: "implementation",
    description: "Sidebar, welcome banner, stat cards, charts, projects map",
    icon: "LayoutDashboard",
    taskIds: ["M1-1", "M1-2", "M1-3", "M1-4", "M1-5", "M1-6", "M1-7", "M1-8"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M1 - Dashboard & Navigation

**Sprint**: M1 - Dashboard & Navigation (NOT STARTED)
**Task IDs**: M1-1 through M1-8
**PRD**: docs/PRD-V2-MIGRATION.md

This sprint ports the V2 dashboard experience to V3.

### Source Files (Copy from V2)

V2 Location: \`~/xtmate-v2/src/components/dashboard/\`

\`\`\`
sidebar.tsx          → src/components/dashboard/sidebar.tsx
welcome-banner.tsx   → src/components/dashboard/welcome-banner.tsx
stat-card.tsx        → src/components/dashboard/stat-card.tsx
estimate-table.tsx   → src/components/dashboard/estimate-table.tsx
projects-map.tsx     → src/components/dashboard/projects-map.tsx
performance-metrics.tsx → src/components/dashboard/performance-metrics.tsx
\`\`\`

### Dependencies to Install

\`\`\`bash
npm install recharts @react-google-maps/api
\`\`\`

### Task Breakdown

**M1-1: Sidebar Navigation**
- Copy sidebar.tsx from V2
- Update imports for V3 paths
- Ensure routes: Dashboard, Estimates, Command Center, Portfolio, QA Review, Analytics, Team, Settings
- Add collapse toggle for mobile

**M1-2: Welcome Banner**
- Personalized greeting (Good morning/afternoon/evening)
- User's name from Clerk
- Today's date
- Active claims count
- "View Active Claims" button

**M1-3: Stat Cards Row**
- In Progress count
- Complete count
- This Month count
- Total Value (currency formatted)

**M1-4: Monthly Claims Chart**
- Recharts BarChart
- Last 6 months of data
- Blue gradient bars

**M1-5: Loss Types Donut Chart**
- Recharts PieChart
- Fire, Water, Other segments
- Legend with labels

**M1-6: Claims Table with Tabs**
- Tabs: All, Draft, Working, Synced, Revision
- Columns: Claim/Project, Insured, Profile, Status, Total, Modified, User
- Row click → navigate to estimate

**M1-7: Projects Map**
- Google Maps component
- Markers for each estimate with lat/lng
- Color by status (In Progress = blue, Approved = green)

**M1-8: Dashboard Layout Integration**
- Assemble all components in dashboard/page.tsx
- Responsive grid layout
- Sidebar on left (collapsible on mobile)

### Environment Variables Needed

\`\`\`env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
\`\`\`

### Acceptance Criteria

- [ ] Sidebar shows all navigation items with icons
- [ ] Welcome banner shows user's name and date
- [ ] Stat cards display correct counts
- [ ] Charts render with real data
- [ ] Map shows estimate locations
- [ ] Table filters by status tabs
- [ ] Mobile responsive layout
${VALIDATION_FOOTER}`,
  },
  {
    id: "migration-m2-schema",
    name: "Migration M2: Database Schema",
    category: "implementation",
    description: "Add rooms, annotations, line items, photos, assignments tables",
    icon: "Database",
    taskIds: ["M2-1", "M2-2", "M2-3", "M2-4", "M2-5", "M2-6"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M2 - Database Schema Expansion

**Sprint**: M2 - Database Schema (NOT STARTED)
**Task IDs**: M2-1 through M2-6
**PRD**: docs/PRD-V2-MIGRATION.md

This sprint adds the core tables needed for full restoration app functionality.

### Schema Additions

Add these to \`src/lib/db/schema.ts\`:

\`\`\`typescript
import { pgTable, text, timestamp, uuid, pgEnum, real, integer, boolean, jsonb } from "drizzle-orm/pg-core";

// M2-1: Levels table (floor levels)
export const levels = pgTable('levels', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "1", "2", "B", "A"
  label: text('label'), // "First Floor", "Basement"
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// M2-2: Rooms table
export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  levelId: uuid('level_id').references(() => levels.id),
  name: text('name').notNull(),
  category: text('category'), // kitchen, bathroom, bedroom, living, dining, etc.
  lengthIn: real('length_in'),
  widthIn: real('width_in'),
  heightIn: real('height_in').default(96), // 8ft default
  squareFeet: real('square_feet'),
  cubicFeet: real('cubic_feet'),
  perimeterLf: real('perimeter_lf'),
  wallSf: real('wall_sf'),
  ceilingSf: real('ceiling_sf'),
  floorMaterial: text('floor_material'),
  wallMaterial: text('wall_material'),
  ceilingMaterial: text('ceiling_material'),
  geometry: jsonb('geometry'), // For sketch editor
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M2-3: Annotations table (damage markers)
export const annotations = pgTable('annotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }),
  damageType: text('damage_type'), // water, fire, smoke, mold, impact, wind
  severity: text('severity'), // light, moderate, heavy, severe
  category: text('category'), // cat1, cat2, cat3 (water contamination)
  positionX: real('position_x'),
  positionY: real('position_y'),
  positionZ: real('position_z'),
  affectedSurfaces: jsonb('affected_surfaces'), // ['floor', 'wall', 'ceiling']
  affectedHeightIn: real('affected_height_in'),
  affectedAreaSf: real('affected_area_sf'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// M2-4: Line Items table
export const lineItems = pgTable('line_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  roomId: uuid('room_id').references(() => rooms.id),
  annotationId: uuid('annotation_id').references(() => annotations.id),
  category: text('category'), // WTR, DRY, DEM, DRW, FLR, PNT, CLN
  selector: text('selector'), // Xactimate code
  description: text('description'),
  quantity: real('quantity'),
  unit: text('unit'), // SF, LF, EA, SY, HR
  unitPrice: real('unit_price'),
  total: real('total'),
  source: text('source').default('manual'), // manual, ai_generated, template
  aiConfidence: real('ai_confidence'),
  verified: boolean('verified').default(false),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// M2-5: Photos table
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

// M2-6: Assignments table
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

// Export types
export type Level = typeof levels.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Annotation = typeof annotations.$inferSelect;
export type LineItem = typeof lineItems.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
\`\`\`

### After Adding Schema

Run migrations:
\`\`\`bash
npx drizzle-kit push:pg
\`\`\`

### Acceptance Criteria

- [ ] All 6 tables created in database
- [ ] Foreign key relationships work
- [ ] Types exported for use in API routes
- [ ] drizzle-kit push succeeds
${VALIDATION_FOOTER}`,
  },
  {
    id: "migration-m3-sketch",
    name: "Migration M3: Rooms & Sketch Editor",
    category: "implementation",
    description: "Konva.js canvas with walls, doors, windows, fixtures",
    icon: "PenTool",
    taskIds: ["M3-1", "M3-2", "M3-3", "M3-4", "M3-5", "M3-6", "M3-7", "M3-8", "M3-9", "M3-10"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M3 - Rooms & Sketch Editor

**Sprint**: M3 - Rooms & Sketch Editor (NOT STARTED)
**Task IDs**: M3-1 through M3-10
**PRD**: docs/PRD-V2-MIGRATION.md

This sprint ports the complete sketch editor from V2.

### Prerequisites
- Sprint M2 (Database Schema) must be complete

### Dependencies to Install

\`\`\`bash
npm install konva react-konva
\`\`\`

### Source Files (Copy from V2)

\`\`\`
V2: ~/xtmate-v2/src/components/sketch-editor/
→ V3: src/components/sketch-editor/

Files to copy:
├── SketchCanvas.tsx       # Main canvas (M3-2)
├── Toolbar.tsx            # Tool selection (M3-9)
├── LevelTabs.tsx          # Floor levels (M3-10)
├── RoomPropertiesPanel.tsx
├── ToolOptionsPanel.tsx
└── layers/
    ├── GridLayer.tsx
    ├── WallsLayer.tsx     # (M3-3)
    ├── DoorsLayer.tsx     # (M3-4)
    ├── WindowsLayer.tsx   # (M3-5)
    ├── FixturesLayer.tsx  # (M3-6)
    ├── StaircasesLayer.tsx # (M3-7)
    ├── RoomsLayer.tsx
    └── RoomLabelsLayer.tsx

V2: ~/xtmate-v2/src/lib/geometry/
→ V3: src/lib/geometry/

Files to copy:
├── room-detection.ts      # (M3-8)
├── snapping.ts
├── staircase.ts
└── types.ts
\`\`\`

### Task Breakdown

**M3-1: Rooms Tab on Estimate Detail**
- Add tab navigation to estimate detail page
- Tabs: Details, Rooms, Scope, Photos, SLA
- Rooms tab shows room list and "Open Sketch Editor" button

**M3-2: Sketch Canvas**
- React Konva Stage and Layer setup
- Pan and zoom controls
- Grid background
- Touch support for mobile

**M3-3: Wall Drawing Tool**
- Click to start wall, click to end
- Wall snapping (endpoint, midpoint, perpendicular, etc.)
- Double-click to finish polyline

**M3-4-M3-7: Symbol Tools**
- Door tool with types (single, double, pocket, bi-fold, sliding)
- Window tool with types (hung, casement, sliding, picture)
- Fixture tool (kitchen, bathroom, laundry fixtures)
- Staircase tool (straight, L-shaped, U-shaped)

**M3-8: Room Detection**
- Detect enclosed rooms from walls
- Calculate area automatically
- Prompt for room name and category

**M3-9: Toolbar**
- Tool selection buttons with icons
- Keyboard shortcuts (V, W, O, etc.)
- Active tool highlight

**M3-10: Level Tabs**
- Multi-floor support (B, 1, 2, 3, A)
- Add/remove levels
- Per-level sketch data

### Keyboard Shortcuts

| Key | Tool |
|-----|------|
| V | Select |
| W | Wall |
| O | Opening/Door |
| M | Measure |
| G | Toggle Grid |
| Delete | Delete selected |
| Escape | Cancel |

### Acceptance Criteria

- [ ] Rooms tab visible on estimate detail
- [ ] Sketch editor opens with Konva canvas
- [ ] Can draw walls with snapping
- [ ] Can place doors and windows
- [ ] Room detection calculates area
- [ ] Multi-level support works
- [ ] Keyboard shortcuts work
- [ ] Touch gestures work on mobile
${VALIDATION_FOOTER}`,
  },
  {
    id: "migration-m4-pricing",
    name: "Migration M4: Line Items & Pricing",
    category: "implementation",
    description: "Scope management with Xactimate codes and pricing",
    icon: "DollarSign",
    taskIds: ["M4-1", "M4-2", "M4-3", "M4-4", "M4-5", "M4-6", "M4-7", "M4-8"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M4 - Line Items & Pricing

**Sprint**: M4 - Line Items & Pricing (NOT STARTED)
**Task IDs**: M4-1 through M4-8
**PRD**: docs/PRD-V2-MIGRATION.md

### Prerequisites
- Sprint M2 (Database Schema) must be complete

### API Routes to Create

**M4-1: Line Items API**

\`\`\`typescript
// src/app/api/line-items/route.ts
GET /api/line-items?estimateId=X    // List items for estimate
POST /api/line-items                 // Create item

// src/app/api/line-items/[id]/route.ts
GET /api/line-items/[id]            // Get single item
PATCH /api/line-items/[id]          // Update item
DELETE /api/line-items/[id]         // Delete item

// src/app/api/line-items/bulk/route.ts
POST /api/line-items/bulk           // Bulk create (for AI suggestions)
\`\`\`

**M4-4: Price Lists API**

\`\`\`typescript
// src/app/api/price-lists/route.ts
GET /api/price-lists                // List user's price lists
POST /api/price-lists               // Create price list

// src/app/api/price-lists/import/route.ts
POST /api/price-lists/import        // Import CSV/XLSX
\`\`\`

### Reference Data (M4-3)

Copy from V2:
\`\`\`
~/xtmate-v2/src/lib/reference/xactimate-categories.ts
→ src/lib/reference/xactimate-categories.ts
\`\`\`

This file contains all Xactimate category codes:
- ACM (Acoustical), APP (Appliances), AWN (Awnings)
- CAB (Cabinets), CLN (Cleaning), CNT (Contents)
- DEM (Demolition), DRY (Drying), DRW (Drywall)
- ELE (Electrical), FLR (Flooring), etc.

### UI Components Needed

**M4-2: Scope Tab UI**
- Line items table with columns:
  - Category | Code | Description | Qty | Unit | Price | Total
- Inline editing (click to edit)
- Add item button
- Delete with confirmation

**M4-5: Totals Calculation**
\`\`\`typescript
// Calculate on client or server
const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
const overhead = subtotal * (overheadPercent / 100);
const profit = subtotal * (profitPercent / 100);
const tax = (subtotal + overhead + profit) * (taxPercent / 100);
const grandTotal = subtotal + overhead + profit + tax;
\`\`\`

**M4-6: AI Scope Integration**
- Update AI scope modal to save accepted items to database
- POST to /api/line-items/bulk with accepted suggestions

**M4-7: Line Item Reordering**
- Drag handle on rows
- Update order field on drop
- PATCH /api/line-items/reorder

**M4-8: Export with Line Items**
- Update PDF export to include line items table
- Update Excel export to include line items sheet

### Acceptance Criteria

- [ ] Can create/edit/delete line items
- [ ] Items grouped by category
- [ ] Totals calculate correctly
- [ ] AI suggestions save to database
- [ ] Can drag to reorder
- [ ] PDF/Excel exports include line items
- [ ] Price list import works (CSV)
${VALIDATION_FOOTER}`,
  },
  {
    id: "migration-m5-photos",
    name: "Migration M5: Photos & Documentation",
    category: "implementation",
    description: "Photo upload, gallery, capture, and linking",
    icon: "Image",
    taskIds: ["M5-1", "M5-2", "M5-3", "M5-4", "M5-5", "M5-6"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M5 - Photos & Documentation

**Sprint**: M5 - Photos & Documentation (NOT STARTED)
**Task IDs**: M5-1 through M5-6
**PRD**: docs/PRD-V2-MIGRATION.md

### Prerequisites
- Sprint M2 (Database Schema) must be complete

### Storage Setup

For Vercel deployment, use Vercel Blob or similar:

\`\`\`bash
npm install @vercel/blob
\`\`\`

### API Routes

**M5-1: Photo Upload API**

\`\`\`typescript
// src/app/api/photos/route.ts
GET /api/photos?estimateId=X        // List photos
POST /api/photos                    // Upload photo (multipart/form-data)
DELETE /api/photos/[id]             // Delete photo
\`\`\`

### UI Components

**M5-2: Photo Gallery**
- Grid of thumbnails
- Filter by photo type (Before, During, After, Damage, Equipment, Overview)
- Click to open lightbox

**M5-3: Photo Capture (Mobile)**
- Camera input on mobile devices
- Type selection before capture
- Auto GPS tagging

**M5-4: Photo Linking**
- Associate photo with room
- Associate photo with damage annotation
- Show photo count on room cards

**M5-5: Photos Tab**
- Add Photos tab to estimate detail
- Upload button
- Gallery view
- Delete with confirmation

**M5-6: Export with Photos**
- Include thumbnails in PDF
- Include photos in ESX ZIP (if implementing)

### Photo Types

\`\`\`typescript
type PhotoType =
  | 'BEFORE'    // Pre-damage state
  | 'DURING'    // During restoration
  | 'AFTER'     // Post-restoration
  | 'DAMAGE'    // Specific damage documentation
  | 'EQUIPMENT' // Equipment deployed
  | 'OVERVIEW'; // General property shots
\`\`\`

### Acceptance Criteria

- [ ] Can upload photos from device
- [ ] Photos display in gallery grid
- [ ] Can filter by photo type
- [ ] Lightbox opens on click
- [ ] Can link photo to room
- [ ] Photos tab shows on estimate
- [ ] Photos appear in PDF export
${VALIDATION_FOOTER}`,
  },
  {
    id: "migration-m6-sla",
    name: "Migration M6: SLA & Workflow",
    category: "implementation",
    description: "Carrier SLAs, milestone tracking, status workflow",
    icon: "Clock",
    taskIds: ["M6-1", "M6-2", "M6-3", "M6-4", "M6-5", "M6-6"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M6 - SLA & Workflow

**Sprint**: M6 - SLA & Workflow (NOT STARTED)
**Task IDs**: M6-1 through M6-6
**PRD**: docs/PRD-V2-MIGRATION.md

### Database Schema Additions (M6-1, M6-2)

\`\`\`typescript
// Add to src/lib/db/schema.ts

// Carriers (insurance companies)
export const carriers = pgTable('carriers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // "SF", "ALL", "FAR"
  name: text('name').notNull(), // "State Farm", "Allstate"
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// SLA Rules per carrier
export const carrierSlaRules = pgTable('carrier_sla_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  carrierId: uuid('carrier_id').references(() => carriers.id),
  milestone: text('milestone').notNull(), // 'contacted', 'site_visit', 'estimate_uploaded'
  targetHours: integer('target_hours').notNull(),
  isBusinessHours: boolean('is_business_hours').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// SLA Events (actual milestone completions)
export const slaEvents = pgTable('sla_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id, { onDelete: 'cascade' }),
  milestone: text('milestone').notNull(),
  targetAt: timestamp('target_at'),
  completedAt: timestamp('completed_at'),
  isOverdue: boolean('is_overdue').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Also add carrierId to estimates table
// ALTER estimates ADD COLUMN carrier_id UUID REFERENCES carriers(id)
\`\`\`

### SLA Milestones

\`\`\`typescript
const SLA_MILESTONES = [
  'assigned',           // Job received
  'contacted',          // Insured contacted
  'site_visit',         // On-site inspection
  'estimate_uploaded',  // Estimate submitted
  'revision_requested', // Changes needed
  'approved',           // Approved by adjuster
  'closed',             // Job complete
];
\`\`\`

### UI Components

**M6-3: SLA Tab on Estimate**
- Timeline view of milestones
- Target time vs actual time
- At-risk/overdue indicators
- Complete milestone button

**M6-4: Status Workflow**
- Status transitions with validation
- Automatic SLA event creation on status change

**M6-5: SLA Dashboard Widget**
- At-risk count
- Overdue count
- SLA compliance percentage
- Quick links to at-risk estimates

**M6-6: SLA Badges**
- Green: On-time
- Yellow: At-risk (within 4 hours of target)
- Red: Overdue
- Show on estimate list and detail

### Acceptance Criteria

- [ ] Carriers table with major insurance companies
- [ ] SLA rules configurable per carrier
- [ ] SLA events tracked for each estimate
- [ ] Timeline shows milestone progress
- [ ] Badges show SLA status
- [ ] Dashboard widget shows at-risk count
${VALIDATION_FOOTER}`,
  },
  {
    id: "migration-m7-analytics",
    name: "Migration M7: Portfolio & Analytics",
    category: "implementation",
    description: "Portfolio dashboard, analytics, team metrics",
    icon: "BarChart3",
    taskIds: ["M7-1", "M7-2", "M7-3", "M7-4", "M7-5", "M7-6"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M7 - Portfolio & Analytics

**Sprint**: M7 - Portfolio & Analytics (NOT STARTED)
**Task IDs**: M7-1 through M7-6
**PRD**: docs/PRD-V2-MIGRATION.md

### Pages to Create

**M7-1: Portfolio Page**
\`\`\`
src/app/dashboard/portfolio/page.tsx
\`\`\`
- Summary metrics (total claims, value, completion rate)
- At-risk estimates list
- Activity feed
- Carrier breakdown chart

**M7-2: Analytics Page**
\`\`\`
src/app/dashboard/analytics/page.tsx
\`\`\`
- Date range picker
- Revenue over time (line chart)
- Claims by status (bar chart)
- Average claim value
- Completion time trends

### Components to Create

**M7-3: Team Metrics**
- Claims per team member
- Revenue per team member
- Average completion time
- Table with sortable columns

**M7-4: Carrier Breakdown**
- Pie/donut chart of claims by carrier
- Table with carrier stats
- Click to filter by carrier

**M7-5: Activity Feed**
- Recent activity log
- User avatars
- Action descriptions ("Juan created estimate", "Maria uploaded photos")
- Relative timestamps ("2 hours ago")

**M7-6: Export Analytics**
- PDF report with charts
- Date range in report
- Summary statistics

### Source Files (Copy from V2)

\`\`\`
~/xtmate-v2/src/components/portfolio/
├── ActivityFeed.tsx
├── AtRiskList.tsx
├── CarrierBreakdown.tsx
└── DonutChart.tsx

~/xtmate-v2/src/components/analytics/
├── BarChart.tsx
├── LineChart.tsx
├── DateRangePicker.tsx
└── MetricCard.tsx
\`\`\`

### Acceptance Criteria

- [ ] Portfolio page shows summary metrics
- [ ] Activity feed shows recent actions
- [ ] Carrier breakdown chart displays
- [ ] Analytics page has date range picker
- [ ] Charts render with real data
- [ ] Team metrics show per-user stats
- [ ] PDF export includes analytics
${VALIDATION_FOOTER}`,
  },
  {
    id: "migration-m8-vendor",
    name: "Migration M8: Vendor Portal",
    category: "implementation",
    description: "Vendor management, quote requests, comparison",
    icon: "Building",
    taskIds: ["M8-1", "M8-2", "M8-3", "M8-4", "M8-5", "M8-6"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Migration Sprint M8 - Vendor Portal

**Sprint**: M8 - Vendor Portal (NOT STARTED)
**Task IDs**: M8-1 through M8-6
**PRD**: docs/PRD-V2-MIGRATION.md

### Database Schema (M8-1)

\`\`\`typescript
// Add to src/lib/db/schema.ts

// Vendors (subcontractors)
export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Owner's Clerk ID
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  specialty: text('specialty'), // plumbing, electrical, flooring, etc.
  accessToken: text('access_token').unique(), // For portal login
  tokenExpiresAt: timestamp('token_expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quote Requests
export const quoteRequests = pgTable('quote_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  estimateId: uuid('estimate_id').references(() => estimates.id),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  status: text('status').default('pending'), // pending, viewed, quoted, accepted, rejected
  message: text('message'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quote Request Items (line items included in request)
export const quoteRequestItems = pgTable('quote_request_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id, { onDelete: 'cascade' }),
  lineItemId: uuid('line_item_id').references(() => lineItems.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vendor Quotes (responses)
export const vendorQuotes = pgTable('vendor_quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  quoteRequestId: uuid('quote_request_id').references(() => quoteRequests.id),
  totalAmount: real('total_amount'),
  notes: text('notes'),
  validUntil: timestamp('valid_until'),
  submittedAt: timestamp('submitted_at').defaultNow(),
});
\`\`\`

### Vendor Portal Routes (M8-2)

\`\`\`
src/app/vendor/
├── page.tsx              # Vendor dashboard (list of quote requests)
├── login/page.tsx        # Token-based login
└── quotes/[id]/page.tsx  # Quote detail and submission form
\`\`\`

### Token-Based Auth (M8-3)

Vendors don't use Clerk - they access via unique token:

\`\`\`typescript
// src/lib/auth/vendor.ts
export function generateVendorToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export async function validateVendorToken(token: string): Promise<Vendor | null> {
  const vendor = await db.query.vendors.findFirst({
    where: (v, { eq, gt }) =>
      and(eq(v.accessToken, token), gt(v.tokenExpiresAt, new Date()))
  });
  return vendor || null;
}
\`\`\`

### Quote Request Flow (M8-4)

1. Estimator selects line items to quote
2. Selects vendor(s) to send to
3. System generates quote request with access token
4. Email sent to vendor with link
5. Vendor logs in via token
6. Vendor sees scope details and submits pricing

### Vendor Quote Submission (M8-5)

Vendor portal shows:
- Scope of work (line items)
- Room dimensions
- Photos (read-only)
- Price entry form
- Submit button

### Quote Comparison (M8-6)

When multiple quotes received:
- Side-by-side comparison table
- Highlight lowest/highest prices
- Accept/reject buttons
- Selected quote updates line item prices

### Acceptance Criteria

- [ ] Vendors table stores contractor info
- [ ] Token-based auth works (not Clerk)
- [ ] Quote requests link to line items
- [ ] Vendor portal shows scope details
- [ ] Vendors can submit pricing
- [ ] Comparison view shows all quotes
- [ ] Can accept quote to update pricing
${VALIDATION_FOOTER}`,
  },
];

// Combine all prompts
const allPrompts: AgentPrompt[] = [
  ...implementationPrompts,
  ...migrationPrompts,
  ...agentPrompts,
  ...reviewPrompts,
];

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    prompts: allPrompts,
    categories: {
      implementation: implementationPrompts,
      migration: migrationPrompts,
      agents: agentPrompts,
      review: reviewPrompts,
    },
    metadata: {
      totalPrompts: allPrompts.length,
      methodology: "RALPH",
      documentationFile: "CLAUDE.md",
      prdFile: "docs/PRD.md",
      migrationPrdFile: "docs/PRD-V2-MIGRATION.md",
    },
  });
}
