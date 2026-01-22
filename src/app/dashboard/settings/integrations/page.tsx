"use client";

import { Suspense } from "react";
import { IntegrationsContent } from "./integrations-content";

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
