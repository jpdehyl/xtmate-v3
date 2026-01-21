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
- `ANTHROPIC_API_KEY` - AI features
- `BLOB_READ_WRITE_TOKEN` - Photo uploads
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps (optional)

## Recent Changes
- January 21, 2026: Code quality improvements
  - Added rate limiting to all API endpoints (estimates GET/POST/PATCH/DELETE, portfolio) with Retry-After headers
  - Created structured logging utility (`src/lib/logger.ts`) with levels (debug/info/warn/error) and context
  - Fixed insurance job validation - claimNumber now required when jobType=insurance
  - Portfolio API now calculates real values from line items instead of hardcoded placeholders
  - Added SLA business hours calculations with work-day awareness
  - Expanded test coverage to 86 passing tests across 5 test files
- January 21, 2026: Initial Replit environment setup
