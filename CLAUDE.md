# XTmate V3 - Project Knowledge Base

## Project Overview
XTmate is an estimation tool for construction/landscaping projects. V3 is a complete rewrite focusing on simplicity, maintainability, and reliability.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Auth**: Clerk 6
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest + React Testing Library

## Architecture Decisions

### Why This Stack?
1. **Clerk for Auth**: Eliminates 94 duplicated auth patterns from V2. Single middleware handles all auth.
2. **Drizzle ORM**: Type-safe database access, simpler than Prisma, better edge support.
3. **Local Fonts**: No Google Fonts CDN dependency (caused V2 build failures).
4. **App Router**: Server components by default, better performance.

### Database Schema (Target: 15 tables vs V2's 35)
Core tables:
- `users` - Clerk-synced user data
- `organizations` - Multi-tenant support
- `estimates` - Core estimate records
- `estimate_items` - Line items with quantities
- `templates` - Reusable estimate templates
- `materials` - Material catalog
- `labor_rates` - Labor pricing

## Directory Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Auth routes (sign-in, sign-up)
│   ├── dashboard/      # Protected app pages
│   └── api/            # API routes
├── components/         # React components
│   ├── ui/            # Base UI components
│   └── features/      # Feature-specific components
├── lib/               # Utilities and configs
│   ├── db/           # Database schema and queries
│   └── utils/        # Helper functions
└── middleware.ts      # Clerk auth middleware
```

## Development Commands
```bash
npm run dev          # Start dev server
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

## Migration Stages (from V2)
1. ✅ Foundation - This setup
2. 🔲 Estimates CRUD - Core functionality
3. 🔲 ESX Export - PDF/Excel export
4. 🔲 AI Scope - Smart suggestions
5. 🔲 Mobile Sync - Offline support
6. 🔲 Polish - UX improvements

## Testing Strategy
- Unit tests for utilities
- Component tests for UI
- Integration tests for API routes
- E2E tests for critical paths

Run tests: `npm run test`

## Environment Variables
See `.env.example` for required variables. Key ones:
- `CLERK_SECRET_KEY` - Clerk backend key
- `DATABASE_URL` - Neon connection string

## Common Issues

### Build Failures
- Ensure no Google Fonts imports (use local fonts)
- Check Clerk keys are set
- Verify DATABASE_URL is valid

### Type Errors
- Run `npm run build` to check types
- Drizzle schemas must match migrations
