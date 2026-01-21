import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

interface TaskCheck {
  id: string;
  name: string;
  check: () => boolean;
  files?: string[];
  category?: string;
}

const ROOT = process.cwd();

function fileExists(relativePath: string): boolean {
  try {
    const fullPath = path.join(ROOT, relativePath);
    return fs.existsSync(fullPath);
  } catch {
    return false;
  }
}

function fileContains(relativePath: string, searchString: string): boolean {
  try {
    const fullPath = path.join(ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return false;
    const content = fs.readFileSync(fullPath, "utf-8");
    return content.includes(searchString);
  } catch {
    return false;
  }
}

function fileHasMinLines(relativePath: string, minLines: number): boolean {
  try {
    const fullPath = path.join(ROOT, relativePath);
    if (!fs.existsSync(fullPath)) return false;
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n").length;
    return lines >= minLines;
  } catch {
    return false;
  }
}

// ============================================================================
// STAGE 1 - Foundation
// ============================================================================
const stage1: TaskCheck[] = [
  {
    id: "S1-1",
    name: "Next.js app with App Router",
    category: "Setup",
    files: ["src/app/layout.tsx", "next.config.ts"],
    check: () => fileExists("src/app/layout.tsx") && fileExists("next.config.ts"),
  },
  {
    id: "S1-2",
    name: "Clerk authentication",
    category: "Auth",
    files: ["src/middleware.ts"],
    check: () => fileContains("src/middleware.ts", "clerkMiddleware"),
  },
  {
    id: "S1-3",
    name: "Neon Postgres + Drizzle ORM",
    category: "Database",
    files: ["src/lib/db/index.ts"],
    check: () =>
      fileExists("src/lib/db/index.ts") &&
      fileContains("src/lib/db/index.ts", "drizzle"),
  },
  {
    id: "S1-4",
    name: "Database schema defined",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => fileHasMinLines("src/lib/db/schema.ts", 10),
  },
  {
    id: "S1-5",
    name: "Dashboard UI shell",
    category: "Web UI",
    files: ["src/app/dashboard/page.tsx"],
    check: () => fileExists("src/app/dashboard/page.tsx"),
  },
  {
    id: "S1-6",
    name: "Tailwind CSS configured",
    category: "Setup",
    files: ["tailwind.config.ts"],
    check: () => fileExists("tailwind.config.ts"),
  },
];

// ============================================================================
// STAGE 2 - Estimates CRUD
// ============================================================================
const stage2: TaskCheck[] = [
  {
    id: "S2-1",
    name: "Estimates list API",
    category: "API",
    files: ["src/app/api/estimates/route.ts"],
    check: () =>
      fileExists("src/app/api/estimates/route.ts") &&
      fileContains("src/app/api/estimates/route.ts", "GET"),
  },
  {
    id: "S2-2",
    name: "Estimate detail API",
    category: "API",
    files: ["src/app/api/estimates/[id]/route.ts"],
    check: () =>
      fileExists("src/app/api/estimates/[id]/route.ts") &&
      fileContains("src/app/api/estimates/[id]/route.ts", "PATCH"),
  },
  {
    id: "S2-3",
    name: "Create estimate page",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/new/page.tsx"],
    check: () => fileExists("src/app/dashboard/estimates/new/page.tsx"),
  },
  {
    id: "S2-4",
    name: "Edit estimate page",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () =>
      fileExists("src/app/dashboard/estimates/[id]/page.tsx") &&
      fileHasMinLines("src/app/dashboard/estimates/[id]/page.tsx", 100),
  },
  {
    id: "S2-5",
    name: "Delete estimate functionality",
    category: "API",
    files: ["src/app/api/estimates/[id]/route.ts"],
    check: () =>
      fileContains("src/app/api/estimates/[id]/route.ts", "DELETE"),
  },
  {
    id: "S2-6",
    name: "Auto-save on field blur",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "onBlur"),
  },
];

// ============================================================================
// STAGE 3 - ESX Export (PDF/Excel)
// ============================================================================
const stage3: TaskCheck[] = [
  {
    id: "S3-1",
    name: "Export API endpoint",
    category: "Export",
    files: ["src/app/api/estimates/[id]/export/route.ts"],
    check: () => fileExists("src/app/api/estimates/[id]/export/route.ts"),
  },
  {
    id: "S3-2",
    name: "PDF generation with jsPDF",
    category: "Export",
    files: ["src/app/api/estimates/[id]/export/route.ts"],
    check: () =>
      fileContains("src/app/api/estimates/[id]/export/route.ts", "jsPDF"),
  },
  {
    id: "S3-3",
    name: "Excel generation with ExcelJS",
    category: "Export",
    files: ["src/app/api/estimates/[id]/export/route.ts"],
    check: () =>
      fileContains("src/app/api/estimates/[id]/export/route.ts", "ExcelJS"),
  },
  {
    id: "S3-4",
    name: "Export buttons in UI",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "handleExport"),
  },
];

