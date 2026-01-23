"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { EstimateTable } from "@/components/dashboard/estimate-table";
import { Button } from "@/components/ui/button";

interface TableData {
  id: string;
  name: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  status: string | null;
  updatedAt: Date | null;
  createdAt: Date | null;
  jobType: string | null;
  projectType?: string | null;
  projectNumber?: string | null;
  claimNumber?: string | null;
  policyNumber?: string | null;
  insuredName?: string | null;
  total?: number | null;
}

interface EstimatesPageContentProps {
  estimates: TableData[];
}

export function EstimatesPageContent({ estimates }: EstimatesPageContentProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all your restoration estimates and projects
          </p>
        </div>
        <Button asChild className="btn-gold">
          <Link href="/dashboard/estimates/new">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Estimates Table */}
      <EstimateTable estimates={estimates} />
    </div>
  );
}
