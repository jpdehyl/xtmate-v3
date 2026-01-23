# XTmate V3

## Overview
XTmate is a property claims processing application that transforms restoration claims processing with LiDAR room capture, AI-generated scopes, and direct Xactimate export.

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **AI**: Anthropic Claude
- **Storage**: Vercel Blob
- **Maps**: Google Maps API

## Project Structure
```
src/
├── app/           # Next.js App Router pages and API routes
│   ├── api/       # API endpoints
│   ├── (auth)/    # Authentication pages
│   ├── dashboard/ # Dashboard pages
│   └── vendor/    # Vendor portal
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and database
│   └── db/        # Drizzle schema and database client
├── middleware.ts  # Next.js middleware (Clerk auth)
└── types/         # TypeScript type definitions
```

## Development

### Running the app
The dev server runs on port 5000:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

### Database Commands
```bash
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio
```

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `CLERK_SECRET_KEY` - Clerk authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `ANTHROPIC_API_KEY` - AI features (get from console.anthropic.com)
- `BLOB_READ_WRITE_TOKEN` - Photo uploads
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps (optional)

## Branding
- **Primary Color**: Paul Davis Gold (#b4975a) - defined as `pd-gold` in Tailwind config
- **Logo**: "PD" icon with PAUL DAVIS text
- **Color Usage**: All dashboard accents, buttons, active states, and status badges use the pd-gold color palette

## PM/Estimator Workflow
The application supports a two-role workflow:

### 1. Project Manager (iOS App - Future)
- Receives assignment via email from RMS-NGS
- Goes to site with iPhone/iPad
- Captures LiDAR data → point cloud → 2D render → sketch
- Documents damage observations (PM Scope items)
- Syncs data to web app via `/api/sync`

### 2. Estimator (Web App)
- Reviews PM's captured data and scope of work
- Views PM Scope items in the "PM Scope" tab
- Converts PM observations to proper Xactimate line items
- Adds pricing and Xactimate codes
- Exports ESX file for Xactimate import

### Key API Endpoints
- `POST /api/sync` - iOS app uploads rooms, photos, PM scope
- `GET /api/sync?estimateId=...` - Pull latest data
- `POST /api/sync/complete` - PM marks site capture complete
- `GET/POST /api/pm-scope` - Manage PM scope items
- `GET /api/estimates/[id]/esx` - Download ESX file for Xactimate

### Workflow Status Flow
`draft` → `pm_assigned` → `pm_in_progress` → `pm_completed` → `estimator_review` → `ready_for_export` → `exported` → `submitted`

## AI Assistant Features
The application includes comprehensive AI-powered features using Anthropic Claude:

### AI Endpoints
- `POST /api/ai/analyze-photo` - Analyze damage photos and suggest repair scopes
- `POST /api/ai/fill-data` - AI suggestions for filling estimate fields
- `POST /api/ai/generate-report` - Generate various report types (executive summary, detailed scope, damage assessment, insurance narrative, homeowner summary)
- `POST /api/ai/assistant` - Role-based AI assistant for different stakeholders (estimator, project manager, adjuster, homeowner, technician, admin)
- `POST /api/ai/suggest-scope` - Get AI-generated scope suggestions
- `POST /api/ai/enhance-description` - Enhance estimate names/descriptions

### Supported User Roles
- **Estimator**: Technical help with Xactimate codes, quantities, pricing
- **Project Manager**: Project scheduling, crew coordination, reporting
- **Adjuster**: Claim review, pricing verification, compliance
- **Homeowner**: Simple explanations, timeline expectations, process guidance
- **Technician**: Restoration techniques, safety protocols, documentation
- **Admin**: Scheduling, communication, document management

## Gmail Integration (Email-to-Estimate)
The application supports automatic email parsing for incoming claim requests:

### Setup
1. Create a Google Cloud project and enable Gmail API
2. Create OAuth 2.0 credentials (Web application type)
3. Add environment variables:
   - `GOOGLE_CLIENT_ID` - OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - OAuth client secret
   - `GOOGLE_REDIRECT_URI` - Callback URL (optional, defaults to `https://{domain}/api/gmail/callback`)

### Features
- Connect Gmail account via OAuth from Settings → Integrations
- Automatically fetch and parse incoming emails
- AI-powered extraction of claim details (insured, address, carrier, adjuster, claim #)
- Auto-create draft estimates from parsed emails
- Incoming Requests dashboard to manage email-created estimates

### Key Endpoints
- `GET /api/gmail/connect` - Get OAuth URL for Gmail connection
- `GET /api/gmail/callback` - OAuth callback handler
- `GET /api/gmail/status` - Get connection status
- `POST /api/gmail/disconnect` - Disconnect Gmail
- `POST /api/gmail/sync` - Manually sync emails
- `GET/POST /api/gmail/emails` - View/manage incoming emails

### Database Tables
- `email_integrations` - Stores OAuth tokens and settings
- `incoming_emails` - Stores parsed emails and their status

## Recent Changes
- January 22, 2026: Gmail Integration for Email-to-Estimate
  - Added Gmail API OAuth integration for automatic email parsing
  - Created AI-powered email parser using GPT-4o for claim detail extraction
  - Added Settings → Integrations page for Gmail connection management
  - Added Incoming Requests dashboard for email-created estimates
  - Added `email_integrations` and `incoming_emails` database tables
  - Fixed "Property Manager" → "Project Manager" label throughout codebase
  - Added signed OAuth state for security
  - Added permission checks for email endpoints
- January 22, 2026: AI Assistant Integration
  - Added photo analysis endpoint for damage assessment from images
  - Added data fill assistant for intelligent field suggestions
  - Added report generation for multiple report types
  - Added role-based AI assistant for all stakeholders
  - Updated all AI endpoints to use Replit AI Integrations (Anthropic)
  - Supported models: claude-sonnet-4-5, claude-haiku-4-5, claude-opus-4-5
- January 22, 2026: Enhanced Dashboard with Aniq-UI Design
  - Added StatCard component with trend indicators showing percentage changes
  - Created QuickTasks widget for managing daily tasks (add/complete/delete/filter)
  - Added interactive CalendarWidget with month navigation
  - Upgraded AreaChart with gradient fills for modern styling
  - Added advanced filter panel to EstimateTable (job type, date range, reset)
  - Enhanced status badges with color-coded dot indicators
  - Created PerformanceAnalytics panel with donut chart and insights
  - Created `sla_events` database table for SLA tracking
- January 22, 2026: Convert to Line Item Modal & Workflow Status
  - Added ConvertScopeModal for estimators to convert PM scope items to line items
  - Pre-populates description from PM notes, calculates quantity from room sq ft
  - Added WorkflowStatusBadge component with icons for all 8 workflow stages
  - Added WorkflowProgressBar to show visual progress
  - Workflow status badge now displays in estimate detail header
  - Added PATCH `/api/pm-scope/[id]` endpoint to update converted status
- January 22, 2026: PM/Estimator Workflow Implementation
  - Added `pm_scope_items` table for PM damage observations
  - Added `esx_exports` table for export history tracking
  - Added `sync_queue` table for offline iOS sync support
  - Added workflow status and assignment fields to estimates
  - Created sync API endpoints (`/api/sync`, `/api/sync/complete`)
  - Built ESX export generator (`src/lib/esx/generator.ts`)
  - Added ESX download endpoint (`/api/estimates/[id]/esx`)
  - Added PM Scope tab to estimate detail page
  - Added gold "Xactimate" export button to estimate header
- January 22, 2026: Dashboard branding update
  - Updated sidebar to show PAUL DAVIS branding with PD logo and pd-gold colors
  - Welcome banner now uses pd-gold gradient
  - All performance metrics KPI icons and charts use pd-gold palette
  - Estimate table tabs, status badges, and job type badges use pd-gold styling
  - Recent estimates and projects map components updated to pd-gold
  - Stat cards use pd-gold accents for icons and trend indicators
  - UI tabs component uses pd-gold for active states
  - Removed all primary-* color classes from dashboard components
- January 21, 2026: Code quality improvements
  - Added rate limiting to all API endpoints (estimates GET/POST/PATCH/DELETE, portfolio) with Retry-After headers
  - Created structured logging utility (`src/lib/logger.ts`) with levels (debug/info/warn/error) and context
  - Fixed insurance job validation - claimNumber now required when jobType=insurance
  - Portfolio API now calculates real values from line items instead of hardcoded placeholders
  - Added SLA business hours calculations with work-day awareness
  - Expanded test coverage to 86 passing tests across 5 test files
- January 21, 2026: Initial Replit environment setup
