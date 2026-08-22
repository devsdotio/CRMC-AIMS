"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, ClipboardCheck, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { MyRequestItem, MyRequestItemSkeleton } from "./my-request-item";
import { CancelRequestDialog } from "./cancel-request-dialog";
import { RequestDetailSheet } from "./request-detail-sheet";
import { EditRequestDialog } from "./edit-request-dialog";
import type { PortalBorrowRequest, RequestStatusFilter } from "./types";
import { useAssetOperator } from "@/hooks/use-asset-operator";

import { useBorrowRequests, useCancelBorrowRequestMutation } from "@/features/borrow-requests/client/use-borrow-requests";
import { useConsumableRequests, useCancelConsumableRequestMutation } from "@/features/consumable-requests/client";
import { useToast } from "@/components/providers/toast-context";

const STATUS_FILTERS: {
  key: RequestStatusFilter;
  label: string;
  dot: string;
  badge: string;
  activeBadge: string;
}[] = [
  {
    key: "all",
    label: "All Requests",
    dot: "bg-text-secondary/70",
    badge: "bg-bg-subtle text-text-secondary border border-border",
    activeBadge: "bg-bg-subtle text-text font-bold border border-border/80",
  },
  {
    key: "pending",
    label: "Pending",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    activeBadge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30",
  },
  {
    key: "approved",
    label: "Approved",
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    activeBadge: "bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30",
  },
  {
    key: "returned",
    label: "Issued / Completed",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    activeBadge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30",
  },
  {
    key: "rejected",
    label: "Rejected",
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border border-destructive/20",
    activeBadge: "bg-destructive/20 text-destructive font-bold border border-destructive/30",
  },
];

const REQUESTS_PAGE_SIZE = 10;

