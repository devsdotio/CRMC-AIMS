"use client";

import { Box, ClipboardList, AlertCircle, TrendingUp } from "lucide-react";

import { StatCardsGrid, type StatCardProps } from "@/components/dashboard/stat-card";
import { PendingApprovalsWidget } from "@/components/dashboard/pending-approvals-widget";
import { OverdueAssetsWidget } from "@/components/dashboard/overdue-assets-widget";
import { LowStockWidget } from "@/components/dashboard/low-stock-widget";
import { AssetsByCategoryChart } from "@/components/dashboard/assets-by-category-chart";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";

import { useDashboardSnapshotQuery } from "@/features/dashboard/client/use-dashboard";
import {
  useApproveBorrowRequestMutation,
  useRejectBorrowRequestMutation,
} from "@/features/borrow-requests/client/use-borrow-requests";

export default function DashboardPage() {
  const { data: snapshot, isLoading } = useDashboardSnapshotQuery();
  const approveMutation = useApproveBorrowRequestMutation();
  const rejectMutation = useRejectBorrowRequestMutation();

  if (isLoading || !snapshot) {
    return <div className="p-8 text-center text-text-secondary">Loading dashboard...</div>;
  }

  const stats: StatCardProps[] = [
    {
      label: "Active Borrows",
      value: snapshot.summary.activeBorrows,
      contextLine: "Currently borrowed items",
      icon: Box,
      variant: "default",
    },
    {
      label: "Pending Approvals",
      value: snapshot.summary.pendingApprovals,
      contextLine: "Requires immediate attention",
      icon: ClipboardList,
      variant: "default",
    },
    {
      label: "Overdue Returns",
      value: snapshot.summary.overdueAssets,
      contextLine: "Past due date",
      icon: AlertCircle,
      variant: "danger",
    },
    {
      label: "Low Stock Items",
      value: snapshot.summary.lowStockItems,
      contextLine: "Needs reordering",
      icon: AlertCircle,
      variant: "warning",
    },
  ];

  return (
    <div className="flex flex-col gap-6 bg-bg-subtle max-w-full overflow-x-hidden" data-theme="light">
      {/* ── Row 1: KPI stat cards ─────────────────────────────────── */}
      <StatCardsGrid stats={stats} />

      {/* ── Row 2: Pending Approvals + Low Stock ─────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <PendingApprovalsWidget
          requests={snapshot.pendingRequests}
          onApprove={(id) => approveMutation.mutate({ id })}
          onReject={(id) => rejectMutation.mutate({ id, reason: "Rejected from dashboard" })}
        />
        <LowStockWidget items={snapshot.lowStockItems} />
      </div>

      {/* ── Row 3: Overdue Assets + Category Chart ────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <OverdueAssetsWidget
          assets={snapshot.overdueAssets}
          onSendReminder={(id) => console.log("Remind", id)} // Feature not yet implemented
        />
        <AssetsByCategoryChart data={snapshot.categoryDistribution as any} />
      </div>

      {/* ── Row 4: Recent Activity Feed (full width) ─────────────── */}
      <RecentActivityFeed entries={snapshot.recentActivity} />
    </div>
  );
}
