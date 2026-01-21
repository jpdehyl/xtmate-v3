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

interface Workstream {
  id: string;
  name: string;
  description: string;
  color: string;
  tasks: TaskCheck[];
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
  // Stage 5: Mobile Sync - COMPLETE
  "S5-1": true, // PWA manifest.json
  "S5-2": true, // Service worker setup
  "S5-3": true, // Offline status indicator
  "S5-4": true, // IndexedDB for offline cache
  // Stage 6: Polish - COMPLETE
  "S6-1": true, // Dashboard search functionality
  "S6-2": true, // Estimate duplicate API
  "S6-3": true, // Skeleton loaders
  "S6-4": true, // Toast notifications (sonner)
  // Command Center - COMPLETE
  "CC-1": true, // Command Center page
  "CC-2": true, // Status API endpoint
  "CC-3": true, // Prompts API endpoint

  // ============================================================================
  // V2 MIGRATION SPRINTS - All start as NOT STARTED
  // ============================================================================

  // Sprint M1: Dashboard & Navigation
  "M1-1": true, // Sidebar navigation
  "M1-2": true, // Welcome banner
  "M1-3": true, // Stat cards row
  "M1-4": true, // Monthly claims chart (in performance-metrics.tsx)
  "M1-5": true, // Loss types donut chart (in performance-metrics.tsx)
  "M1-6": true, // Claims table with tabs
  "M1-7": true, // Projects map
  "M1-8": true, // Dashboard layout integration

  // Sprint M2: Database Schema Expansion
  "M2-1": true, // Levels table
  "M2-2": true, // Rooms table
  "M2-3": true, // Annotations table
  "M2-4": true, // Line items table
  "M2-5": true, // Photos table
  "M2-6": true, // Assignments table

  // Sprint M3: Rooms & Sketch Editor
  "M3-1": false, // Rooms tab on estimate detail
  "M3-2": false, // Sketch canvas (Konva.js)
  "M3-3": false, // Wall drawing tool
  "M3-4": false, // Door tool
  "M3-5": false, // Window tool
  "M3-6": false, // Fixture tool
  "M3-7": false, // Staircase tool
  "M3-8": false, // Room detection
  "M3-9": false, // Toolbar component
  "M3-10": false, // Level tabs

  // Sprint M4: Line Items & Pricing
  "M4-1": false, // Line items API
  "M4-2": false, // Scope tab UI
  "M4-3": false, // Xactimate categories
  "M4-4": false, // Price list import
  "M4-5": false, // Totals calculation
  "M4-6": false, // AI scope integration
  "M4-7": false, // Line item reordering
  "M4-8": false, // Export with line items

  // Sprint M5: Photos & Documentation
  "M5-1": false, // Photo upload API
  "M5-2": false, // Photo gallery component
  "M5-3": false, // Photo capture (mobile)
  "M5-4": false, // Photo linking
  "M5-5": false, // Photos tab on estimate
  "M5-6": false, // Export with photos

  // Sprint M6: SLA & Workflow
  "M6-1": false, // Carrier configuration
  "M6-2": false, // SLA events tracking
  "M6-3": false, // SLA tab on estimate
  "M6-4": false, // Status workflow
  "M6-5": false, // SLA dashboard widget
  "M6-6": false, // SLA badges

  // Sprint M7: Portfolio & Analytics
  "M7-1": false, // Portfolio page
  "M7-2": false, // Analytics page
  "M7-3": false, // Team metrics
  "M7-4": false, // Carrier breakdown
  "M7-5": false, // Activity feed
  "M7-6": false, // Export analytics

