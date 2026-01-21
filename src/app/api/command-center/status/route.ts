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

// On Vercel, source files aren't accessible via fs at runtime
// We need to check multiple possible paths or use known deployment state
const ROOT = process.cwd();
const IS_VERCEL = process.env.VERCEL === "1";

// Known completed stages - these have been verified and deployed
// Update this object when stages are completed
const KNOWN_COMPLETED: Record<string, boolean> = {
  // Stage 1: Foundation - COMPLETE
  "S1-1": true, // Next.js app with App Router
  "S1-2": true, // Clerk authentication
  "S1-3": true, // Neon Postgres + Drizzle ORM
  "S1-4": true, // Database schema defined
  "S1-5": true, // Dashboard UI shell
  "S1-6": true, // Tailwind CSS configured
  // Stage 2: Estimates CRUD - COMPLETE
  "S2-1": true, // Estimates list API
  "S2-2": true, // Estimate detail API
  "S2-3": true, // Create estimate page
  "S2-4": true, // Edit estimate page
  "S2-5": true, // Delete estimate functionality
  "S2-6": true, // Auto-save on field blur
  // Stage 3: ESX Export - COMPLETE
  "S3-1": true, // Export API endpoint
  "S3-2": true, // PDF generation with jsPDF
  "S3-3": true, // Excel generation with ExcelJS
  "S3-4": true, // Export buttons in UI
  // Stage 4: AI Scope - COMPLETE
  "S4-1": true, // Anthropic SDK installed
  "S4-2": true, // AI suggest scope API
  "S4-3": true, // AI enhance description API
  "S4-4": true, // Suggest Scope button in UI
  // Stage 5: Mobile Sync - PARTIAL
  "S5-1": false, // PWA manifest.json - missing icons
  "S5-2": true, // Service worker setup
  "S5-3": true, // Offline status indicator
  "S5-4": true, // IndexedDB for offline cache (in src/lib/offline/storage.ts)
  // Stage 6: Polish - MOSTLY COMPLETE
  "S6-1": true, // Dashboard search functionality
  "S6-2": true, // Estimate duplicate API
  "S6-3": true, // Skeleton loaders
  "S6-4": false, // Toast notifications - not installed yet
  // Command Center - COMPLETE
  "CC-1": true, // Command Center page
  "CC-2": true, // Status API endpoint
  "CC-3": true, // Prompts API endpoint
};

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

