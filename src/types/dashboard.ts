export type DashboardSummary = {
  activeBorrows: number;
  activeAssignments: number;
  pendingApprovals?: number;
  overdueAssets: number;
  lowStockItems: number;
  totalRequests?: number;
  totalAssignable?: number;
  totalBorrowable?: number;
};