  // Sprint M8: Vendor Portal
  "M8-1": false, // Vendor data model
  "M8-2": false, // Vendor portal routes
  "M8-3": false, // Token-based auth
  "M8-4": false, // Quote request flow
  "M8-5": false, // Vendor quote submission
  "M8-6": false, // Quote comparison
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
// STAGE 1 - Foundation (COMPLETE)
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
// STAGE 2 - Estimates CRUD (COMPLETE)
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
// STAGE 3 - ESX Export (COMPLETE)
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
// STAGE 4 - AI Scope (COMPLETE)
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
// STAGE 5 - Mobile Sync (PARTIAL)
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
// STAGE 6 - Polish (MOSTLY COMPLETE)
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
// COMMAND CENTER (COMPLETE)
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

// ============================================================================
// V2 MIGRATION SPRINT M1: Dashboard & Navigation
// ============================================================================
const migrationM1: TaskCheck[] = [
  {
    id: "M1-1",
    name: "Sidebar navigation",
    category: "Web UI",
    files: ["src/components/dashboard/sidebar.tsx"],
    check: () => checkTask("M1-1", () =>
      fileExists("src/components/dashboard/sidebar.tsx") &&
      fileContains("src/components/dashboard/sidebar.tsx", "Dashboard") &&
      fileContains("src/components/dashboard/sidebar.tsx", "Portfolio")),
  },
  {
    id: "M1-2",
    name: "Welcome banner",
    category: "Web UI",
    files: ["src/components/dashboard/welcome-banner.tsx"],
    check: () => checkTask("M1-2", () =>
      fileExists("src/components/dashboard/welcome-banner.tsx") &&
      (fileContains("src/components/dashboard/welcome-banner.tsx", "morning") ||
       fileContains("src/components/dashboard/welcome-banner.tsx", "afternoon"))),
  },
  {
    id: "M1-3",
    name: "Stat cards row",
    category: "Web UI",
    files: ["src/components/dashboard/stat-card.tsx"],
    check: () => checkTask("M1-3", () =>
      fileExists("src/components/dashboard/stat-card.tsx") &&
      fileContains("src/components/dashboard/stat-card.tsx", "title") &&
      fileContains("src/components/dashboard/stat-card.tsx", "value")),
  },
  {
    id: "M1-4",
    name: "Monthly claims chart",
    category: "Web UI",
    files: ["src/components/dashboard/performance-metrics.tsx"],
    check: () => checkTask("M1-4", () =>
      fileContains("package.json", "recharts") &&
      (fileExists("src/components/dashboard/monthly-chart.tsx") ||
       fileContains("src/app/dashboard/page.tsx", "BarChart") ||
       fileContains("src/components/dashboard/performance-metrics.tsx", "BarChart"))),
  },
  {
    id: "M1-5",
    name: "Loss types donut chart",
    category: "Web UI",
    files: ["src/components/dashboard/performance-metrics.tsx"],
    check: () => checkTask("M1-5", () =>
      fileExists("src/components/dashboard/loss-types-chart.tsx") ||
      fileContains("src/app/dashboard/page.tsx", "PieChart") ||
      fileContains("src/components/dashboard/performance-metrics.tsx", "PieChart")),
  },
  {
    id: "M1-6",
    name: "Claims table with tabs",
    category: "Web UI",
    files: ["src/components/dashboard/estimate-table.tsx"],
    check: () => checkTask("M1-6", () =>
      fileExists("src/components/dashboard/estimate-table.tsx") &&
      fileContains("src/components/dashboard/estimate-table.tsx", "tab")),
  },
  {
    id: "M1-7",
    name: "Projects map",
    category: "Web UI",
    files: ["src/components/dashboard/projects-map.tsx"],
    check: () => checkTask("M1-7", () =>
      fileExists("src/components/dashboard/projects-map.tsx") &&
      (fileContains("src/components/dashboard/projects-map.tsx", "google") ||
       fileContains("src/components/dashboard/projects-map.tsx", "Map"))),
  },
  {
    id: "M1-8",
    name: "Dashboard layout integration",
    category: "Web UI",
    files: ["src/app/dashboard/page.tsx", "src/components/dashboard/dashboard-layout.tsx"],
    check: () => checkTask("M1-8", () =>
      // Check if using DashboardLayout wrapper pattern (V3 architecture)
      (fileContains("src/app/dashboard/page.tsx", "DashboardLayout") &&
       fileContains("src/components/dashboard/dashboard-layout.tsx", "Sidebar") &&
       fileContains("src/app/dashboard/dashboard-content.tsx", "WelcomeBanner")) ||
      // Or direct imports in page.tsx (original spec)
      (fileContains("src/app/dashboard/page.tsx", "Sidebar") &&
       fileContains("src/app/dashboard/page.tsx", "WelcomeBanner"))),
  },
];

// ============================================================================
// V2 MIGRATION SPRINT M2: Database Schema Expansion
// ============================================================================
const migrationM2: TaskCheck[] = [
  {
    id: "M2-1",
    name: "Levels table",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M2-1", () =>
      fileContains("src/lib/db/schema.ts", "levels") &&
      fileContains("src/lib/db/schema.ts", "pgTable")),
  },
  {
    id: "M2-2",
    name: "Rooms table",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M2-2", () =>
      fileContains("src/lib/db/schema.ts", "rooms") &&
      fileContains("src/lib/db/schema.ts", "squareFeet")),
  },
  {
    id: "M2-3",
    name: "Annotations table",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M2-3", () =>
      fileContains("src/lib/db/schema.ts", "annotations") &&
      fileContains("src/lib/db/schema.ts", "damageType")),
  },
  {
    id: "M2-4",
    name: "Line items table",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M2-4", () =>
      (fileContains("src/lib/db/schema.ts", "lineItems") ||
       fileContains("src/lib/db/schema.ts", "line_items")) &&
      fileContains("src/lib/db/schema.ts", "selector")),
  },
  {
    id: "M2-5",
    name: "Photos table",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M2-5", () =>
      fileContains("src/lib/db/schema.ts", "photos") &&
      fileContains("src/lib/db/schema.ts", "photoType")),
  },
  {
    id: "M2-6",
    name: "Assignments table",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M2-6", () =>
      fileContains("src/lib/db/schema.ts", "assignments") &&
      fileContains("src/lib/db/schema.ts", "type")),
  },
];