// ============================================================================
// STAGE 4 - AI Scope (Planned)
// ============================================================================
const stage4: TaskCheck[] = [
  {
    id: "S4-1",
    name: "Anthropic SDK installed",
    category: "AI",
    files: ["package.json"],
    check: () => fileContains("package.json", "@anthropic-ai/sdk"),
  },
  {
    id: "S4-2",
    name: "AI suggest scope API",
    category: "API",
    files: ["src/app/api/ai/suggest-scope/route.ts"],
    check: () => fileExists("src/app/api/ai/suggest-scope/route.ts"),
  },
  {
    id: "S4-3",
    name: "AI enhance description API",
    category: "API",
    files: ["src/app/api/ai/enhance-description/route.ts"],
    check: () => fileExists("src/app/api/ai/enhance-description/route.ts"),
  },
  {
    id: "S4-4",
    name: "Suggest Scope button in UI",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "suggestScope"),
  },
];

// ============================================================================
// STAGE 5 - Mobile Sync (Planned)
// ============================================================================
const stage5: TaskCheck[] = [
  {
    id: "S5-1",
    name: "PWA manifest.json",
    category: "PWA",
    files: ["public/manifest.json"],
    check: () => fileExists("public/manifest.json"),
  },
  {
    id: "S5-2",
    name: "Service worker setup",
    category: "PWA",
    files: ["public/sw.js", "next.config.ts"],
    check: () =>
      fileExists("public/sw.js") ||
      fileContains("next.config.ts", "next-pwa"),
  },
  {
    id: "S5-3",
    name: "Offline status indicator",
    category: "Web UI",
    files: ["src/components/offline-indicator.tsx"],
    check: () => fileExists("src/components/offline-indicator.tsx"),
  },
  {
    id: "S5-4",
    name: "IndexedDB for offline cache",
    category: "PWA",
    files: ["src/lib/offline-db.ts"],
    check: () => fileExists("src/lib/offline-db.ts"),
  },
];

// ============================================================================
// STAGE 6 - Polish (Planned)
// ============================================================================
const stage6: TaskCheck[] = [
  {
    id: "S6-1",
    name: "Dashboard search functionality",
    category: "Web UI",
    files: ["src/app/dashboard/page.tsx"],
    check: () =>
      fileContains("src/app/dashboard/page.tsx", "searchParams") ||
      fileContains("src/app/dashboard/page.tsx", "filter"),
  },
  {
    id: "S6-2",
    name: "Estimate duplicate API",
    category: "API",
    files: ["src/app/api/estimates/[id]/duplicate/route.ts"],
    check: () => fileExists("src/app/api/estimates/[id]/duplicate/route.ts"),
  },
  {
    id: "S6-3",
    name: "Skeleton loaders",
    category: "Web UI",
    files: ["src/components/ui/skeleton.tsx"],
    check: () => fileExists("src/components/ui/skeleton.tsx"),
  },
  {
    id: "S6-4",
    name: "Toast notifications",
    category: "Web UI",
    files: ["src/components/ui/toast.tsx"],
    check: () =>
      fileExists("src/components/ui/toast.tsx") ||
      fileContains("package.json", "sonner"),
  },
];

// ============================================================================
// COMMAND CENTER - Meta tasks
// ============================================================================
const commandCenter: TaskCheck[] = [
  {
    id: "CC-1",
    name: "Command Center page",
    category: "Web UI",
    files: ["src/app/dashboard/command-center/page.tsx"],
    check: () => fileExists("src/app/dashboard/command-center/page.tsx"),
  },
  {
    id: "CC-2",
    name: "Status API endpoint",
    category: "API",
    files: ["src/app/api/command-center/status/route.ts"],
    check: () => fileExists("src/app/api/command-center/status/route.ts"),
  },
  {
    id: "CC-3",
    name: "Prompts API endpoint",
    category: "API",
    files: ["src/app/api/command-center/prompts/route.ts"],
    check: () => fileExists("src/app/api/command-center/prompts/route.ts"),
  },
];

function evaluateWorkstream(tasks: TaskCheck[]) {
  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    files: task.files,
    category: task.category,
    status: task.check() ? ("completed" as const) : ("pending" as const),
  }));
}

export async function GET() {
  const workstreams = [
    {
      id: "S1",
      name: "Stage 1: Foundation",
      description: "Next.js, Clerk auth, Neon Postgres, Drizzle ORM",
      color: "slate",
      tasks: evaluateWorkstream(stage1),
    },
    {
      id: "S2",
      name: "Stage 2: Estimates CRUD",
      description: "Create, read, update, delete estimates",
      color: "blue",
      tasks: evaluateWorkstream(stage2),
    },
    {
      id: "S3",
      name: "Stage 3: ESX Export",
      description: "PDF and Excel export functionality",
      color: "cyan",
      tasks: evaluateWorkstream(stage3),
    },
    {
      id: "S4",
      name: "Stage 4: AI Scope",
      description: "AI-powered scope suggestions and enhancements",
      color: "purple",
      tasks: evaluateWorkstream(stage4),
    },
    {
      id: "S5",
      name: "Stage 5: Mobile Sync",
      description: "PWA, offline support, service worker",
      color: "orange",
      tasks: evaluateWorkstream(stage5),
    },
    {
      id: "S6",
      name: "Stage 6: Polish",
      description: "Search, filters, skeletons, toasts",
      color: "green",
      tasks: evaluateWorkstream(stage6),
    },
    {
      id: "CC",
      name: "Command Center",
      description: "Development tracking dashboard",
      color: "indigo",
      tasks: evaluateWorkstream(commandCenter),
    },
  ];

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
