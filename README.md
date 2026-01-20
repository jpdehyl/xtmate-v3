# XTmate V3

Professional estimation tool for construction and landscaping projects.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Auth**: Clerk 6
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jpdehyl/xtmate-v3.git
   cd xtmate-v3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment:
   - Get Clerk keys from [clerk.com](https://dashboard.clerk.com)
   - Get database URL from [Neon](https://console.neon.tech)

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/         # Auth routes (sign-in, sign-up)
│   ├── dashboard/      # Protected app pages
│   └── api/            # API routes
├── components/         # React components
├── lib/               # Utilities and configs
└── middleware.ts      # Clerk auth middleware
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run db:studio    # Open Drizzle Studio
npm run db:migrate   # Run migrations
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

## License

Private - All rights reserved
