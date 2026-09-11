"use client";

import { Box, ClipboardList, AlertCircle, Building2 } from "lucide-react";

import { StatCardsGrid, type StatCardProps } from "@/components/dashboard/stat-card";
import { PendingApprovalsWidget } from "@/components/dashboard/pending-approvals-widget";
import { OverdueAssetsWidget } from "@/components/dashboard/overdue-assets-widget";
import { LowStockWidget } from "@/components/dashboard/low-stock-widget";
import { AssetsByCategoryChart } from "@/components/dashboard/assets-by-category-chart";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";

import { useDashboardSnapshotQuery } from "@/features/dashboard/client/use-dashboard";

export default function DashboardPage() {
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboardSnapshotQuery();

  // Only true while the first fetch is in flight — never `!snapshot` after error.
  const loading = isLoading && !snapshot;

  const stats: StatCardProps[] = [
    {
      label: "Active Borrows",
      value: snapshot?.summary.activeBorrows ?? null,
      contextLine: "Borrowable units on loan",
      icon: Box,
      variant: "default",
      loading,
      href: "/borrow-log?custody=borrow&filter=active",
    },
    {
      label: "Active Assignments",
      value: snapshot?.summary.activeAssignments ?? null,
      contextLine: "Assignable units in custody",
      icon: Building2,
      variant: "default",
      loading,
      href: "/borrow-log?custody=assignment&filter=active",
    },
    {
      label: "Pending Approvals",
      value: snapshot?.summary.pendingApprovals ?? null,
      contextLine: "Requires staff attention",
      icon: ClipboardList,
      variant: "default",
      loading,
      href: "/borrow-requests?status=pending",
    },
    {
      label: "Overdue Returns",
      value: snapshot?.summary.overdueAssets ?? null,
      contextLine: "Past due date (Borrowable)",
      icon: AlertCircle,
      variant: "danger",
      loading,
      href: "/borrow-log?filter=overdue",
    },
    {
      label: "Low Stock Items",
      value: snapshot?.summary.lowStockItems ?? null,
      contextLine: "Consumables needing restock",
      icon: AlertCircle,
      variant: "warning",
      loading,
      href: "/consumables",
    },
  ];

  return (
    <div
      className="flex flex-col gap-4 bg-bg-subtle max-w-full overflow-x-hidden"
      data-theme="light"
    >

      <StatCardsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PendingApprovalsWidget
          requests={snapshot?.pendingRequests || []}
          loading={loading}
        />
        <LowStockWidget
          items={snapshot?.lowStockItems || []}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OverdueAssetsWidget
          assets={snapshot?.overdueAssets || []}
          loading={loading}
        />
        <AssetsByCategoryChart
          data={snapshot?.categoryDistribution ?? []}
          loading={loading}
        />
      </div>

      <RecentActivityFeed
        entries={snapshot?.recentActivity || []}
        loading={loading}
      />
    </div>
  );
}