// Wrapper that uses known state on Vercel, file checks locally
function checkTask(taskId: string, fileCheck: () => boolean): boolean {
  if (IS_VERCEL) {
    return KNOWN_COMPLETED[taskId] ?? false;
  }
  return fileCheck();
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
    check: () => checkTask("S1-1", () => fileExists("src/app/layout.tsx") && fileExists("next.config.ts")),
  },
  {
    id: "S1-2",
    name: "Clerk authentication",
    category: "Auth",
    files: ["src/middleware.ts"],
    check: () => checkTask("S1-2", () => fileContains("src/middleware.ts", "clerkMiddleware")),
  },
  {
    id: "S1-3",
    name: "Neon Postgres + Drizzle ORM",
    category: "Database",
    files: ["src/lib/db/index.ts"],
    check: () => checkTask("S1-3", () =>
      fileExists("src/lib/db/index.ts") &&
      fileContains("src/lib/db/index.ts", "drizzle")),
  },
  {
    id: "S1-4",
    name: "Database schema defined",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("S1-4", () => fileHasMinLines("src/lib/db/schema.ts", 10)),
  },
  {
    id: "S1-5",
    name: "Dashboard UI shell",
    category: "Web UI",
    files: ["src/app/dashboard/page.tsx"],
    check: () => checkTask("S1-5", () => fileExists("src/app/dashboard/page.tsx")),
  },
  {
    id: "S1-6",
    name: "Tailwind CSS configured",
    category: "Setup",
    files: ["tailwind.config.ts"],
    check: () => checkTask("S1-6", () => fileExists("tailwind.config.ts")),
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
    check: () => checkTask("S2-1", () =>
      fileExists("src/app/api/estimates/route.ts") &&
      fileContains("src/app/api/estimates/route.ts", "GET")),
  },
  {
    id: "S2-2",
    name: "Estimate detail API",
    category: "API",
    files: ["src/app/api/estimates/[id]/route.ts"],
    check: () => checkTask("S2-2", () =>
      fileExists("src/app/api/estimates/[id]/route.ts") &&
      fileContains("src/app/api/estimates/[id]/route.ts", "PATCH")),
  },
  {
    id: "S2-3",
    name: "Create estimate page",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/new/page.tsx"],
    check: () => checkTask("S2-3", () => fileExists("src/app/dashboard/estimates/new/page.tsx")),
  },
  {
    id: "S2-4",
    name: "Edit estimate page",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("S2-4", () =>
      fileExists("src/app/dashboard/estimates/[id]/page.tsx") &&
      fileHasMinLines("src/app/dashboard/estimates/[id]/page.tsx", 100)),
  },
  {
    id: "S2-5",
    name: "Delete estimate functionality",
    category: "API",
    files: ["src/app/api/estimates/[id]/route.ts"],
    check: () => checkTask("S2-5", () =>
      fileContains("src/app/api/estimates/[id]/route.ts", "DELETE")),
  },
  {
    id: "S2-6",
    name: "Auto-save on field blur",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("S2-6", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "onBlur")),
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
    check: () => checkTask("S3-1", () => fileExists("src/app/api/estimates/[id]/export/route.ts")),
  },
  {
    id: "S3-2",
    name: "PDF generation with jsPDF",
    category: "Export",
    files: ["src/app/api/estimates/[id]/export/route.ts"],
    check: () => checkTask("S3-2", () =>
      fileContains("src/app/api/estimates/[id]/export/route.ts", "jsPDF")),
  },
  {
    id: "S3-3",
    name: "Excel generation with ExcelJS",
    category: "Export",
    files: ["src/app/api/estimates/[id]/export/route.ts"],
    check: () => checkTask("S3-3", () =>
      fileContains("src/app/api/estimates/[id]/export/route.ts", "ExcelJS")),
  },
  {
    id: "S3-4",
    name: "Export buttons in UI",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("S3-4", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "handleExport")),
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
    check: () => checkTask("S4-1", () => fileContains("package.json", "@anthropic-ai/sdk")),
  },
  {
    id: "S4-2",
    name: "AI suggest scope API",
    category: "API",
    files: ["src/app/api/ai/suggest-scope/route.ts"],
    check: () => checkTask("S4-2", () => fileExists("src/app/api/ai/suggest-scope/route.ts")),
  },
  {
    id: "S4-3",
    name: "AI enhance description API",
    category: "API",
    files: ["src/app/api/ai/enhance-description/route.ts"],
    check: () => checkTask("S4-3", () => fileExists("src/app/api/ai/enhance-description/route.ts")),
  },
  {
    id: "S4-4",
    name: "Suggest Scope button in UI",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("S4-4", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "suggestScope")),
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
    check: () => checkTask("S5-1", () => fileExists("public/manifest.json")),
  },
  {
    id: "S5-2",
    name: "Service worker setup",
    category: "PWA",
    files: ["public/sw.js", "next.config.ts"],
    check: () => checkTask("S5-2", () =>
      fileExists("public/sw.js") ||
      fileContains("next.config.ts", "next-pwa")),
  },
  {
    id: "S5-3",
    name: "Offline status indicator",
    category: "Web UI",
    files: ["src/components/offline-indicator.tsx"],
    check: () => checkTask("S5-3", () => fileExists("src/components/offline-indicator.tsx")),
  },
  {
    id: "S5-4",
    name: "IndexedDB for offline cache",
    category: "PWA",
    files: ["src/lib/offline/storage.ts"],
    check: () => checkTask("S5-4", () => fileExists("src/lib/offline/storage.ts")),
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
    check: () => checkTask("S6-1", () =>
      fileContains("src/app/dashboard/page.tsx", "searchParams") ||
      fileContains("src/app/dashboard/page.tsx", "filter")),
  },
  {
    id: "S6-2",
    name: "Estimate duplicate API",
    category: "API",
    files: ["src/app/api/estimates/[id]/duplicate/route.ts"],
    check: () => checkTask("S6-2", () => fileExists("src/app/api/estimates/[id]/duplicate/route.ts")),
  },
  {
    id: "S6-3",
    name: "Skeleton loaders",
    category: "Web UI",
    files: ["src/components/ui/skeleton.tsx"],
    check: () => checkTask("S6-3", () => fileExists("src/components/ui/skeleton.tsx")),
  },
  {
    id: "S6-4",
    name: "Toast notifications",
    category: "Web UI",
    files: ["src/components/ui/toast.tsx"],
    check: () => checkTask("S6-4", () =>
      fileExists("src/components/ui/toast.tsx") ||
      fileContains("package.json", "sonner")),
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
    check: () => checkTask("CC-1", () => fileExists("src/app/dashboard/command-center/page.tsx")),
  },
  {
    id: "CC-2",
    name: "Status API endpoint",
    category: "API",
    files: ["src/app/api/command-center/status/route.ts"],
    check: () => checkTask("CC-2", () => fileExists("src/app/api/command-center/status/route.ts")),
  },
  {
    id: "CC-3",
    name: "Prompts API endpoint",
    category: "API",
    files: ["src/app/api/command-center/prompts/route.ts"],
    check: () => checkTask("CC-3", () => fileExists("src/app/api/command-center/prompts/route.ts")),
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