// ============================================================================
// V2 MIGRATION SPRINT M3: Rooms & Sketch Editor
// ============================================================================
const migrationM3: TaskCheck[] = [
  {
    id: "M3-1",
    name: "Rooms tab on estimate detail",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("M3-1", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "Rooms")),
  },
  {
    id: "M3-2",
    name: "Sketch canvas (Konva.js)",
    category: "Web UI",
    files: ["src/components/sketch-editor/SketchCanvas.tsx"],
    check: () => checkTask("M3-2", () =>
      fileExists("src/components/sketch-editor/SketchCanvas.tsx") &&
      fileContains("src/components/sketch-editor/SketchCanvas.tsx", "react-konva")),
  },
  {
    id: "M3-3",
    name: "Wall drawing tool",
    category: "Web UI",
    files: ["src/components/sketch-editor/layers/WallsLayer.tsx"],
    check: () => checkTask("M3-3", () =>
      fileExists("src/components/sketch-editor/layers/WallsLayer.tsx")),
  },
  {
    id: "M3-4",
    name: "Door tool",
    category: "Web UI",
    files: ["src/components/sketch-editor/layers/DoorsLayer.tsx"],
    check: () => checkTask("M3-4", () =>
      fileExists("src/components/sketch-editor/layers/DoorsLayer.tsx")),
  },
  {
    id: "M3-5",
    name: "Window tool",
    category: "Web UI",
    files: ["src/components/sketch-editor/layers/WindowsLayer.tsx"],
    check: () => checkTask("M3-5", () =>
      fileExists("src/components/sketch-editor/layers/WindowsLayer.tsx")),
  },
  {
    id: "M3-6",
    name: "Fixture tool",
    category: "Web UI",
    files: ["src/components/sketch-editor/layers/FixturesLayer.tsx"],
    check: () => checkTask("M3-6", () =>
      fileExists("src/components/sketch-editor/layers/FixturesLayer.tsx")),
  },
  {
    id: "M3-7",
    name: "Staircase tool",
    category: "Web UI",
    files: ["src/components/sketch-editor/layers/StaircasesLayer.tsx"],
    check: () => checkTask("M3-7", () =>
      fileExists("src/components/sketch-editor/layers/StaircasesLayer.tsx")),
  },
  {
    id: "M3-8",
    name: "Room detection",
    category: "Web UI",
    files: ["src/lib/geometry/room-detection.ts"],
    check: () => checkTask("M3-8", () =>
      fileExists("src/lib/geometry/room-detection.ts") &&
      fileContains("src/lib/geometry/room-detection.ts", "detectRooms")),
  },
  {
    id: "M3-9",
    name: "Toolbar component",
    category: "Web UI",
    files: ["src/components/sketch-editor/Toolbar.tsx"],
    check: () => checkTask("M3-9", () =>
      fileExists("src/components/sketch-editor/Toolbar.tsx")),
  },
  {
    id: "M3-10",
    name: "Level tabs",
    category: "Web UI",
    files: ["src/components/sketch-editor/LevelTabs.tsx"],
    check: () => checkTask("M3-10", () =>
      fileExists("src/components/sketch-editor/LevelTabs.tsx")),
  },
];

