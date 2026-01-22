import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// Import pre-generated status (built at build time via scripts/generate-command-center-status.ts)
// This works on Vercel since the JSON is generated before deployment
let generatedStatus: Record<string, boolean> = {};
try {
  // Dynamic import with fallback
  generatedStatus = require("@/lib/generated/command-center-status.json");
} catch {
  // Fallback: will be empty on first build, triggers all false
  console.warn("Command Center status not yet generated. Run: npx tsx scripts/generate-command-center-status.ts");
}

interface Task {
  id: string;
  name: string;
  category: string;
  files?: string[];
}

interface Workstream {
  id: string;
  name: string;
  description: string;
  color: string;
  tasks: Task[];
}

// Task definitions (metadata only - completion status comes from generated file)
const workstreamDefinitions: Workstream[] = [
  {
    id: "S1",
    name: "Stage 1: Foundation",
    description: "Next.js, Clerk auth, Neon Postgres, Drizzle ORM",
    color: "slate",
    tasks: [
      { id: "S1-1", name: "Next.js app with App Router", category: "Setup", files: ["src/app/layout.tsx", "next.config.ts"] },
      { id: "S1-2", name: "Clerk authentication", category: "Auth", files: ["src/middleware.ts"] },
      { id: "S1-3", name: "Neon Postgres + Drizzle ORM", category: "Database", files: ["src/lib/db/index.ts"] },
      { id: "S1-4", name: "Database schema defined", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "S1-5", name: "Dashboard UI shell", category: "Web UI", files: ["src/app/dashboard/page.tsx"] },
      { id: "S1-6", name: "Tailwind CSS configured", category: "Setup", files: ["tailwind.config.ts"] },
    ],
  },
  {
    id: "S2",
    name: "Stage 2: Estimates CRUD",
    description: "Create, read, update, delete estimates",
    color: "blue",
    tasks: [
      { id: "S2-1", name: "Estimates list API", category: "API", files: ["src/app/api/estimates/route.ts"] },
      { id: "S2-2", name: "Estimate detail API", category: "API", files: ["src/app/api/estimates/[id]/route.ts"] },
      { id: "S2-3", name: "Create estimate page", category: "Web UI", files: ["src/app/dashboard/estimates/new/page.tsx"] },
      { id: "S2-4", name: "Edit estimate page", category: "Web UI", files: ["src/app/dashboard/estimates/[id]/page.tsx"] },
      { id: "S2-5", name: "Delete estimate functionality", category: "API", files: ["src/app/api/estimates/[id]/route.ts"] },
      { id: "S2-6", name: "Auto-save on field blur", category: "Web UI", files: ["src/app/dashboard/estimates/[id]/estimate-detail-client.tsx"] },
    ],
  },
  {
    id: "S3",
    name: "Stage 3: ESX Export",
    description: "PDF and Excel export functionality",
    color: "cyan",
    tasks: [
      { id: "S3-1", name: "Export API endpoint", category: "Export", files: ["src/app/api/estimates/[id]/export/route.ts"] },
      { id: "S3-2", name: "PDF generation with jsPDF", category: "Export", files: ["src/app/api/estimates/[id]/export/route.ts"] },
      { id: "S3-3", name: "Excel generation with ExcelJS", category: "Export", files: ["src/app/api/estimates/[id]/export/route.ts"] },
      { id: "S3-4", name: "Export buttons in UI", category: "Web UI", files: ["src/app/dashboard/estimates/[id]/estimate-detail-client.tsx"] },
    ],
  },
  {
    id: "S4",
    name: "Stage 4: AI Scope",
    description: "AI-powered scope suggestions and enhancements",
    color: "purple",
    tasks: [
      { id: "S4-1", name: "Anthropic SDK installed", category: "AI", files: ["package.json"] },
      { id: "S4-2", name: "AI suggest scope API", category: "API", files: ["src/app/api/ai/suggest-scope/route.ts"] },
      { id: "S4-3", name: "AI enhance description API", category: "API", files: ["src/app/api/ai/enhance-description/route.ts"] },
      { id: "S4-4", name: "Suggest Scope button in UI", category: "Web UI", files: ["src/app/dashboard/estimates/[id]/estimate-detail-client.tsx"] },
    ],
  },
  {
    id: "S5",
    name: "Stage 5: Mobile Sync",
    description: "PWA, offline support, service worker",
    color: "orange",
    tasks: [
      { id: "S5-1", name: "PWA manifest.json", category: "PWA", files: ["public/manifest.json"] },
      { id: "S5-2", name: "Service worker setup", category: "PWA", files: ["public/sw.js", "next.config.ts"] },
      { id: "S5-3", name: "Offline status indicator", category: "Web UI", files: ["src/components/offline-indicator.tsx"] },
      { id: "S5-4", name: "IndexedDB for offline cache", category: "PWA", files: ["src/lib/offline/storage.ts"] },
    ],
  },
  {
    id: "S6",
    name: "Stage 6: Polish",
    description: "Search, filters, skeletons, toasts",
    color: "green",
    tasks: [
      { id: "S6-1", name: "Dashboard search functionality", category: "Web UI", files: ["src/app/dashboard/page.tsx"] },
      { id: "S6-2", name: "Estimate duplicate API", category: "API", files: ["src/app/api/estimates/[id]/duplicate/route.ts"] },
      { id: "S6-3", name: "Skeleton loaders", category: "Web UI", files: ["src/components/ui/skeleton.tsx"] },
      { id: "S6-4", name: "Toast notifications", category: "Web UI", files: ["src/components/ui/toast.tsx"] },
    ],
  },
  {
    id: "CC",
    name: "Command Center",
    description: "Development tracking dashboard",
    color: "indigo",
    tasks: [
      { id: "CC-1", name: "Command Center page", category: "Web UI", files: ["src/app/dashboard/command-center/page.tsx"] },
      { id: "CC-2", name: "Status API endpoint", category: "API", files: ["src/app/api/command-center/status/route.ts"] },
      { id: "CC-3", name: "Prompts API endpoint", category: "API", files: ["src/app/api/command-center/prompts/route.ts"] },
    ],
  },
  {
    id: "M1",
    name: "Migration M1: Dashboard & Navigation",
    description: "Sidebar, welcome banner, stat cards, charts, map",
    color: "rose",
    tasks: [
      { id: "M1-1", name: "Sidebar navigation", category: "Web UI", files: ["src/components/dashboard/sidebar.tsx"] },
      { id: "M1-2", name: "Welcome banner", category: "Web UI", files: ["src/components/dashboard/welcome-banner.tsx"] },
      { id: "M1-3", name: "Stat cards row", category: "Web UI", files: ["src/components/dashboard/stat-card.tsx"] },
      { id: "M1-4", name: "Monthly claims chart", category: "Web UI", files: ["src/components/dashboard/performance-metrics.tsx"] },
      { id: "M1-5", name: "Loss types donut chart", category: "Web UI", files: ["src/components/dashboard/performance-metrics.tsx"] },
      { id: "M1-6", name: "Claims table with tabs", category: "Web UI", files: ["src/components/dashboard/estimate-table.tsx"] },
      { id: "M1-7", name: "Projects map", category: "Web UI", files: ["src/components/dashboard/projects-map.tsx"] },
      { id: "M1-8", name: "Dashboard layout integration", category: "Web UI", files: ["src/app/dashboard/page.tsx", "src/components/dashboard/dashboard-layout.tsx"] },
    ],
  },
  {
    id: "M2",
    name: "Migration M2: Database Schema",
    description: "Rooms, annotations, line items, photos, assignments tables",
    color: "amber",
    tasks: [
      { id: "M2-1", name: "Levels table", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M2-2", name: "Rooms table", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M2-3", name: "Annotations table", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M2-4", name: "Line items table", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M2-5", name: "Photos table", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M2-6", name: "Assignments table", category: "Database", files: ["src/lib/db/schema.ts"] },
    ],
  },
  {
    id: "M3",
    name: "Migration M3: Rooms & Sketch Editor",
    description: "Konva.js canvas, walls, doors, windows, fixtures",
    color: "emerald",
    tasks: [
      { id: "M3-1", name: "Rooms tab on estimate detail", category: "Web UI", files: ["src/components/features/rooms-tab.tsx"] },
      { id: "M3-2", name: "Sketch canvas (Konva.js)", category: "Web UI", files: ["src/components/sketch-editor/SketchCanvas.tsx"] },
      { id: "M3-3", name: "Wall drawing tool", category: "Web UI", files: ["src/components/sketch-editor/layers/WallsLayer.tsx"] },
      { id: "M3-4", name: "Door tool", category: "Web UI", files: ["src/components/sketch-editor/layers/DoorsLayer.tsx"] },
      { id: "M3-5", name: "Window tool", category: "Web UI", files: ["src/components/sketch-editor/layers/WindowsLayer.tsx"] },
      { id: "M3-6", name: "Fixture tool", category: "Web UI", files: ["src/components/sketch-editor/layers/FixturesLayer.tsx"] },
      { id: "M3-7", name: "Staircase tool", category: "Web UI", files: ["src/components/sketch-editor/layers/StaircasesLayer.tsx"] },
      { id: "M3-8", name: "Room detection", category: "Web UI", files: ["src/lib/geometry/room-detection.ts"] },
      { id: "M3-9", name: "Toolbar component", category: "Web UI", files: ["src/components/sketch-editor/Toolbar.tsx"] },
      { id: "M3-10", name: "Level tabs", category: "Web UI", files: ["src/components/sketch-editor/LevelTabs.tsx"] },
    ],
  },
  {
    id: "M4",
    name: "Migration M4: Line Items & Pricing",
    description: "Scope management, Xactimate codes, pricing",
    color: "sky",
    tasks: [
      { id: "M4-1", name: "Line items API", category: "API", files: ["src/app/api/estimates/[id]/line-items/route.ts"] },
      { id: "M4-2", name: "Scope tab UI", category: "Web UI", files: ["src/components/features/scope-tab.tsx"] },
      { id: "M4-3", name: "Xactimate categories", category: "Reference", files: ["src/lib/reference/xactimate-categories.ts"] },
      { id: "M4-4", name: "Price list import", category: "API", files: ["src/app/api/price-lists/route.ts"] },
      { id: "M4-5", name: "Totals calculation", category: "Web UI", files: ["src/components/features/totals-summary.tsx"] },
      { id: "M4-6", name: "AI scope integration", category: "Web UI", files: ["src/components/features/ai-scope-modal.tsx"] },
      { id: "M4-7", name: "Line item reordering", category: "Web UI", files: ["src/components/features/scope-tab.tsx"] },
      { id: "M4-8", name: "Export with line items", category: "Export", files: ["src/app/api/estimates/[id]/export/route.ts"] },
    ],
  },
  {
    id: "M5",
    name: "Migration M5: Photos & Documentation",
    description: "Photo upload, gallery, capture, linking",
    color: "violet",
    tasks: [
      { id: "M5-1", name: "Photo upload API", category: "API", files: ["src/app/api/photos/route.ts"] },
      { id: "M5-2", name: "Photo gallery component", category: "Web UI", files: ["src/components/features/photo-gallery.tsx"] },
      { id: "M5-3", name: "Photo capture (mobile)", category: "Web UI", files: ["src/components/features/photo-upload.tsx"] },
      { id: "M5-4", name: "Photo linking", category: "Web UI", files: ["src/components/features/photo-lightbox.tsx"] },
      { id: "M5-5", name: "Photos tab on estimate", category: "Web UI", files: ["src/app/dashboard/estimates/[id]/estimate-detail-client.tsx"] },
      { id: "M5-6", name: "Export with photos", category: "Export", files: ["src/app/api/estimates/[id]/export/route.ts"] },
    ],
  },
  {
    id: "M6",
    name: "Migration M6: SLA & Workflow",
    description: "Carrier SLAs, milestone tracking, status workflow",
    color: "fuchsia",
    tasks: [
      { id: "M6-1", name: "Carrier configuration", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M6-2", name: "SLA events tracking", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M6-3", name: "SLA tab on estimate", category: "Web UI", files: ["src/components/features/sla-tab.tsx"] },
      { id: "M6-4", name: "Status workflow", category: "API", files: ["src/app/api/estimates/[id]/status/route.ts"] },
      { id: "M6-5", name: "SLA dashboard widget", category: "Web UI", files: ["src/components/dashboard/sla-widget.tsx"] },
      { id: "M6-6", name: "SLA badges", category: "Web UI", files: ["src/components/sla/sla-badge.tsx"] },
    ],
  },
  {
    id: "M7",
    name: "Migration M7: Portfolio & Analytics",
    description: "Portfolio dashboard, analytics, team metrics",
    color: "lime",
    tasks: [
      { id: "M7-1", name: "Portfolio page", category: "Web UI", files: ["src/app/dashboard/portfolio/page.tsx"] },
      { id: "M7-2", name: "Analytics page", category: "Web UI", files: ["src/app/dashboard/analytics/page.tsx"] },
      { id: "M7-3", name: "Team metrics", category: "Web UI", files: ["src/components/analytics/team-metrics.tsx"] },
      { id: "M7-4", name: "Carrier breakdown", category: "Web UI", files: ["src/components/portfolio/carrier-breakdown.tsx"] },
      { id: "M7-5", name: "Activity feed", category: "Web UI", files: ["src/components/portfolio/activity-feed.tsx"] },
      { id: "M7-6", name: "Export analytics", category: "Export", files: ["src/app/api/analytics/export/route.ts"] },
    ],
  },
  {
    id: "M8",
    name: "Migration M8: Vendor Portal",
    description: "Vendor management, quotes, comparison",
    color: "teal",
    tasks: [
      { id: "M8-1", name: "Vendor data model", category: "Database", files: ["src/lib/db/schema.ts"] },
      { id: "M8-2", name: "Vendor portal routes", category: "Web UI", files: ["src/app/vendor/page.tsx"] },
      { id: "M8-3", name: "Token-based auth", category: "Auth", files: ["src/lib/auth/vendor.ts"] },
      { id: "M8-4", name: "Quote request flow", category: "API", files: ["src/app/api/quote-requests/route.ts"] },
      { id: "M8-5", name: "Vendor quote submission", category: "Web UI", files: ["src/app/vendor/quotes/[id]/page.tsx"] },
      { id: "M8-6", name: "Quote comparison", category: "Web UI", files: ["src/components/quotes/quote-comparison.tsx"] },
    ],
  },
];

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build workstreams with status from generated file
  const workstreams = workstreamDefinitions.map((ws) => ({
    ...ws,
    tasks: ws.tasks.map((task) => ({
      ...task,
      status: generatedStatus[task.id] ? ("completed" as const) : ("pending" as const),
    })),
  }));

  // Calculate totals
  const allTasks = workstreams.flatMap((ws) => ws.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate by category
  const categoryStats = (category: string) => {
    const tasks = allTasks.filter((t) => t.category === category);
    if (tasks.length === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = tasks.filter((t) => t.status === "completed").length;
    return {
      completed,
      total: tasks.length,
      percent: Math.round((completed / tasks.length) * 100),
    };
  };

  const categoryBreakdown = [
    { name: "Setup", ...categoryStats("Setup"), color: "slate" },
    { name: "Auth", ...categoryStats("Auth"), color: "pink" },
    { name: "Database", ...categoryStats("Database"), color: "blue" },
    { name: "API", ...categoryStats("API"), color: "green" },
    { name: "Web UI", ...categoryStats("Web UI"), color: "purple" },
    { name: "Export", ...categoryStats("Export"), color: "cyan" },
    { name: "AI", ...categoryStats("AI"), color: "indigo" },
    { name: "PWA", ...categoryStats("PWA"), color: "orange" },
    { name: "Reference", ...categoryStats("Reference"), color: "yellow" },
  ].filter((c) => c.total > 0);

  // Determine verdict
  let verdict = "";
  if (progress >= 95) {
    verdict = "Production-ready";
  } else if (progress >= 70) {
    verdict = "Demo-ready";
  } else if (progress >= 40) {
    verdict = "MVP in progress";
  } else {
    verdict = "Early development";
  }

  return NextResponse.json({
    workstreams,
    summary: {
      totalTasks,
      completedTasks,
      progress,
    },
    assessment: {
      verdict,
      progress: `${progress}%`,
    },
    categoryBreakdown,
    timestamp: new Date().toISOString(),
  });
}
