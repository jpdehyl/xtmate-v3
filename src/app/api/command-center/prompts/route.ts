import { NextResponse } from "next/server";

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

// Combine all prompts
const allPrompts: AgentPrompt[] = [
  ...implementationPrompts,
  ...agentPrompts,
  ...reviewPrompts,
];

export async function GET() {
  return NextResponse.json({
    prompts: allPrompts,
    categories: {
      implementation: implementationPrompts,
      agents: agentPrompts,
      review: reviewPrompts,
    },
    metadata: {
      totalPrompts: allPrompts.length,
      methodology: "RALPH",
      documentationFile: "CLAUDE.md",
      prdFile: "docs/PRD.md",
    },
  });
}