export function MyRequestsTab() {
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [cancelTarget, setCancelTarget] = useState<PortalBorrowRequest | null>(null);
  const [editTarget, setEditTarget] = useState<PortalBorrowRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PortalBorrowRequest | null>(null);
  const [page, setPage] = useState(1);
  const { canOperate } = useAssetOperator();

  const { data: response, isLoading: loadingAssets } = useBorrowRequests();
  const { data: supplyResponse, isLoading: loadingSupplies } = useConsumableRequests();
  const assetRequests = useMemo(() => response?.data ?? [], [response?.data]);
  const supplyRequests = useMemo(
    () => supplyResponse?.data ?? [],
    [supplyResponse?.data]
  );
  const loading = loadingAssets || loadingSupplies;
  const { mutateAsync: cancelRequest } = useCancelBorrowRequestMutation();
  const { mutateAsync: cancelSupply } = useCancelConsumableRequestMutation();
  const toast = useToast();

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  const requests = useMemo<PortalBorrowRequest[]>(() => {
    const mappedAssets: PortalBorrowRequest[] = assetRequests.map((row) => ({
      ...row,
      requestedDateFrom: row.requestedAt.slice(0, 10),
      requestedDateTo: (row.expectedReturnDate ?? row.requestedAt).slice(0, 10),
    }));
    const mappedSupplies: PortalBorrowRequest[] = supplyRequests.map((row) => ({
      id: row.id,
      requestCode: row.requestCode,
      requesterName: row.requesterName,
      requesterEmail: row.requesterEmail,
      requesterPhone: row.requesterPhone,
      department: row.department,
      items: row.lines.map((line) => ({
        itemDescription: line.itemName,
        consumableId: line.consumableId,
        category: line.category,
        quantity: line.quantityRequested,
        itemType: "consumable" as const,
      })),
      purpose: row.purpose,
      requestedAt: row.requestedAt,
      expectedReturnDate: null,
      status:
        row.status === "released"
          ? "released"
          : row.status === "cancelled"
            ? "cancelled"
            : row.status,
      notes: row.notes,
      rejectionReason: row.rejectionReason,
      history: row.history.map((h) => ({
        id: h.id,
        action: h.action as PortalBorrowRequest["history"][number]["action"],
        actor: h.actor,
        timestamp: h.timestamp,
        note: h.note,
      })),
      requestedDateFrom: row.requestedAt.slice(0, 10),
      requestedDateTo: row.requestedAt.slice(0, 10),
    }));
    return [...mappedSupplies, ...mappedAssets].sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt)
    );
  }, [assetRequests, supplyRequests]);

  const handleCancelConfirmed = async (requestId: string) => {
    const target = requests.find((r) => r.id === requestId);
    const isSupply = Boolean(
      target?.items.every((i) => i.itemType === "consumable")
    );
    try {
      if (isSupply) {
        await cancelSupply({ id: requestId, note: "Cancelled by department" });
      } else {
        await cancelRequest({ id: requestId, note: "Cancelled by borrower" });
      }
      toast.success("Request cancelled.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel request."
      );
    }
  };

  const matchesFilter = (r: PortalBorrowRequest, key: RequestStatusFilter) => {
    if (key === "all") return true;
    if (key === "returned") {
      return r.status === "returned" || r.status === "released";
    }
    return r.status === key;
  };

  const filtered = useMemo(() => {
    return requests
      .filter((r) => matchesFilter(r, statusFilter))
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const code = (r.requestCode || "").toLowerCase();
        const purpose = (r.purpose || "").toLowerCase();
        const items = r.items?.map((it) => it.itemDescription.toLowerCase()).join(" ") || "";
        return code.includes(q) || purpose.includes(q) || items.includes(q);
      });
  }, [requests, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / REQUESTS_PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * REQUESTS_PAGE_SIZE;
    return filtered.slice(start, start + REQUESTS_PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-bg shadow-xs flex flex-col min-h-0">
      {/* Toolbar: Segmented Tabs on Left, Search on Right */}
      <div className="px-4 md:px-6 py-3 bg-bg border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider shrink-0">
            Status:
          </span>
          <div className="flex gap-1 rounded-xl border border-border p-1 bg-bg-subtle shrink-0 overflow-x-auto scrollbar-none relative">
            {STATUS_FILTERS.map((f) => {
              const count =
                f.key === "all"
                  ? requests.length
                  : requests.filter((r) => matchesFilter(r, f.key)).length;

              const isSelected = statusFilter === f.key;

              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 cursor-pointer whitespace-nowrap select-none",
                    isSelected
                      ? "text-text"
                      : "text-text-secondary hover:text-text"
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="borrower-my-requests-active-tab"
                      className="absolute inset-0 rounded-lg bg-bg shadow-xs border border-border/80"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full relative z-10 shrink-0", f.dot)}
                    aria-hidden="true"
                  />
                  <span className="relative z-10">{f.label}</span>
                  <span
                    className={cn(
                      "relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold transition-colors duration-150",
                      isSelected ? f.activeBadge : f.badge
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 min-w-48 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search request code, item, or purpose…"
            className={cn(
              "w-full h-9 pl-8.5 pr-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60",
              "focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
            )}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-bg divide-y divide-border">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <MyRequestItemSkeleton key={i} />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border shadow-xs mb-3",
                statusFilter === "pending"
                  ? "bg-status-active-bg/15 border-status-active-bg/30 text-status-active-text"
                  : statusFilter === "approved"
                    ? "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400"
                    : "bg-bg-subtle border-border text-text-secondary"
              )}
            >
              {statusFilter === "pending" ? (
                <ClipboardCheck className="h-7 w-7" strokeWidth={2} />
              ) : (
                <Inbox className="h-7 w-7" strokeWidth={1.8} />
              )}
            </span>
            <h3 className="text-base font-bold text-text">
              {statusFilter === "all"
                ? "No requests found"
                : `No ${STATUS_FILTERS.find((f) => f.key === statusFilter)?.label.toLowerCase()} requests`}
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">
              {statusFilter === "all"
                ? "You haven't submitted any borrow or consumable requisition requests yet."
                : "No requests match the selected status filter."}
            </p>
          </div>
        ) : (
          paginatedRequests.map((request) => (
            <MyRequestItem
              key={request.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              request={request as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onViewDetails={(r) => setSelectedRequest(r as any)}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onCancel={(r) => setCancelTarget(r as any)}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onEdit={canOperate ? (r) => setEditTarget(r as any) : undefined}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-bg shrink-0">
          <p className="text-xs text-text-secondary">
            Page <span className="font-semibold text-text">{page}</span> of{" "}
            <span className="font-semibold text-text">{totalPages}</span> (
            {filtered.length} total request{filtered.length !== 1 ? "s" : ""})
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <CancelRequestDialog
          request={cancelTarget}
          open={Boolean(cancelTarget)}
          onOpenChange={(open) => {
            if (!open) setCancelTarget(null);
          }}
          onConfirm={async () => {
            await handleCancelConfirmed(cancelTarget.id);
            setCancelTarget(null);
          }}
        />
      )}

      {/* Edit Request Dialog */}
      {editTarget && (
        <EditRequestDialog
          request={editTarget}
          open={Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          onSuccess={() => {
            setEditTarget(null);
            setSelectedRequest(null);
          }}
        />
      )}

      {/* Request Detail Sheet */}
      {selectedRequest && (
        <RequestDetailSheet
          request={selectedRequest}
          open={Boolean(selectedRequest)}
          onOpenChange={(open) => {
            if (!open) setSelectedRequest(null);
          }}
          onCancel={(req) => {
            setSelectedRequest(null);
            setCancelTarget(req);
          }}
          onEdit={
            canOperate
              ? (req) => {
                  setSelectedRequest(null);
                  setEditTarget(req);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