// ============================================================================
// V2 MIGRATION SPRINT M4: Line Items & Pricing
// ============================================================================
const migrationM4: TaskCheck[] = [
  {
    id: "M4-1",
    name: "Line items API",
    category: "API",
    files: ["src/app/api/line-items/route.ts"],
    check: () => checkTask("M4-1", () =>
      fileExists("src/app/api/line-items/route.ts") &&
      fileContains("src/app/api/line-items/route.ts", "GET")),
  },
  {
    id: "M4-2",
    name: "Scope tab UI",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("M4-2", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "Scope")),
  },
  {
    id: "M4-3",
    name: "Xactimate categories",
    category: "Reference",
    files: ["src/lib/reference/xactimate-categories.ts"],
    check: () => checkTask("M4-3", () =>
      fileExists("src/lib/reference/xactimate-categories.ts")),
  },
  {
    id: "M4-4",
    name: "Price list import",
    category: "API",
    files: ["src/app/api/price-lists/route.ts"],
    check: () => checkTask("M4-4", () =>
      fileExists("src/app/api/price-lists/route.ts")),
  },
  {
    id: "M4-5",
    name: "Totals calculation",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("M4-5", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "total")),
  },
  {
    id: "M4-6",
    name: "AI scope integration",
    category: "Web UI",
    files: ["src/components/features/ai-scope-modal.tsx"],
    check: () => checkTask("M4-6", () =>
      fileContains("src/components/features/ai-scope-modal.tsx", "lineItems") ||
      fileContains("src/components/features/ai-scope-modal.tsx", "save")),
  },
  {
    id: "M4-7",
    name: "Line item reordering",
    category: "Web UI",
    files: ["src/components/scope/line-items-table.tsx"],
    check: () => checkTask("M4-7", () =>
      fileExists("src/components/scope/line-items-table.tsx") &&
      fileContains("src/components/scope/line-items-table.tsx", "drag")),
  },
  {
    id: "M4-8",
    name: "Export with line items",
    category: "Export",
    files: ["src/app/api/estimates/[id]/export/route.ts"],
    check: () => checkTask("M4-8", () =>
      fileContains("src/app/api/estimates/[id]/export/route.ts", "lineItems")),
  },
];

// ============================================================================
// V2 MIGRATION SPRINT M5: Photos & Documentation
// ============================================================================
const migrationM5: TaskCheck[] = [
  {
    id: "M5-1",
    name: "Photo upload API",
    category: "API",
    files: ["src/app/api/photos/upload/route.ts"],
    check: () => checkTask("M5-1", () =>
      fileExists("src/app/api/photos/upload/route.ts") ||
      fileExists("src/app/api/photos/route.ts")),
  },
  {
    id: "M5-2",
    name: "Photo gallery component",
    category: "Web UI",
    files: ["src/components/photos/photo-gallery.tsx"],
    check: () => checkTask("M5-2", () =>
      fileExists("src/components/photos/photo-gallery.tsx") ||
      fileExists("src/components/property-viewer/PhotoGallery.tsx")),
  },
  {
    id: "M5-3",
    name: "Photo capture (mobile)",
    category: "Web UI",
    files: ["src/components/photos/photo-capture.tsx"],
    check: () => checkTask("M5-3", () =>
      fileExists("src/components/photos/photo-capture.tsx")),
  },
  {
    id: "M5-4",
    name: "Photo linking",
    category: "Web UI",
    files: ["src/components/photos/photo-form.tsx"],
    check: () => checkTask("M5-4", () =>
      fileExists("src/components/photos/photo-form.tsx") &&
      fileContains("src/components/photos/photo-form.tsx", "roomId")),
  },
  {
    id: "M5-5",
    name: "Photos tab on estimate",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("M5-5", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "Photos")),
  },
  {
    id: "M5-6",
    name: "Export with photos",
    category: "Export",
    files: ["src/app/api/estimates/[id]/export/route.ts"],
    check: () => checkTask("M5-6", () =>
      fileContains("src/app/api/estimates/[id]/export/route.ts", "photos")),
  },
];

