"use client";

import { StatCardsGrid } from "@/components/dashboard/stat-card";
import { PendingApprovalsWidget } from "@/components/dashboard/pending-approvals-widget";
import { OverdueAssetsWidget } from "@/components/dashboard/overdue-assets-widget";
import { LowStockWidget } from "@/components/dashboard/low-stock-widget";
import { AssetsByCategoryChart } from "@/components/dashboard/assets-by-category-chart";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";

import {
  MOCK_STAT_CARDS,
  MOCK_PENDING_REQUESTS,
  MOCK_OVERDUE_ASSETS,
  MOCK_LOW_STOCK,
  MOCK_CATEGORY_DATA,
  MOCK_ACTIVITY,
} from "@/features/dashboard/mock-data";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 bg-bg-subtle max-w-full overflow-x-hidden" data-theme="light">
      {/* ── Row 1: KPI stat cards ─────────────────────────────────── */}
      <StatCardsGrid stats={MOCK_STAT_CARDS} />

      {/* ── Row 2: Pending Approvals + Low Stock ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <PendingApprovalsWidget
          requests={MOCK_PENDING_REQUESTS}
          onApprove={(id) => console.log("Approve", id)}
          onReject={(id) => console.log("Reject", id)}
        />
        <LowStockWidget items={MOCK_LOW_STOCK} />
      </div>

      {/* ── Row 3: Overdue Assets + Category Chart ────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <OverdueAssetsWidget
          assets={MOCK_OVERDUE_ASSETS}
          onSendReminder={(id) => console.log("Remind", id)}
        />
        <AssetsByCategoryChart data={MOCK_CATEGORY_DATA} />
      </div>

      {/* ── Row 4: Recent Activity Feed (full width) ─────────────── */}
      <RecentActivityFeed entries={MOCK_ACTIVITY} />

    </div>
  );
}
