import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface AgentPrompt {
  id: string;
  name: string;
  category: "implementation" | "review";
  description: string;
  icon: string;
  prompt: string;
  taskIds?: string[];
}

const STANDARD_HEADER = `## CRITICAL: Read These Files First

Before writing ANY code, you MUST read and understand:

1. **CLAUDE.md** - Project knowledge base with architecture, patterns, and constraints
2. **Database Schema** - Current tables and relationships at \`src/lib/db/schema.ts\`

---

## RALPH Methodology

Follow RALPH (Requirements Analysis for LLM-Powered Handoff):

1. **Requirements Analysis** - Identify all acceptance criteria
2. **Architecture Review** - Check existing patterns, plan file structure
3. **Implementation** - Follow established patterns, keep it simple
4. **Progress Tracking** - Update Command Center after completing

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
`;

const prompts: AgentPrompt[] = [
  // Implementation Prompts
  {
    id: "stage4-ai",
    name: "Stage 4: AI Scope",
    category: "implementation",
    description: "Implement AI-powered scope suggestions using Claude API",
    icon: "Sparkles",
    taskIds: ["S4-1", "S4-2", "S4-3", "S4-4"],
    prompt: `${STANDARD_HEADER}
## Task: Implement AI Scope Features

**Stage**: 4 - AI Scope
**Task IDs**: S4-1, S4-2, S4-3, S4-4

---

## User Stories

**US-007: AI Scope Suggestions**
As an estimator, I want AI to suggest scope items based on job type and property details.

Acceptance Criteria:
- [ ] "Suggest Scope" button on estimate detail page
- [ ] AI analyzes job type (insurance/private) and property info
- [ ] Returns list of suggested scope items for the project
- [ ] User can accept/dismiss suggestions
- [ ] Suggestions displayed in a modal or sidebar

**US-008: AI Description Enhancement**
As an estimator, I want AI to improve my estimate descriptions for professionalism.

Acceptance Criteria:
- [ ] "Enhance" button next to estimate name field
- [ ] AI rewrites estimate name/description professionally
- [ ] Shows preview before applying changes
- [ ] One-click to accept or dismiss

---

## Implementation Tasks

### 1. Install Anthropic SDK
\`\`\`bash
npm install @anthropic-ai/sdk
\`\`\`

### 2. Create AI Suggest Scope API
**File**: \`src/app/api/ai/suggest-scope/route.ts\`

\`\`\`typescript
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { jobType, propertyAddress, propertyCity, name } = await request.json();

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: \`Suggest scope items for this estimate:
Job Type: \${jobType}
Property: \${propertyAddress}, \${propertyCity}
Estimate Name: \${name}

Return a JSON array of suggested scope items with description and estimated quantity.\`
    }]
  });

  return Response.json({ suggestions: message.content });
}
\`\`\`

### 3. Create AI Enhance Description API
**File**: \`src/app/api/ai/enhance-description/route.ts\`

### 4. Add UI Buttons
Update \`src/app/dashboard/estimates/[id]/page.tsx\` with:
- "Suggest Scope" button
- "Enhance" button next to name field
- Modal to show suggestions
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage5-pwa",
    name: "Stage 5: Mobile Sync",
    category: "implementation",
    description: "Implement PWA features for offline support",
    icon: "Smartphone",
    taskIds: ["S5-1", "S5-2", "S5-3", "S5-4"],
    prompt: `${STANDARD_HEADER}
## Task: Implement PWA & Offline Support

**Stage**: 5 - Mobile Sync
**Task IDs**: S5-1, S5-2, S5-3, S5-4

---

## User Stories

**US-009: PWA Installation**
As a field estimator, I want to install XTmate as an app on my mobile device.

Acceptance Criteria:
- [ ] App is installable as PWA (manifest.json configured)
- [ ] App icon and splash screen with XTmate branding
- [ ] Works in standalone mode (no browser chrome)
- [ ] Responsive design works on mobile screens

**US-010: Offline Estimate Viewing**
As a field estimator, I want to view my estimates when offline.

Acceptance Criteria:
- [ ] Service worker caches estimate data
- [ ] Previously viewed estimates accessible offline
- [ ] Clear indicator when app is offline
- [ ] Auto-sync when connection restored

---

## Implementation Tasks

### 1. Create manifest.json
**File**: \`public/manifest.json\`

\`\`\`json
{
  "name": "XTmate",
  "short_name": "XTmate",
  "description": "Estimation tool for construction projects",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
\`\`\`

### 2. Install next-pwa or create service worker
\`\`\`bash
npm install next-pwa
\`\`\`

### 3. Create offline indicator component
**File**: \`src/components/offline-indicator.tsx\`

### 4. Implement IndexedDB for caching
**File**: \`src/lib/offline-db.ts\`
${VALIDATION_FOOTER}`,
  },
  {
    id: "stage6-polish",
    name: "Stage 6: Polish",
    category: "implementation",
    description: "Add search, filters, skeletons, and toasts",
    icon: "Sparkles",
    taskIds: ["S6-1", "S6-2", "S6-3", "S6-4"],
    prompt: `${STANDARD_HEADER}
## Task: Implement Polish Features

**Stage**: 6 - Polish
**Task IDs**: S6-1, S6-2, S6-3, S6-4

---

## User Stories

**US-011: Dashboard Search & Filter**
As an estimator, I want to search and filter my estimates list.

Acceptance Criteria:
- [ ] Search box filters estimates by name/address
- [ ] Filter dropdown for status (draft/in_progress/completed)
- [ ] Filter dropdown for job type (private/insurance)
- [ ] Filters persist in URL for bookmarking
- [ ] Clear filters button

**US-012: Estimate Duplication**
As an estimator, I want to duplicate an existing estimate as a starting point.

Acceptance Criteria:
- [ ] "Duplicate" button on estimate detail page
- [ ] Creates copy with "(Copy)" appended to name
- [ ] Opens new estimate immediately after creation
- [ ] All fields copied except dates (reset to now)

**US-013: Loading & Empty States**
As a user, I want polished loading and empty states throughout the app.

Acceptance Criteria:
- [ ] Skeleton loaders instead of "Loading..." text
- [ ] Empty state illustrations on dashboard when no estimates
- [ ] Toast notifications for success/error feedback
- [ ] Smooth transitions between states

---

## Implementation Tasks

### 1. Add search with URL params
Update \`src/app/dashboard/page.tsx\` to use searchParams

### 2. Create duplicate API
**File**: \`src/app/api/estimates/[id]/duplicate/route.ts\`

### 3. Install toast library
\`\`\`bash
npm install sonner
\`\`\`

### 4. Create skeleton component
**File**: \`src/components/ui/skeleton.tsx\`
${VALIDATION_FOOTER}`,
  },
  // Review Prompts
  {
    id: "review-security",
    name: "Security Review",
    category: "review",
    description: "Check for security vulnerabilities",
    icon: "Shield",
    prompt: `## Security Review Checklist

Review the codebase for these security issues:

### Authentication
- [ ] All API routes check for authenticated user
- [ ] userId is always scoped in database queries
- [ ] No sensitive data exposed in client-side code

### Input Validation
- [ ] All user inputs validated with Zod
- [ ] SQL injection prevented (using ORM properly)
- [ ] XSS prevented (React handles this, but check dangerouslySetInnerHTML)

### API Security
- [ ] Rate limiting considered for expensive operations
- [ ] CORS configured properly
- [ ] No secrets in client bundle

### File Uploads (if applicable)
- [ ] File type validation
- [ ] File size limits
- [ ] Secure storage

Report any issues found with file path and line number.`,
  },
  {
    id: "review-typescript",
    name: "TypeScript Review",
    category: "review",
    description: "Check for type safety issues",
    icon: "Code2",
    prompt: `## TypeScript Review Checklist

Review the codebase for type safety:

### Type Completeness
- [ ] No \`any\` types (search for ": any" and "as any")
- [ ] All function parameters typed
- [ ] All return types explicit or inferred
- [ ] Proper use of generics where needed

### Null Safety
- [ ] Optional chaining used appropriately
- [ ] Nullish coalescing for defaults
- [ ] No unsafe type assertions

### Schema Alignment
- [ ] API request/response types match Zod schemas
- [ ] Database types match Drizzle schema
- [ ] Frontend types match API contracts

Run: \`npm run build\` to check for type errors.
Report any issues found with file path and line number.`,
  },
  {
    id: "review-ux",
    name: "UX Review",
    category: "review",
    description: "Check user experience quality",
    icon: "Palette",
    prompt: `## UX Review Checklist

Review the application for UX quality:

### Loading States
- [ ] All async operations show loading indicator
- [ ] Skeleton loaders for content
- [ ] Disabled buttons during submission

### Error Handling
- [ ] User-friendly error messages
- [ ] Form validation feedback
- [ ] Network error handling

### Accessibility
- [ ] Proper heading hierarchy
- [ ] Form labels associated with inputs
- [ ] Keyboard navigation works
- [ ] Color contrast adequate

### Responsiveness
- [ ] Mobile layout works
- [ ] Touch targets large enough (44px min)
- [ ] No horizontal scroll on mobile

### Feedback
- [ ] Success messages after actions
- [ ] Confirmation for destructive actions
- [ ] Clear call-to-action buttons

Report any issues found with file path and description.`,
  },
];

export async function GET() {
  return NextResponse.json({
    prompts,
    categories: {
      implementation: prompts.filter((p) => p.category === "implementation"),
      review: prompts.filter((p) => p.category === "review"),
    },
  });
}