// ============================================================================
// V2 MIGRATION SPRINT M6: SLA & Workflow
// ============================================================================
const migrationM6: TaskCheck[] = [
  {
    id: "M6-1",
    name: "Carrier configuration",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M6-1", () =>
      fileContains("src/lib/db/schema.ts", "carriers")),
  },
  {
    id: "M6-2",
    name: "SLA events tracking",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M6-2", () =>
      fileContains("src/lib/db/schema.ts", "slaEvents") ||
      fileContains("src/lib/db/schema.ts", "sla_events")),
  },
  {
    id: "M6-3",
    name: "SLA tab on estimate",
    category: "Web UI",
    files: ["src/app/dashboard/estimates/[id]/page.tsx"],
    check: () => checkTask("M6-3", () =>
      fileContains("src/app/dashboard/estimates/[id]/page.tsx", "SLA")),
  },
  {
    id: "M6-4",
    name: "Status workflow",
    category: "API",
    files: ["src/app/api/estimates/[id]/status/route.ts"],
    check: () => checkTask("M6-4", () =>
      fileExists("src/app/api/estimates/[id]/status/route.ts")),
  },
  {
    id: "M6-5",
    name: "SLA dashboard widget",
    category: "Web UI",
    files: ["src/components/dashboard/sla-widget.tsx"],
    check: () => checkTask("M6-5", () =>
      fileExists("src/components/dashboard/sla-widget.tsx")),
  },
  {
    id: "M6-6",
    name: "SLA badges",
    category: "Web UI",
    files: ["src/components/sla/sla-badge.tsx"],
    check: () => checkTask("M6-6", () =>
      fileExists("src/components/sla/sla-badge.tsx") ||
      fileExists("src/components/ui/sla-badge.tsx")),
  },
];

// ============================================================================
// V2 MIGRATION SPRINT M7: Portfolio & Analytics
// ============================================================================
const migrationM7: TaskCheck[] = [
  {
    id: "M7-1",
    name: "Portfolio page",
    category: "Web UI",
    files: ["src/app/dashboard/portfolio/page.tsx"],
    check: () => checkTask("M7-1", () =>
      fileExists("src/app/dashboard/portfolio/page.tsx") ||
      fileExists("src/app/(dashboard)/portfolio/page.tsx")),
  },
  {
    id: "M7-2",
    name: "Analytics page",
    category: "Web UI",
    files: ["src/app/dashboard/analytics/page.tsx"],
    check: () => checkTask("M7-2", () =>
      fileExists("src/app/dashboard/analytics/page.tsx") ||
      fileExists("src/app/(dashboard)/analytics/page.tsx")),
  },
  {
    id: "M7-3",
    name: "Team metrics",
    category: "Web UI",
    files: ["src/components/analytics/team-metrics.tsx"],
    check: () => checkTask("M7-3", () =>
      fileExists("src/components/analytics/team-metrics.tsx")),
  },
  {
    id: "M7-4",
    name: "Carrier breakdown",
    category: "Web UI",
    files: ["src/components/portfolio/carrier-breakdown.tsx"],
    check: () => checkTask("M7-4", () =>
      fileExists("src/components/portfolio/carrier-breakdown.tsx") ||
      fileExists("src/components/portfolio/CarrierBreakdown.tsx")),
  },
  {
    id: "M7-5",
    name: "Activity feed",
    category: "Web UI",
    files: ["src/components/portfolio/activity-feed.tsx"],
    check: () => checkTask("M7-5", () =>
      fileExists("src/components/portfolio/activity-feed.tsx") ||
      fileExists("src/components/portfolio/ActivityFeed.tsx")),
  },
  {
    id: "M7-6",
    name: "Export analytics",
    category: "Export",
    files: ["src/app/api/analytics/export/route.ts"],
    check: () => checkTask("M7-6", () =>
      fileExists("src/app/api/analytics/export/route.ts")),
  },
];

