"use client";

import { Box, ClipboardList, AlertCircle } from "lucide-react";

import { StatCardsGrid, type StatCardProps } from "@/components/dashboard/stat-card";
import { PendingApprovalsWidget } from "@/components/dashboard/pending-approvals-widget";
import { OverdueAssetsWidget } from "@/components/dashboard/overdue-assets-widget";
import { LowStockWidget } from "@/components/dashboard/low-stock-widget";
import { AssetsByCategoryChart } from "@/components/dashboard/assets-by-category-chart";
import { RecentActivityFeed } from "@/components/dashboard/recent-activity-feed";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";

import { useDashboardSnapshotQuery } from "@/features/dashboard/client/use-dashboard";
import {
  useApproveBorrowRequestMutation,
  useRejectBorrowRequestMutation,
} from "@/features/borrow-requests/client/use-borrow-requests";
import { useToast } from "@/components/providers/toast-context";

export default function DashboardPage() {
  const {
    data: snapshot,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboardSnapshotQuery();
  const approveMutation = useApproveBorrowRequestMutation();
  const rejectMutation = useRejectBorrowRequestMutation();
  const toast = useToast();

  // Only true while the first fetch is in flight — never `!snapshot` after error.
  const loading = isLoading && !snapshot;

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
    <div
      className="flex flex-col gap-4 bg-bg-subtle max-w-full overflow-x-hidden"
      data-theme="light"
    >
      {isError && (
        <QueryErrorBanner
          message={
            error?.message ||
            "Failed to load dashboard. The database may be slow or unreachable."
          }
          onRetry={() => void refetch()}
        />
      )}

      <StatCardsGrid stats={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <PendingApprovalsWidget
          requests={snapshot?.pendingRequests || []}
          loading={loading}
          onApprove={(id) =>
            approveMutation.mutate({ id }, {
              onSuccess: () => toast.success("Request approved."),
              onError: (err) => toast.error(err.message || "Approve failed."),
            })
          }
          onReject={(id) =>
            rejectMutation.mutate({ id, reason: "Rejected from dashboard" }, {
              onSuccess: () => toast.success("Request rejected."),
              onError: (err) => toast.error(err.message || "Reject failed."),
            })
          }
        />
        <LowStockWidget
          items={snapshot?.lowStockItems || []}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <OverdueAssetsWidget
          assets={snapshot?.overdueAssets || []}
          loading={loading}
          onSendReminder={(id) => console.log("Remind", id)}
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
