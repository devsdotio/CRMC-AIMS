"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowUpFromLine } from "lucide-react";
import type { BorrowLogRecord, LogTabFilter, BorrowLogFilterState, ReturnCondition } from "@/types/borrow-log";
import { INITIAL_MOCK_LOGS } from "@/components/borrow-log/mock-data";
import { BorrowLogTabs } from "@/components/borrow-log/borrow-log-tabs";
import { BorrowLogFilters } from "@/components/borrow-log/borrow-log-filters";
import { BorrowLogList } from "@/components/borrow-log/borrow-log-list";
import { BorrowLogDetailPanel } from "@/components/borrow-log/borrow-log-detail-panel";
import { ReleaseAssetDialog } from "@/components/borrow-log/release-asset-dialog";
import { ReturnAssetDialog } from "@/components/borrow-log/return-asset-dialog";

export default function BorrowLogPage() {
  const [records, setRecords] = useState<BorrowLogRecord[]>(INITIAL_MOCK_LOGS);
  const [activeTab, setActiveTab] = useState<LogTabFilter>("active");
  const [isLoading, setIsLoading] = useState(true);

  // Filter State
  const [filters, setFilters] = useState<BorrowLogFilterState>({
    searchQuery: "",
    department: "All Departments",
    startDate: "",
    endDate: "",
  });

  // Modal / Drawer States
  const [selectedRecord, setSelectedRecord] = useState<BorrowLogRecord | null>(null);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false);
  const [returnDialogRecord, setReturnDialogRecord] = useState<BorrowLogRecord | null>(null);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Compute live tab counts
  const activeCount = useMemo(
    () => records.filter((r) => r.status === "active").length,
    [records]
  );
  const overdueCount = useMemo(
    () => records.filter((r) => r.status === "overdue").length,
    [records]
  );
  const returnedCount = useMemo(
    () => records.filter((r) => r.status === "returned").length,
    [records]
  );

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Tab Filter
      if (activeTab !== "all" && rec.status !== activeTab) {
        return false;
      }

      // 2. Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchBorrower = rec.borrowerName.toLowerCase().includes(query);
        const matchAsset = rec.assetName.toLowerCase().includes(query);
        const matchAssetCode = rec.assetCode.toLowerCase().includes(query);
        const matchLogCode = rec.logCode.toLowerCase().includes(query);
        if (!matchBorrower && !matchAsset && !matchAssetCode && !matchLogCode) {
          return false;
        }
      }

      // 3. Department Filter
      if (
        filters.department &&
        filters.department !== "All Departments" &&
        rec.department !== filters.department
      ) {
        return false;
      }

      // 4. Date Filter (Release Date)
      if (filters.startDate) {
        const releaseDate = new Date(rec.releasedAt).toISOString().split("T")[0];
        if (releaseDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const releaseDate = new Date(rec.releasedAt).toISOString().split("T")[0];
        if (releaseDate > filters.endDate) return false;
      }

      return true;
    });
  }, [records, activeTab, filters]);

  // Handlers
  const handleFilterChange = (updated: Partial<BorrowLogFilterState>) => {
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

  const handleConfirmRelease = (releaseData: {
    borrowerName: string;
    department: string;
    assetCode: string;
    assetName: string;
    dueDate: string;
    notes?: string;
  }) => {
    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const newRecord: BorrowLogRecord = {
      id: `log-${Date.now()}`,
      logCode: `LOG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      requestCode: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      borrowerName: releaseData.borrowerName,
      borrowerEmail: `${releaseData.borrowerName.toLowerCase().replace(/\s+/g, ".")}@crmc.gov.ph`,
      borrowerPhone: "+63 917 555 0000",
      department: releaseData.department,
      assetCode: releaseData.assetCode,
      assetName: releaseData.assetName,
      category: releaseData.assetCode.startsWith("AV")
        ? "av"
        : releaseData.assetCode.startsWith("TR")
        ? "transport"
        : releaseData.assetCode.startsWith("FN")
        ? "furniture"
        : "computing",
      releasedAt: new Date().toISOString(),
      dueDate: releaseData.dueDate,
      status: "active",
      releasedBy: "Dave Custodio (Custodian)",
      history: [
        {
          id: `lh-${Date.now()}`,
          action: "released",
          actor: "Dave Custodio (Custodian)",
          timestamp,
          notes: releaseData.notes || "Physical checkout verified & released.",
        },
      ],
    };

    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleConfirmReturn = (
    rec: BorrowLogRecord,
    condition: ReturnCondition,
    notes?: string
  ) => {
    const timestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    setRecords((prev) =>
      prev.map((item) => {
        if (item.id !== rec.id) return item;
        return {
          ...item,
          status: "returned",
          returnedAt: new Date().toISOString(),
          conditionOnReturn: condition,
          conditionNotes: notes,
          receivedBy: "Dave Custodio (Custodian)",
          history: [
            ...item.history,
            {
              id: `lh-${Date.now()}`,
              action: "returned",
              actor: "Dave Custodio (Custodian)",
              timestamp,
              notes: notes || `Returned in ${condition} condition.`,
            },
            ...(condition !== "good"
              ? [
                  {
                    id: `lh-${Date.now() + 1}`,
                    action: "flagged_repair" as const,
                    actor: "Dave Custodio (Custodian)",
                    timestamp,
                    notes: `Asset tag ${rec.assetCode} flagged for repair inspection.`,
                  },
                ]
              : []),
          ],
        };
      })
    );

    // Keep drawer in sync if open
    if (selectedRecord && selectedRecord.id === rec.id) {
      setSelectedRecord((prev) =>
        prev
          ? {
              ...prev,
              status: "returned",
              returnedAt: new Date().toISOString(),
              conditionOnReturn: condition,
              conditionNotes: notes,
              receivedBy: "Dave Custodio (Custodian)",
            }
          : null
      );
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">
              Borrow & Return Log
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {records.length} total logs
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Operational ledger tracking active checkouts, return handoffs, condition inspections, and overdue items.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setReleaseDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <ArrowUpFromLine className="h-4 w-4" strokeWidth={2.5} />
            Process Release
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation Bar ───────────────────────────────────────── */}
      <BorrowLogTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeCount={activeCount}
        overdueCount={overdueCount}
        returnedCount={returnedCount}
        totalCount={records.length}
      />

      {/* ── Search & Filter Controls ──────────────────────────────────── */}
      <BorrowLogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* ── Internal Scrollable Log List Region ──────────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        <BorrowLogList
          records={filteredRecords}
          activeTab={activeTab}
          loading={isLoading}
          onSelect={setSelectedRecord}
          onProcessReturn={setReturnDialogRecord}
        />
      </main>

      {/* ── Detail Slide-over Panel ──────────────────────────────────── */}
      <BorrowLogDetailPanel
        record={selectedRecord}
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        onProcessReturn={(rec) => {
          setSelectedRecord(null);
          setReturnDialogRecord(rec);
        }}
      />

      {/* ── Release Asset Dialog ─────────────────────────────────────── */}
      <ReleaseAssetDialog
        isOpen={releaseDialogOpen}
        onClose={() => setReleaseDialogOpen(false)}
        onConfirmRelease={handleConfirmRelease}
      />

      {/* ── Return Asset Dialog ──────────────────────────────────────── */}
      <ReturnAssetDialog
        record={returnDialogRecord}
        isOpen={Boolean(returnDialogRecord)}
        onClose={() => setReturnDialogRecord(null)}
        onConfirmReturn={handleConfirmReturn}
      />
    </div>
  );
}
