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

  const loading = isLoading || !snapshot;

  const stats: StatCardProps[] = [
    {
      label: "Active Borrows",
      value: snapshot?.summary.activeBorrows ?? null,
      contextLine: "Currently borrowed items",
      icon: Box,
      variant: "default",
      loading,
    },
    {
      label: "Pending Approvals",
      value: snapshot?.summary.pendingApprovals ?? null,
      contextLine: "Requires immediate attention",
      icon: ClipboardList,
      variant: "default",
      loading,
    },
    {
      label: "Overdue Returns",
      value: snapshot?.summary.overdueAssets ?? null,
      contextLine: "Past due date",
      icon: AlertCircle,
      variant: "danger",
      loading,
    },
    {
      label: "Low Stock Items",
      value: snapshot?.summary.lowStockItems ?? null,
      contextLine: "Needs reordering",
      icon: AlertCircle,
      variant: "warning",
      loading,
    },
  ];

  return (
    <div className="flex flex-col gap-4 bg-bg-subtle max-w-full overflow-x-hidden" data-theme="light">
      {/* ── Row 1: KPI stat cards ─────────────────────────────────── */}
      <StatCardsGrid stats={stats} />

      {/* ── Row 2: Pending Approvals + Low Stock ─────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <PendingApprovalsWidget
          requests={snapshot?.pendingRequests || []}
          loading={loading}
          onApprove={(id) => approveMutation.mutate({ id })}
          onReject={(id) => rejectMutation.mutate({ id, reason: "Rejected from dashboard" })}
        />
        <LowStockWidget items={snapshot?.lowStockItems || []} loading={loading} />
      </div>

      {/* ── Row 3: Overdue Assets + Category Chart ────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <OverdueAssetsWidget
          assets={snapshot?.overdueAssets || []}
          loading={loading}
          onSendReminder={(id) => console.log("Remind", id)} // Feature not yet implemented
        />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <AssetsByCategoryChart data={snapshot?.categoryDistribution as any || []} loading={loading} />
      </div>

      {/* ── Row 4: Recent Activity Feed (full width) ─────────────── */}
      <RecentActivityFeed entries={snapshot?.recentActivity || []} loading={loading} />
    </div>
  );
}
