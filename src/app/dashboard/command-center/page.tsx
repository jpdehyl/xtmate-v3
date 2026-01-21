"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Task {
  id: string;
  name: string;
  status: "pending" | "completed";
  category?: string;
  files?: string[];
}

interface Workstream {
  id: string;
  name: string;
  description: string;
  color: string;
  tasks: Task[];
}

interface CategoryBreakdown {
  name: string;
  completed: number;
  total: number;
  percent: number;
  color: string;
}

interface Prompt {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  prompt: string;
  taskIds?: string[];
  agentRole?: string;
}

interface StatusData {
  workstreams: Workstream[];
  summary: {
    progress: number;
    completedTasks: number;
    totalTasks: number;
  };
  assessment: {
    verdict: string;
    progress: string;
  };
  categoryBreakdown: CategoryBreakdown[];
  timestamp: string;
}

const categoryColors: Record<string, string> = {
  Setup: "bg-slate-500",
  Auth: "bg-pink-500",
  Database: "bg-blue-500",
  API: "bg-green-500",
  "Web UI": "bg-purple-500",
  Export: "bg-cyan-500",
  AI: "bg-indigo-500",
  PWA: "bg-orange-500",
};

const stageColors: Record<string, string> = {
  S1: "border-slate-500",
  S2: "border-blue-500",
  S3: "border-cyan-500",
  S4: "border-purple-500",
  S5: "border-orange-500",
  S6: "border-green-500",
  CC: "border-indigo-500",
};

const agentIcons: Record<string, React.ReactNode> = {
  Shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Palette: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  TrendingUp: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  CheckSquare: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
};

const agentColors: Record<string, string> = {
  "agent-security": "border-red-500 bg-red-500/10",
  "agent-design": "border-pink-500 bg-pink-500/10",
  "agent-business": "border-emerald-500 bg-emerald-500/10",
  "agent-qa": "border-amber-500 bg-amber-500/10",
};

