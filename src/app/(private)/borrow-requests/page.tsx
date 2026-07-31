"use client";

import { useState, useMemo, useEffect } from "react";
import type { BorrowRequest, TabFilter, FilterState } from "@/components/borrow-requests/types";
import { INITIAL_MOCK_REQUESTS } from "@/components/borrow-requests/mock-data";
import { BorrowRequestTabs } from "@/components/borrow-requests/borrow-request-tabs";
import { RequestFilters } from "@/components/borrow-requests/request-filters";
import { RequestList } from "@/components/borrow-requests/request-list";
import { RequestDetailPanel } from "@/components/borrow-requests/request-detail-panel";
import { ApproveRejectDialog } from "@/components/borrow-requests/approve-reject-dialog";

export default function BorrowRequestsPage() {
  const [requests, setRequests] = useState<BorrowRequest[]>(INITIAL_MOCK_REQUESTS);
  const [activeTab, setActiveTab] = useState<TabFilter>("pending");
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    department: "All Departments",
    startDate: "",
    endDate: "",
  });

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

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Compute live tab counts across full dataset
  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );
  const approvedCount = useMemo(
    () => requests.filter((r) => r.status === "approved").length,
    [requests]
  );
  const rejectedCount = useMemo(
    () => requests.filter((r) => r.status === "rejected").length,
    [requests]
  );

  // Filter requests based on active tab + search + department + dates
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Tab Status Filter
      if (activeTab !== "all" && req.status !== activeTab) {
        return false;
      }

      // 2. Search Query Filter (Requester Name, Item Description, Request Code)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = req.requesterName.toLowerCase().includes(query);
        const matchItem = req.itemDescription.toLowerCase().includes(query);
        const matchCode = req.requestCode.toLowerCase().includes(query);
        if (!matchName && !matchItem && !matchCode) {
          return false;
        }
      }

      // 3. Department Filter
      if (
        filters.department &&
        filters.department !== "All Departments" &&
        req.department !== filters.department
      ) {
        return false;
      }

      // 4. Date Range Filter (Requested date)
      if (filters.startDate) {
        const reqDate = new Date(req.requestedAt).toISOString().split("T")[0];
        if (reqDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const reqDate = new Date(req.requestedAt).toISOString().split("T")[0];
        if (reqDate > filters.endDate) return false;
      }

      return true;
    });
  }, [requests, activeTab, filters]);

  // Handlers for state updates
  const handleFilterChange = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      department: "All Departments",
      startDate: "",
      endDate: "",
    });
  };

  const handleOpenApproveModal = (req: BorrowRequest) => {
    setDialogState({ request: req, mode: "approve", isOpen: true });
  };

  const handleOpenRejectModal = (req: BorrowRequest) => {
    setDialogState({ request: req, mode: "reject", isOpen: true });
  };

  const handleConfirmAction = (
    req: BorrowRequest,
    mode: "approve" | "reject",
    reason?: string
  ) => {
    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    setRequests((prev) =>
      prev.map((item) => {
        if (item.id !== req.id) return item;
        const newStatus = mode === "approve" ? "approved" : "rejected";
        return {
          ...item,
          status: newStatus,
          rejectionReason: mode === "reject" ? reason : item.rejectionReason,
          history: [
            ...item.history,
            {
              id: `h-${Date.now()}`,
              action: newStatus,
              actor: "Property Custodian",
              timestamp,
              note: mode === "reject" ? reason : "Approved by Custodian",
            },
          ],
        };
      })
    );

    // Keep drawer in sync if open
    if (selectedRequest && selectedRequest.id === req.id) {
      setSelectedRequest((prev) => (prev ? { ...prev, status: mode === "approve" ? "approved" : "rejected" } : null));
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
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
        rejectedCount={rejectedCount}
        totalCount={requests.length}
      />

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <RequestFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* ── Internal Scrollable Request List Region ────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        <RequestList
          requests={filteredRequests}
          activeTab={activeTab}
          loading={isLoading}
          onSelect={setSelectedRequest}
          onApprove={handleOpenApproveModal}
          onReject={handleOpenRejectModal}
        />
      </main>

      {/* ── Request Detail Slide-over Panel ───────────────────────────── */}
      <RequestDetailPanel
        request={selectedRequest}
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        onApprove={handleOpenApproveModal}
        onReject={handleOpenRejectModal}
      />

      {/* ── Approve / Reject Confirmation Modal ───────────────────────── */}
      <ApproveRejectDialog
        request={dialogState.request}
        mode={dialogState.mode}
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ request: null, mode: null, isOpen: false })}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
