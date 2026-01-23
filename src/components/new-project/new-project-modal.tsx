"use client";

import { useState, useEffect } from "react";
import { Zap, Mail, FileCode, Table, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuickCreateTab } from "./quick-create-tab";
import { FromEmailTab } from "./from-email-tab";
import { ImportESXTab } from "./import-esx-tab";
import { ImportCSVTab } from "./import-csv-tab";
import type { NewProjectModalProps, NewProjectTab } from "./types";

const TAB_CONFIG: Array<{ value: NewProjectTab; label: string; icon: typeof Zap; description: string }> = [
  { value: "quick", label: "Quick", icon: Zap, description: "Create with minimal info" },
  { value: "email", label: "Email", icon: Mail, description: "From Gmail inbox" },
  { value: "esx", label: "ESX", icon: FileCode, description: "Import Xactimate" },
  { value: "csv", label: "CSV", icon: Table, description: "Bulk import" },
];

export function NewProjectModal({ isOpen, onClose, defaultTab = "quick" }: NewProjectModalProps) {
  const [activeTab, setActiveTab] = useState<NewProjectTab>(defaultTab);

  // Reset to default tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      style={{ overscrollBehavior: "contain" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Project</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NewProjectTab)} defaultValue="quick">
            <TabsList className="w-full grid grid-cols-4 gap-1">
              {TAB_CONFIG.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs">
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NewProjectTab)} defaultValue="quick">
            <TabsContent value="quick" className="mt-0">
              <QuickCreateTab onClose={onClose} />
            </TabsContent>

            <TabsContent value="email" className="mt-0">
              <FromEmailTab onClose={onClose} />
            </TabsContent>

            <TabsContent value="esx" className="mt-0">
              <ImportESXTab onClose={onClose} />
            </TabsContent>

            <TabsContent value="csv" className="mt-0">
              <ImportCSVTab onClose={onClose} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
