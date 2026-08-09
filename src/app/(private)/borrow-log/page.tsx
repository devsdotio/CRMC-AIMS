"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowUpFromLine } from "lucide-react";
import {
  useBorrowLogQuery,
  useReturnBorrowMutation,
} from "@/features/borrow-log/client/use-borrow-log";
import type {
  BorrowLogRecord,
  LogTabFilter,
  BorrowLogFilterState,
  ReturnCondition,
} from "@/types/borrow-log";
import { BorrowLogTabs } from "@/components/borrow-log/borrow-log-tabs";
import { BorrowLogFilters } from "@/components/borrow-log/borrow-log-filters";
import { BorrowLogList } from "@/components/borrow-log/borrow-log-list";
import { BorrowLogDetailPanel } from "@/components/borrow-log/borrow-log-detail-panel";
import { ReturnAssetDialog } from "@/components/borrow-log/return-asset-dialog";
import { notFound } from "next/navigation";

export default function BorrowLogPage() {
  notFound(); // Hidden for now
  const { data: records = [], isLoading } = useBorrowLogQuery();
  const returnMutation = useReturnBorrowMutation();

  const [activeTab, setActiveTab] = useState<LogTabFilter>("active");

  // Filter State
  const [filters, setFilters] = useState<BorrowLogFilterState>({
    searchQuery: "",
    department: "All Departments",
    startDate: "",
    endDate: "",
  });

  // Modal / Drawer States
  const [selectedRecord, setSelectedRecord] = useState<BorrowLogRecord | null>(
    null,
  );
  const [returnDialogRecord, setReturnDialogRecord] =
    useState<BorrowLogRecord | null>(null);

  // Compute live tab counts
  const activeCount = useMemo(
    () => records.filter((r) => r.status === "active").length,
    [records],
  );
  const overdueCount = useMemo(
    () => records.filter((r) => r.status === "overdue").length,
    [records],
  );
  const returnedCount = useMemo(
    () => records.filter((r) => r.status === "returned").length,
    [records],
  );

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Tab Filter
      if (activeTab !== "all" && rec.status !== activeTab) {
        return false;
      }

      // 2. Search Query
      if (filters.searchQuery?.trim()) {
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
        const releaseDate = new Date(rec.releasedAt)
          .toISOString()
          .split("T")[0];
        if (releaseDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const releaseDate = new Date(rec.releasedAt)
          .toISOString()
          .split("T")[0];
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


  const handleConfirmReturn = async (
    rec: BorrowLogRecord,
    condition: ReturnCondition,
    notes?: string,
  ) => {
    await returnMutation.mutateAsync({
      id: rec.id,
      payload: {
        condition,
        conditionNotes: notes,
      },
    });

    if (selectedRecord && selectedRecord.id === rec.id) {
      setSelectedRecord(null);
    }
  };

  return (
    <div
      className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md"
      data-theme="light"
    >
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
            Operational ledger tracking active checkouts, return handoffs,
            condition inspections, and overdue items.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Manual Process Release temporarily removed */}
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
