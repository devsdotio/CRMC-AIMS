"use client";

import { MyRequestsTab } from "@/components/borrower-db/my-requests-tab";

export default function RequestsPage() {
  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle gap-3">
      {/* Header Banner */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">My Requests</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Track and monitor the status of your borrow and supply requisition requests.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <MyRequestsTab />
      </div>
    </div>
  );
}