export default function CommandCenterPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["S1", "S2", "S3"]));
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [promptPreview, setPromptPreview] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<"stages" | "agents" | "prompts">("stages");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, promptsRes] = await Promise.all([
        fetch("/api/command-center/status"),
        fetch("/api/command-center/prompts"),
      ]);
      const statusData = await statusRes.json();
      const promptsData = await promptsRes.json();
      setData(statusData);
      setPrompts(promptsData.prompts || []);
    } catch (err) {
      console.error("Failed to fetch command center data:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyPrompt = async (promptId: string) => {
    const p = prompts.find((x) => x.id === promptId);
    if (!p) return;
    await navigator.clipboard.writeText(p.prompt);
    setCopied(promptId);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const progress = data?.summary?.progress || 0;
  const implementationPrompts = prompts.filter((p) => p.category === "implementation");
  const agentPrompts = prompts.filter((p) => p.category === "agent");
  const reviewPrompts = prompts.filter((p) => p.category === "review");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              &larr; Back to Dashboard
            </Link>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Command Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">XTmate V3 Development Progress &middot; RALPH Methodology</p>
        </div>

        {/* Status Bar */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm">XTmate V3</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-blue-400">
              {data?.summary?.completedTasks || 0} / {data?.summary?.totalTasks || 0} tasks
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-400">Docs: CLAUDE.md &rarr; PRD.md</span>
          </div>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              progress >= 70
                ? "bg-green-600"
                : progress >= 40
                ? "bg-blue-600"
                : "bg-amber-600"
            }`}
          >
            {data?.assessment?.verdict || "Loading..."}
          </span>
        </div>

        {/* Progress Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Progress by Category
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data?.categoryBreakdown?.map((cat) => (
              <div
                key={cat.name}
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${categoryColors[cat.name] || "bg-gray-500"}`}
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
                    {cat.completed}/{cat.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("stages")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "stages"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Stages & Progress
            </button>
            <button
              onClick={() => setActiveTab("agents")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "agents"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Sub-Agents ({agentPrompts.length})
            </button>
            <button
              onClick={() => setActiveTab("prompts")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "prompts"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Implementation Prompts ({implementationPrompts.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "stages" && (
          <>
            {/* Stage List */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.workstreams.map((ws) => {
                const done = ws.tasks.filter((t) => t.status === "completed").length;
                const total = ws.tasks.length;
                const complete = done === total && total > 0;
                const isOpen = expanded.has(ws.id);
                const phaseProgress = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <div key={ws.id} className={`border-l-4 ${stageColors[ws.id] || "border-gray-500"}`}>
                    <button
                      onClick={() => toggle(ws.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {complete ? (
                          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${complete ? "text-gray-400" : "text-gray-900 dark:text-white"}`}>
                              {ws.name}
                            </span>
                            <span className="text-sm text-gray-400">({done}/{total})</span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                phaseProgress === 100
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : phaseProgress >= 50
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {phaseProgress}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{ws.description}</p>
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 divide-y divide-gray-100 dark:divide-gray-800">
                        {ws.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="px-4 py-2 pl-12 flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              {task.status === "completed" ? (
                                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                </svg>
                              )}
                              <span className={task.status === "completed" ? "text-gray-400" : "text-gray-900 dark:text-white"}>
                                {task.name}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded font-mono">
                                {task.id}
                              </span>
                              {task.category && (
                                <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                  {task.category}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Stage prompt button */}
                        {implementationPrompts.find((p) => p.taskIds?.includes(ws.tasks[0]?.id)) && (
                          <div className="px-4 py-2 pl-12 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => {
                                const prompt = implementationPrompts.find((p) => p.taskIds?.includes(ws.tasks[0]?.id));
                                if (prompt) setPromptPreview(prompt);
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              View implementation prompt for this stage
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "agents" && (
          <>
            {/* Sub-Agents Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Sub-Agents</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Specialized review agents for different aspects of the project</p>
                  </div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentPrompts.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-4 rounded-lg border-2 ${agentColors[agent.id] || "border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          agent.id === "agent-security" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                          agent.id === "agent-design" ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400" :
                          agent.id === "agent-business" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                          "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        }`}>
                          {agentIcons[agent.icon]}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{agent.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{agent.agentRole}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{agent.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => setPromptPreview(agent)}
                        className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => copyPrompt(agent.id)}
                        className={`px-3 py-1.5 text-xs rounded-lg ${
                          copied === agent.id
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {copied === agent.id ? "Copied!" : "Copy Prompt"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Prompts */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Review Checklists</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {reviewPrompts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.description}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => setPromptPreview(p)}
                          className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => copyPrompt(p.id)}
                          className={`px-2 py-1 text-xs rounded ${
                            copied === p.id
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          {copied === p.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "prompts" && (
          <>
            {/* Implementation Prompts */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Implementation Prompts</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Copy a prompt to continue work on any stage</p>
                  </div>
                </div>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {implementationPrompts.map((p) => {
                  const relatedStage = data?.workstreams.find((ws) =>
                    p.taskIds?.some((tid) => ws.tasks.some((t) => t.id === tid))
                  );
                  const stageProgress = relatedStage
                    ? Math.round(
                        (relatedStage.tasks.filter((t) => t.status === "completed").length /
                          relatedStage.tasks.length) *
                          100
                      )
                    : 0;

                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                stageProgress === 100
                                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                  : stageProgress >= 50
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                  : stageProgress > 0
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                              }`}
                            >
                              {stageProgress === 100 ? "Complete" : stageProgress > 0 ? `${stageProgress}%` : "Not Started"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.description}</p>
                          {p.taskIds && (
                            <p className="text-xs text-gray-400 mt-2 font-mono">
                              Tasks: {p.taskIds.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setPromptPreview(p)}
                          className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => copyPrompt(p.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg ${
                            copied === p.id
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {copied === p.id ? "Copied!" : "Copy Prompt"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Methodology Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                RALPH Methodology
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                <strong>R</strong>equirements <strong>A</strong>nalysis for <strong>L</strong>LM-<strong>P</strong>owered <strong>H</strong>andoff
              </p>
              <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                <li><strong>Requirements Analysis</strong> - Read PRD, identify acceptance criteria</li>
                <li><strong>Architecture Review</strong> - Check patterns in CLAUDE.md</li>
                <li><strong>Implementation</strong> - Follow patterns, keep it simple</li>
                <li><strong>Progress Tracking</strong> - Update Command Center</li>
                <li><strong>Validation</strong> - Run checklist before marking complete</li>
              </ol>
            </div>
          </>
        )}

        {/* Timestamp */}
        {data?.timestamp && (
          <p className="text-xs text-gray-400 text-center">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </p>
        )}
      </main>

      {/* Prompt Preview Modal */}
      {promptPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{promptPreview.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{promptPreview.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyPrompt(promptPreview.id)}
                  className={`px-3 py-1.5 text-sm rounded ${
                    copied === promptPreview.id
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {copied === promptPreview.id ? "Copied!" : "Copy Prompt"}
                </button>
                <button
                  onClick={() => setPromptPreview(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {promptPreview.prompt}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
