"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useBorrowRequests,
  useApproveBorrowRequestMutation,
  useRejectBorrowRequestMutation,
  useReleaseBorrowRequestMutation,
  useMarkUnreleasedBorrowRequestMutation,
  useMarkReturnedBorrowRequestMutation,
} from "@/features/borrow-requests/client/use-borrow-requests";
import type {
  BorrowRequest,
  TabFilter,
  BorrowRequestFilterState,
} from "@/types/borrow-requests";
import type { ReleaseBorrowRequestPayload } from "@/features/borrow-requests/client/borrow-requests-api";
import { BorrowRequestTabs } from "@/components/borrow-requests/borrow-request-tabs";
import { RequestFilters } from "@/components/borrow-requests/request-filters";
import { RequestList } from "@/components/borrow-requests/request-list";
import { RequestDetailPanel } from "@/components/borrow-requests/request-detail-panel";
import { ApproveRejectDialog } from "@/components/borrow-requests/approve-reject-dialog";
import { ReleaseDialog } from "@/components/borrow-requests/release-dialog";
import { ReturnDialog } from "@/components/borrow-requests/return-dialog";
import { SupplyRequestsQueue } from "@/components/consumable-requests/supply-requests-queue";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { OperatorReadOnlyBanner } from "@/components/shared/operator-read-only-banner";
import { useToast } from "@/components/providers/toast-context";
import { useAssetOperator } from "@/hooks/use-asset-operator";
import { useConsumableRequests } from "@/features/consumable-requests/client";
import { cn } from "@/lib/utils";

type RequestKind = "borrow" | "assign" | "supply";

function parseKind(raw: string | null): RequestKind {
  if (raw === "assign" || raw === "supply" || raw === "borrow") return raw;
  return "borrow";
}

function BorrowRequestsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestIdParam =
    searchParams.get("requestId") || searchParams.get("highlightId");
  const statusParam = searchParams.get("status") as TabFilter | null;
  const kind = parseKind(searchParams.get("kind"));

  const setKind = (next: RequestKind) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("kind", next);
    params.delete("requestId");
    params.delete("highlightId");
    router.replace(`/borrow-requests?${params.toString()}`);
  };

  const approveMutation = useApproveBorrowRequestMutation();
  const rejectMutation = useRejectBorrowRequestMutation();
  const releaseMutation = useReleaseBorrowRequestMutation();
  const markUnreleasedMutation = useMarkUnreleasedBorrowRequestMutation();
  const returnMutation = useMarkReturnedBorrowRequestMutation();
  const toast = useToast();
  const { canOperate } = useAssetOperator();

  const [activeTab, setActiveTab] = useState<TabFilter>(
    statusParam &&
      ["pending", "approved", "rejected", "released", "returned", "all"].includes(
        statusParam
      )
      ? statusParam
      : "pending"
  );
  const [highlightedId, setHighlightedId] = useState<string | null>(
    requestIdParam
  );

  // Filter & Pagination State
  const [filters, setFilters] = useState<
    BorrowRequestFilterState & { page: number }
  >({
    searchQuery: "",
    department: "All Departments",
    startDate: "",
    endDate: "",
    page: 1,
  });

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isPlaceholderData,
  } = useBorrowRequests({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: activeTab === "all" ? undefined : (activeTab as any),
    department:
      filters.department === "All Departments"
        ? undefined
        : filters.department,
    search: filters.searchQuery || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    page: filters.page,
    limit: 10,
    requestType: kind === "assign" ? "assignable" : "borrowable",
    enabled: kind !== "supply",
  });

  const { data: borrowPendingMeta } = useBorrowRequests({
    status: "pending",
    requestType: "borrowable",
    limit: 1,
  });
  const { data: assignPendingMeta } = useBorrowRequests({
    status: "pending",
    requestType: "assignable",
    limit: 1,
  });
  const { data: supplyPendingMeta } = useConsumableRequests({
    status: "pending",
    limit: 1,
  });

  const requests = useMemo(() => response?.data ?? [], [response?.data]);
  const meta = response?.meta;

  // Modal & Drawer State
  const [selectedRequest, setSelectedRequest] =
    useState<BorrowRequest | null>(null);
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

  const autoOpenedIdRef = useRef<string | null>(null);

  // Sync search params if query changes
  useEffect(() => {
    if (requestIdParam) {
      setHighlightedId(requestIdParam);
    }
    if (
      statusParam &&
      ["pending", "approved", "rejected", "released", "returned", "all"].includes(
        statusParam
      )
    ) {
      setActiveTab(statusParam);
    }
  }, [requestIdParam, statusParam]);

  // When requests load, auto-select matched request into drawer once if specified in URL
  useEffect(() => {
    if (
      requestIdParam &&
      requests.length > 0 &&
      autoOpenedIdRef.current !== requestIdParam
    ) {
      const match = requests.find((r) => r.id === requestIdParam);
      if (match) {
        autoOpenedIdRef.current = requestIdParam;
        setSelectedRequest(match);
      }
    }
  }, [requestIdParam, requests]);

  // Compute live tab counts across full dataset
  const pendingCount = meta?.counts?.pending || 0;
  const approvedCount = meta?.counts?.approved || 0;
  const rejectedCount = meta?.counts?.rejected || 0;
  const releasedCount = meta?.counts?.released || 0;
  const returnedCount = meta?.counts?.returned || 0;
  const totalCount = meta?.counts
    ? Object.values(meta.counts).reduce((a, b) => a + (b || 0), 0)
    : 0;

  const kindPending = {
    borrow: borrowPendingMeta?.meta.total ?? 0,
    assign: assignPendingMeta?.meta.total ?? 0,
    supply: supplyPendingMeta?.meta.total ?? 0,
  };

  // Handlers for state updates
  const handleFilterChange = (
    updated: Partial<BorrowRequestFilterState>
  ) => {
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
    try {
      if (mode === "approve") {
        await approveMutation.mutateAsync({ id: req.id });
        toast.success("Request approved successfully.");
      } else {
        await rejectMutation.mutateAsync({
          id: req.id,
          reason: reason || "Rejected by Custodian",
        });
        toast.success("Request rejected.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
      throw err;
    }

    // Keep drawer in sync if open
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  const handleOpenReleaseModal = (req: BorrowRequest) => {
    setReleaseDialogState({ request: req, isOpen: true });
  };

  const handleReleaseConfirm = async (
    req: BorrowRequest,
    payload: ReleaseBorrowRequestPayload
  ) => {
    try {
      await releaseMutation.mutateAsync({ id: req.id, payload });
      toast.success("Request released for pickup.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Release failed.");
      throw err;
    }
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  const handleMarkUnreleased = async (req: BorrowRequest) => {
    try {
      await markUnreleasedMutation.mutateAsync({ id: req.id });
      toast.success("Request marked as unreleased.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark as unreleased."
      );
      throw err;
    }
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  const handleOpenReturnModal = (req: BorrowRequest) => {
    setReturnDialogState({ request: req, isOpen: true });
  };

  const handleReturnConfirm = async (
    req: BorrowRequest,
    payload: { returnedBy: string; note?: string }
  ) => {
    try {
      await returnMutation.mutateAsync({ id: req.id, payload });
      toast.success("Item marked as returned.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Return failed.");
      throw err;
    }
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest(null);
    }
  };

  return (
    <div
      className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md"
      data-theme="light"
    >
      {/* ── Page Header Banner ────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0">
        <h1 className="text-xl font-bold tracking-tight text-text">
          Requests
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Review borrow, assignment, and supply requests in one queue.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(
            [
              ["borrow", "Borrow Requests"],
              ["assign", "Assign Requests"],
              ["supply", "Supply Requests"],
            ] as const
          ).map(([id, label]) => {
            const count = kindPending[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border",
                  kind === id
                    ? "bg-bg-subtle border-primary text-text"
                    : "border-border text-text-secondary hover:text-text"
                )}
              >
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold tabular-nums flex items-center justify-center",
                      kind === id
                        ? "bg-accent text-accent-foreground"
                        : "bg-status-repair-bg/20 text-text"
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!canOperate && <OperatorReadOnlyBanner />}

      {kind === "supply" ? (
        <SupplyRequestsQueue />
      ) : (
        <>
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

      {isError && (
        <QueryErrorBanner
          message={error?.message || "Failed to load borrow requests."}
          onRetry={() => void refetch()}
        />
      )}

      {/* ── Internal Scrollable Request List Region ────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg flex flex-col">
        <RequestList
          requests={requests}
          activeTab={activeTab}
          loading={isLoading && !isError}
          transitioning={isPlaceholderData}
          highlightedId={highlightedId}
          onSelect={(req) => {
            setHighlightedId(req.id);
            setSelectedRequest(req);
          }}
          onApprove={canOperate ? handleOpenApproveModal : undefined}
          onReject={canOperate ? handleOpenRejectModal : undefined}
          onRelease={canOperate ? handleOpenReleaseModal : undefined}
          onReturn={canOperate ? handleOpenReturnModal : undefined}
          onMarkUnreleased={canOperate ? handleMarkUnreleased : undefined}
        />

        {/* ── Pagination ────────────────────────────────────────────────── */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg shrink-0 mt-auto">
            <span className="text-sm text-text-secondary">
              Showing{" "}
              <span className="font-medium text-text">
                {Math.min(
                  (meta.page - 1) * meta.limit + 1,
                  meta.total
                )}
              </span>{" "}
              to{" "}
              <span className="font-medium text-text">
                {Math.min(meta.page * meta.limit, meta.total)}
              </span>{" "}
              of <span className="font-medium text-text">{meta.total}</span>{" "}
              results
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={meta.page <= 1}
                className="px-3 py-1.5 text-sm font-medium text-text bg-bg border border-border rounded-md hover:bg-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(meta.totalPages, prev.page + 1),
                  }))
                }
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
        onApprove={canOperate ? handleOpenApproveModal : undefined}
        onReject={canOperate ? handleOpenRejectModal : undefined}
        onRelease={canOperate ? handleOpenReleaseModal : undefined}
        onReturn={canOperate ? handleOpenReturnModal : undefined}
        onMarkUnreleased={canOperate ? handleMarkUnreleased : undefined}
      />

      {canOperate && (
      <>
      {/* ── Approve / Reject Confirmation Modal ───────────────────────── */}
      <ApproveRejectDialog
        request={dialogState.request}
        mode={dialogState.mode}
        isOpen={dialogState.isOpen}
        onClose={() =>
          setDialogState({ request: null, mode: null, isOpen: false })
        }
        onConfirm={handleConfirmAction}
      />

      {/* ── Release Confirmation Modal ────────────────────────────────── */}
      <ReleaseDialog
        request={releaseDialogState.request}
        isOpen={releaseDialogState.isOpen}
        onClose={() =>
          setReleaseDialogState({ request: null, isOpen: false })
        }
        onConfirm={handleReleaseConfirm}
      />

      {/* ── Return Confirmation Modal ─────────────────────────────────── */}
      <ReturnDialog
        request={returnDialogState.request}
        isOpen={returnDialogState.isOpen}
        onClose={() =>
          setReturnDialogState({ request: null, isOpen: false })
        }
        onConfirm={handleReturnConfirm}
      />
      </>
      )}
        </>
      )}
    </div>
  );
}

export default function BorrowRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center bg-bg-subtle p-8 text-sm text-text-secondary">
          Loading requests…
        </div>
      }
    >
      <BorrowRequestsContent />
    </Suspense>
  );
}
