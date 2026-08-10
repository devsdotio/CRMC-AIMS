"use client";

import { useState, useMemo, useEffect } from "react";
import { useBorrowRequests, useApproveBorrowRequestMutation,
  useRejectBorrowRequestMutation,
  useReleaseBorrowRequestMutation,
  useMarkUnreleasedBorrowRequestMutation,
  useMarkReturnedBorrowRequestMutation,
} from "@/features/borrow-requests/client/use-borrow-requests";
import type { BorrowRequest, TabFilter, BorrowRequestFilterState } from "@/types/borrow-requests";
import { BorrowRequestTabs } from "@/components/borrow-requests/borrow-request-tabs";
import { RequestFilters } from "@/components/borrow-requests/request-filters";
import { RequestList } from "@/components/borrow-requests/request-list";
import { RequestDetailPanel } from "@/components/borrow-requests/request-detail-panel";
import { ApproveRejectDialog } from "@/components/borrow-requests/approve-reject-dialog";
import { ReleaseDialog } from "@/components/borrow-requests/release-dialog";
import { ReturnDialog } from "@/components/borrow-requests/return-dialog";
export default function BorrowRequestsPage() {
  const approveMutation = useApproveBorrowRequestMutation();
  const rejectMutation = useRejectBorrowRequestMutation();
  const releaseMutation = useReleaseBorrowRequestMutation();
  const markUnreleasedMutation = useMarkUnreleasedBorrowRequestMutation();
  const returnMutation = useMarkReturnedBorrowRequestMutation();

  const [activeTab, setActiveTab] = useState<TabFilter>("pending");

  // Filter & Pagination State
  const [filters, setFilters] = useState<BorrowRequestFilterState & { page: number }>({
    searchQuery: "",
    department: "All Departments",
    startDate: "",
    endDate: "",
    page: 1,
  });

  const { data: response, isLoading } = useBorrowRequests({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: activeTab === "all" ? undefined : (activeTab as any),
    department: filters.department === "All Departments" ? undefined : filters.department,
    search: filters.searchQuery || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    page: filters.page,
    limit: 10,
  });

  const requests = response?.data ?? [];
  const meta = response?.meta;

  // Modal & Drawer State
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [dialogState, setDialogState] = useState<{
    request: BorrowRequest | null;
    mode: "approve" | "reject" | null;
    isOpen: boolean;
  }>({
    request: null,
    mode: null,
    isOpen: false,
  });

  const [releaseDialogState, setReleaseDialogState] = useState<{
    request: BorrowRequest | null;
    isOpen: boolean;
  }>({
    request: null,
    isOpen: false,
  });

  const [returnDialogState, setReturnDialogState] = useState<{
    request: BorrowRequest | null;
    isOpen: boolean;
  }>({
    request: null,
    isOpen: false,
  });

  // Compute live tab counts across full dataset
  const pendingCount = meta?.counts?.pending || 0;
  const approvedCount = meta?.counts?.approved || 0;
  const rejectedCount = meta?.counts?.rejected || 0;
  const releasedCount = meta?.counts?.released || 0;
  const returnedCount = meta?.counts?.returned || 0;
  const totalCount = meta?.counts?.undefined || 0; // undefined status means all

  // Handlers for state updates
  const handleFilterChange = (updated: Partial<BorrowRequestFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      department: "All Departments",
      startDate: "",
      endDate: "",
      page: 1,
    });
  };

  const handleTabChange = (tab: TabFilter) => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenApproveModal = (req: BorrowRequest) => {
    setDialogState({ request: req, mode: "approve", isOpen: true });
  };

  const handleOpenRejectModal = (req: BorrowRequest) => {
    setDialogState({ request: req, mode: "reject", isOpen: true });
  };

  const handleConfirmAction = async (
    req: BorrowRequest,
    mode: "approve" | "reject",
    reason?: string
  ) => {
    if (mode === "approve") {
      await approveMutation.mutateAsync({ id: req.id });
    } else {
      await rejectMutation.mutateAsync({ id: req.id, reason: reason || "Rejected by Custodian" });
    }

    // Keep drawer in sync if open
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  const handleOpenReleaseModal = (req: BorrowRequest) => {
    setReleaseDialogState({ request: req, isOpen: true });
  };

  const handleReleaseConfirm = async (req: BorrowRequest, payload: { pickedUpBy: string; note?: string }) => {
    await releaseMutation.mutateAsync({ id: req.id, payload });
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  const handleMarkUnreleased = async (req: BorrowRequest) => {
    await markUnreleasedMutation.mutateAsync({ id: req.id });
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  const handleOpenReturnModal = (req: BorrowRequest) => {
    setReturnDialogState({ request: req, isOpen: true });
  };

  const handleReturnConfirm = async (req: BorrowRequest, payload: { returnedBy: string; note?: string }) => {
    await returnMutation.mutateAsync({ id: req.id, payload });
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      {/* ── Page Header Banner ────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-text">
          Borrow Requests Queue
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Review, approve, or decline incoming property borrow requests submitted by hospital personnel.
        </p>
      </div>

      {/* ── Tabs Navigation Bar ───────────────────────────────────────── */}
      <BorrowRequestTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        rejectedCount={rejectedCount}
        releasedCount={releasedCount}
        returnedCount={returnedCount}
        totalCount={totalCount}
      />

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <RequestFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* ── Internal Scrollable Request List Region ────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg flex flex-col">
        <RequestList
          requests={requests}
          activeTab={activeTab}
          loading={isLoading}
          onSelect={setSelectedRequest}
          onApprove={handleOpenApproveModal}
          onReject={handleOpenRejectModal}
          onRelease={handleOpenReleaseModal}
          onReturn={handleOpenReturnModal}
          onMarkUnreleased={handleMarkUnreleased}
        />
        
        {/* ── Pagination ────────────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg shrink-0 mt-auto">
            <span className="text-sm text-text-secondary">
              Showing <span className="font-medium text-text">{Math.min((meta.page - 1) * meta.limit + 1, meta.total)}</span> to <span className="font-medium text-text">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-medium text-text">{meta.total}</span> results
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={meta.page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-text bg-bg border border-border rounded-md hover:bg-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(meta.totalPages, prev.page + 1) }))}
                disabled={meta.page >= meta.totalPages}
                className="px-3 py-1.5 text-sm font-medium text-text bg-bg border border-border rounded-md hover:bg-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Request Detail Slide-over Panel ───────────────────────────── */}
      <RequestDetailPanel
        request={selectedRequest}
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        onApprove={handleOpenApproveModal}
        onReject={handleOpenRejectModal}
        onRelease={handleOpenReleaseModal}
        onReturn={handleOpenReturnModal}
        onMarkUnreleased={handleMarkUnreleased}
      />

      {/* ── Approve / Reject Confirmation Modal ───────────────────────── */}
      <ApproveRejectDialog
        request={dialogState.request}
        mode={dialogState.mode}
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ request: null, mode: null, isOpen: false })}
        onConfirm={handleConfirmAction}
      />

      {/* ── Release Confirmation Modal ────────────────────────────────── */}
      <ReleaseDialog
        request={releaseDialogState.request}
        isOpen={releaseDialogState.isOpen}
        onClose={() => setReleaseDialogState({ request: null, isOpen: false })}
        onConfirm={handleReleaseConfirm}
      />

      {/* ── Return Confirmation Modal ─────────────────────────────────── */}
      <ReturnDialog
        request={returnDialogState.request}
        isOpen={returnDialogState.isOpen}
        onClose={() => setReturnDialogState({ request: null, isOpen: false })}
        onConfirm={handleReturnConfirm}
      />
    </div>
  );
}
