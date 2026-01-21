/**
 * Build-time script to generate Command Center completion status
 *
 * This script runs file checks locally and outputs the results to a JSON file
 * that the API route can read at runtime (works on Vercel since it's pre-generated).
 *
 * Run: npx tsx scripts/generate-command-center-status.ts
 */

import * as fs from "fs";
import * as path from "path";

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

interface TaskDefinition {
  id: string;
  check: () => boolean;
}

// All task checks - add new tasks here as they're defined
const taskChecks: TaskDefinition[] = [
  // Stage 1: Foundation
  { id: "S1-1", check: () => fileExists("src/app/layout.tsx") && fileExists("next.config.ts") },
  { id: "S1-2", check: () => fileContains("src/middleware.ts", "clerkMiddleware") },
  { id: "S1-3", check: () => fileExists("src/lib/db/index.ts") && fileContains("src/lib/db/index.ts", "drizzle") },
  { id: "S1-4", check: () => fileHasMinLines("src/lib/db/schema.ts", 10) },
  { id: "S1-5", check: () => fileExists("src/app/dashboard/page.tsx") },
  { id: "S1-6", check: () => fileExists("tailwind.config.ts") },

  // Stage 2: Estimates CRUD
  { id: "S2-1", check: () => fileExists("src/app/api/estimates/route.ts") && fileContains("src/app/api/estimates/route.ts", "GET") },
  { id: "S2-2", check: () => fileExists("src/app/api/estimates/[id]/route.ts") && fileContains("src/app/api/estimates/[id]/route.ts", "PATCH") },
  { id: "S2-3", check: () => fileExists("src/app/dashboard/estimates/new/page.tsx") },
  { id: "S2-4", check: () => fileExists("src/app/dashboard/estimates/[id]/page.tsx") && fileHasMinLines("src/app/dashboard/estimates/[id]/estimate-detail-client.tsx", 100) },
  { id: "S2-5", check: () => fileContains("src/app/api/estimates/[id]/route.ts", "DELETE") },
  { id: "S2-6", check: () => fileContains("src/app/dashboard/estimates/[id]/estimate-detail-client.tsx", "onBlur") },

  // Stage 3: ESX Export
  { id: "S3-1", check: () => fileExists("src/app/api/estimates/[id]/export/route.ts") },
  { id: "S3-2", check: () => fileContains("src/app/api/estimates/[id]/export/route.ts", "jsPDF") },
  { id: "S3-3", check: () => fileContains("src/app/api/estimates/[id]/export/route.ts", "ExcelJS") },
  { id: "S3-4", check: () => fileContains("src/app/dashboard/estimates/[id]/estimate-detail-client.tsx", "handleExport") },

  // Stage 4: AI Scope
  { id: "S4-1", check: () => fileContains("package.json", "@anthropic-ai/sdk") },
  { id: "S4-2", check: () => fileExists("src/app/api/ai/suggest-scope/route.ts") },
  { id: "S4-3", check: () => fileExists("src/app/api/ai/enhance-description/route.ts") },
  { id: "S4-4", check: () => fileContains("src/app/dashboard/estimates/[id]/estimate-detail-client.tsx", "suggestScope") || fileContains("src/app/dashboard/estimates/[id]/estimate-detail-client.tsx", "AIScopeModal") },

  // Stage 5: Mobile Sync
  { id: "S5-1", check: () => fileExists("public/manifest.json") },
  { id: "S5-2", check: () => fileExists("public/sw.js") || fileContains("next.config.ts", "next-pwa") },
  { id: "S5-3", check: () => fileExists("src/components/offline-indicator.tsx") },
  { id: "S5-4", check: () => fileExists("src/lib/offline/storage.ts") },

  // Stage 6: Polish
  { id: "S6-1", check: () => fileContains("src/components/dashboard/estimate-table.tsx", "searchQuery") || fileContains("src/components/estimates-filters.tsx", "searchQuery") },
  { id: "S6-2", check: () => fileExists("src/app/api/estimates/[id]/duplicate/route.ts") },
  { id: "S6-3", check: () => fileExists("src/components/ui/skeleton.tsx") },
  { id: "S6-4", check: () => fileExists("src/components/ui/toast.tsx") || fileContains("package.json", "sonner") },

  // Command Center
  { id: "CC-1", check: () => fileExists("src/app/dashboard/command-center/page.tsx") },
  { id: "CC-2", check: () => fileExists("src/app/api/command-center/status/route.ts") },
  { id: "CC-3", check: () => fileExists("src/app/api/command-center/prompts/route.ts") },

  // Migration M1: Dashboard & Navigation
  { id: "M1-1", check: () => fileExists("src/components/dashboard/sidebar.tsx") && fileContains("src/components/dashboard/sidebar.tsx", "Dashboard") },
  { id: "M1-2", check: () => fileExists("src/components/dashboard/welcome-banner.tsx") },
  { id: "M1-3", check: () => fileExists("src/components/dashboard/stat-card.tsx") },
  { id: "M1-4", check: () => fileContains("package.json", "recharts") && (fileExists("src/components/dashboard/monthly-chart.tsx") || fileContains("src/components/dashboard/performance-metrics.tsx", "BarChart")) },
  { id: "M1-5", check: () => fileExists("src/components/dashboard/loss-types-chart.tsx") || fileContains("src/components/dashboard/performance-metrics.tsx", "PieChart") },
  { id: "M1-6", check: () => fileExists("src/components/dashboard/estimate-table.tsx") && fileContains("src/components/dashboard/estimate-table.tsx", "tab") },
  { id: "M1-7", check: () => fileExists("src/components/dashboard/projects-map.tsx") },
  { id: "M1-8", check: () => (fileContains("src/app/dashboard/page.tsx", "DashboardLayout") && fileContains("src/components/dashboard/dashboard-layout.tsx", "Sidebar")) || fileContains("src/app/dashboard/page.tsx", "Sidebar") },

  // Migration M2: Database Schema
  { id: "M2-1", check: () => fileContains("src/lib/db/schema.ts", "levels") && fileContains("src/lib/db/schema.ts", "pgTable") },
  { id: "M2-2", check: () => fileContains("src/lib/db/schema.ts", "rooms") && fileContains("src/lib/db/schema.ts", "squareFeet") },
  { id: "M2-3", check: () => fileContains("src/lib/db/schema.ts", "annotations") && fileContains("src/lib/db/schema.ts", "damageType") },
  { id: "M2-4", check: () => (fileContains("src/lib/db/schema.ts", "lineItems") || fileContains("src/lib/db/schema.ts", "line_items")) && fileContains("src/lib/db/schema.ts", "selector") },
  { id: "M2-5", check: () => fileContains("src/lib/db/schema.ts", "photos") && fileContains("src/lib/db/schema.ts", "photoType") },
  { id: "M2-6", check: () => fileContains("src/lib/db/schema.ts", "assignments") && fileContains("src/lib/db/schema.ts", "type") },

  // Migration M3: Rooms & Sketch Editor
  { id: "M3-1", check: () => fileExists("src/components/features/rooms-tab.tsx") && fileHasMinLines("src/components/features/rooms-tab.tsx", 50) },
  { id: "M3-2", check: () => fileExists("src/components/sketch-editor/SketchCanvas.tsx") && fileContains("src/components/sketch-editor/SketchCanvas.tsx", "react-konva") },
  { id: "M3-3", check: () => fileExists("src/components/sketch-editor/layers/WallsLayer.tsx") },
  { id: "M3-4", check: () => fileExists("src/components/sketch-editor/layers/DoorsLayer.tsx") },
  { id: "M3-5", check: () => fileExists("src/components/sketch-editor/layers/WindowsLayer.tsx") },
  { id: "M3-6", check: () => fileExists("src/components/sketch-editor/layers/FixturesLayer.tsx") },
  { id: "M3-7", check: () => fileExists("src/components/sketch-editor/layers/StaircasesLayer.tsx") },
  { id: "M3-8", check: () => fileExists("src/lib/geometry/room-detection.ts") && fileContains("src/lib/geometry/room-detection.ts", "detectRooms") },
  { id: "M3-9", check: () => fileExists("src/components/sketch-editor/Toolbar.tsx") },
  { id: "M3-10", check: () => fileExists("src/components/sketch-editor/LevelTabs.tsx") },

  // Migration M4: Line Items & Pricing
  { id: "M4-1", check: () => fileExists("src/app/api/estimates/[id]/line-items/route.ts") || fileExists("src/app/api/line-items/route.ts") },
  { id: "M4-2", check: () => fileExists("src/components/features/scope-tab.tsx") && fileHasMinLines("src/components/features/scope-tab.tsx", 50) },
  { id: "M4-3", check: () => fileExists("src/lib/reference/xactimate-categories.ts") },
  { id: "M4-4", check: () => fileExists("src/app/api/price-lists/route.ts") },
  { id: "M4-5", check: () => fileExists("src/components/features/totals-summary.tsx") },
  { id: "M4-6", check: () => fileExists("src/components/features/ai-scope-modal.tsx") && fileContains("src/components/features/ai-scope-modal.tsx", "onAcceptSuggestions") },
  { id: "M4-7", check: () => fileContains("src/components/features/scope-tab.tsx", "drag") },
  { id: "M4-8", check: () => fileContains("src/app/api/estimates/[id]/export/route.ts", "lineItems") },

  // Migration M5: Photos & Documentation
  { id: "M5-1", check: () => fileExists("src/app/api/photos/route.ts") },
  { id: "M5-2", check: () => fileExists("src/components/features/photo-gallery.tsx") && fileHasMinLines("src/components/features/photo-gallery.tsx", 50) },
  { id: "M5-3", check: () => fileContains("src/components/features/photo-upload.tsx", "capture") },
  { id: "M5-4", check: () => fileContains("src/components/features/photo-lightbox.tsx", "roomId") || fileContains("src/components/features/photo-upload.tsx", "roomId") },
  { id: "M5-5", check: () => fileExists("src/components/features/photos-tab.tsx") },
  { id: "M5-6", check: () => fileContains("src/app/api/estimates/[id]/export/route.ts", "photos") },

  // Migration M6: SLA & Workflow
  { id: "M6-1", check: () => fileContains("src/lib/db/schema.ts", "carriers") },
  { id: "M6-2", check: () => fileContains("src/lib/db/schema.ts", "slaEvents") || fileContains("src/lib/db/schema.ts", "sla_events") },
  { id: "M6-3", check: () => fileExists("src/components/features/sla-tab.tsx") && fileHasMinLines("src/components/features/sla-tab.tsx", 50) },
  { id: "M6-4", check: () => fileExists("src/app/api/sla-events/route.ts") || fileExists("src/app/api/estimates/[id]/status/route.ts") },
  { id: "M6-5", check: () => fileExists("src/components/features/sla-dashboard-widget.tsx") || fileExists("src/components/dashboard/sla-widget.tsx") },
  { id: "M6-6", check: () => fileExists("src/components/features/sla-badge.tsx") || fileExists("src/components/sla/sla-badge.tsx") || fileExists("src/components/ui/sla-badge.tsx") },

  // Migration M7: Portfolio & Analytics
  { id: "M7-1", check: () => fileExists("src/app/dashboard/portfolio/page.tsx") || fileExists("src/app/(dashboard)/portfolio/page.tsx") },
  { id: "M7-2", check: () => fileExists("src/app/dashboard/analytics/page.tsx") || fileExists("src/app/(dashboard)/analytics/page.tsx") },
  { id: "M7-3", check: () => fileExists("src/components/analytics/team-metrics.tsx") },
  { id: "M7-4", check: () => fileExists("src/components/portfolio/carrier-breakdown.tsx") || fileExists("src/components/portfolio/CarrierBreakdown.tsx") },
  { id: "M7-5", check: () => fileExists("src/components/portfolio/activity-feed.tsx") || fileExists("src/components/portfolio/ActivityFeed.tsx") },
  { id: "M7-6", check: () => fileExists("src/app/api/analytics/export/route.ts") },

  // Migration M8: Vendor Portal
  { id: "M8-1", check: () => fileContains("src/lib/db/schema.ts", "vendors") },
  { id: "M8-2", check: () => fileExists("src/app/vendor/page.tsx") },
  { id: "M8-3", check: () => fileExists("src/lib/auth/vendor.ts") },
  { id: "M8-4", check: () => fileExists("src/app/api/quote-requests/route.ts") },
  { id: "M8-5", check: () => fileExists("src/app/vendor/quotes/[id]/page.tsx") },
  { id: "M8-6", check: () => fileExists("src/components/quotes/quote-comparison.tsx") },
];

// Run all checks and build the result
function generateStatus(): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const task of taskChecks) {
    try {
      result[task.id] = task.check();
    } catch (error) {
      console.error(`Error checking task ${task.id}:`, error);
      result[task.id] = false;
    }
  }

  return result;
}

// Main execution
const status = generateStatus();
const outputPath = path.join(ROOT, "src/lib/generated/command-center-status.json");

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Write status file
fs.writeFileSync(outputPath, JSON.stringify(status, null, 2));

// Print summary
const completed = Object.values(status).filter(Boolean).length;
const total = Object.keys(status).length;
console.log(`✅ Command Center status generated: ${completed}/${total} tasks complete`);
console.log(`📄 Output: ${outputPath}`);