// ============================================================================
// V2 MIGRATION SPRINT M8: Vendor Portal
// ============================================================================
const migrationM8: TaskCheck[] = [
  {
    id: "M8-1",
    name: "Vendor data model",
    category: "Database",
    files: ["src/lib/db/schema.ts"],
    check: () => checkTask("M8-1", () =>
      fileContains("src/lib/db/schema.ts", "vendors")),
  },
  {
    id: "M8-2",
    name: "Vendor portal routes",
    category: "Web UI",
    files: ["src/app/vendor/page.tsx"],
    check: () => checkTask("M8-2", () =>
      fileExists("src/app/vendor/page.tsx")),
  },
  {
    id: "M8-3",
    name: "Token-based auth",
    category: "Auth",
    files: ["src/lib/auth/vendor.ts"],
    check: () => checkTask("M8-3", () =>
      fileExists("src/lib/auth/vendor.ts")),
  },
  {
    id: "M8-4",
    name: "Quote request flow",
    category: "API",
    files: ["src/app/api/quote-requests/route.ts"],
    check: () => checkTask("M8-4", () =>
      fileExists("src/app/api/quote-requests/route.ts")),
  },
  {
    id: "M8-5",
    name: "Vendor quote submission",
    category: "Web UI",
    files: ["src/app/vendor/quotes/[id]/page.tsx"],
    check: () => checkTask("M8-5", () =>
      fileExists("src/app/vendor/quotes/[id]/page.tsx")),
  },
  {
    id: "M8-6",
    name: "Quote comparison",
    category: "Web UI",
    files: ["src/components/quotes/quote-comparison.tsx"],
    check: () => checkTask("M8-6", () =>
      fileExists("src/components/quotes/quote-comparison.tsx")),
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
    // Original V3 Stages
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
    // V2 Migration Sprints
    {
      id: "M1",
      name: "Migration M1: Dashboard & Navigation",
      description: "Sidebar, welcome banner, stat cards, charts, map",
      color: "rose",
      tasks: evaluateWorkstream(migrationM1),
    },
    {
      id: "M2",
      name: "Migration M2: Database Schema",
      description: "Rooms, annotations, line items, photos, assignments tables",
      color: "amber",
      tasks: evaluateWorkstream(migrationM2),
    },
    {
      id: "M3",
      name: "Migration M3: Rooms & Sketch Editor",
      description: "Konva.js canvas, walls, doors, windows, fixtures",
      color: "emerald",
      tasks: evaluateWorkstream(migrationM3),
    },
    {
      id: "M4",
      name: "Migration M4: Line Items & Pricing",
      description: "Scope management, Xactimate codes, pricing",
      color: "sky",
      tasks: evaluateWorkstream(migrationM4),
    },
    {
      id: "M5",
      name: "Migration M5: Photos & Documentation",
      description: "Photo upload, gallery, capture, linking",
      color: "violet",
      tasks: evaluateWorkstream(migrationM5),
    },
    {
      id: "M6",
      name: "Migration M6: SLA & Workflow",
      description: "Carrier SLAs, milestone tracking, status workflow",
      color: "fuchsia",
      tasks: evaluateWorkstream(migrationM6),
    },
    {
      id: "M7",
      name: "Migration M7: Portfolio & Analytics",
      description: "Portfolio dashboard, analytics, team metrics",
      color: "lime",
      tasks: evaluateWorkstream(migrationM7),
    },
    {
      id: "M8",
      name: "Migration M8: Vendor Portal",
      description: "Vendor management, quotes, comparison",
      color: "teal",
      tasks: evaluateWorkstream(migrationM8),
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
