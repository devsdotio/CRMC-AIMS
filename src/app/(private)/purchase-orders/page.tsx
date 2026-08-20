"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  FilePlus2,
} from "lucide-react";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client/use-purchase-lots";
import { useAssetOperator } from "@/hooks/use-asset-operator";
import { useToast } from "@/components/providers/toast-context";
import { OperatorReadOnlyBanner } from "@/components/shared/operator-read-only-banner";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import type { PurchaseLot } from "@/types/purchase-lots";

import {
  PurchaseOrdersFilters,
  type PurchaseOrderFilterState,
} from "@/components/purchase-orders/purchase-orders-filters";
import { PurchaseOrdersTable } from "@/components/purchase-orders/purchase-orders-table";
import { PurchaseOrdersGrid } from "@/components/purchase-orders/purchase-orders-grid";
import { PurchaseOrderDetailSheet } from "@/components/purchase-orders/purchase-order-detail-sheet";
import { POPrintSlipDialog } from "@/components/purchase-orders/po-print-slip-dialog";
import { FileNewPODialog } from "@/components/purchase-orders/file-new-po-dialog";

export default function PurchaseOrdersPage() {
  const {
    data: lots = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = usePurchaseLotsQuery();
  const { canOperate } = useAssetOperator();
  const toast = useToast();

  const [filters, setFilters] = useState<PurchaseOrderFilterState>({
    search: "",
    itemType: "all",
    stockStatus: "all",
    supplierId: "",
    datePreset: "all",
    startDate: "",
    endDate: "",
    viewMode: "grid",
  });

  // Dialog & Detail states
  const [selectedLot, setSelectedLot] = useState<PurchaseLot | null>(null);
  const [printSlipLot, setPrintSlipLot] = useState<PurchaseLot | null>(null);
  const [isFileNewPOOpen, setIsFileNewPOOpen] = useState(false);

  // Guarantee 1 unique record per Lot Code
  const uniqueLots = useMemo(() => {
    const map = new Map<string, PurchaseLot>();
    for (const l of lots) {
      const code = (l.lotCode || l.id).trim();
      if (!map.has(code)) {
        map.set(code, l);
      }
    }
    return Array.from(map.values());
  }, [lots]);

  // Keep selected lot in sync with fresh query data
  const selectedLotSynced = useMemo(() => {
    if (!selectedLot) return null;
    return uniqueLots.find((l) => l.id === selectedLot.id) ?? selectedLot;
  }, [uniqueLots, selectedLot]);

  // Supplier Options for filter with count
  const supplierOptions = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const l of uniqueLots) {
      const name = l.supplierName?.trim() || "Internal / Direct";
      countMap.set(name, (countMap.get(name) || 0) + 1);
    }
    return Array.from(countMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({
        value: name === "Internal / Direct" ? "" : name,
        label: name,
        count,
      }));
  }, [uniqueLots]);

  // Filter lots
  const filteredLots = useMemo(() => {
    return uniqueLots.filter((lot) => {
      // 1. Search Query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchCode = lot.lotCode.toLowerCase().includes(q);
        const matchItem =
          lot.itemName.toLowerCase().includes(q) ||
          lot.itemCode.toLowerCase().includes(q);
        const matchSupplier = lot.supplierName?.toLowerCase().includes(q);
        const matchRecorder = lot.recordedByName?.toLowerCase().includes(q);
        const matchRef = lot.reference?.toLowerCase().includes(q);
        const matchNotes = lot.notes?.toLowerCase().includes(q);
        if (!matchCode && !matchItem && !matchSupplier && !matchRecorder && !matchRef && !matchNotes) {
          return false;
        }
      }

      // 2. Item Type Filter
      if (filters.itemType !== "all" && lot.itemType !== filters.itemType) {
        return false;
      }

      // 3. Stock Status Filter
      if (filters.stockStatus === "in_stock" && lot.quantityRemaining <= 0) {
        return false;
      }
      if (filters.stockStatus === "depleted" && lot.quantityRemaining > 0) {
        return false;
      }
      if (filters.stockStatus === "low_stock") {
        const ratio = lot.quantity > 0 ? lot.quantityRemaining / lot.quantity : 0;
        if (lot.quantityRemaining <= 0 || ratio > 0.2) {
          return false;
        }
      }

      // 4. Supplier Filter
      if (filters.supplierId && (lot.supplierName || "") !== filters.supplierId) {
        return false;
      }

      // 5. Date Filter
      const lotDate = lot.purchasedOn || lot.createdAt.split("T")[0];
      if (filters.startDate && lotDate < filters.startDate) {
        return false;
      }
      if (filters.endDate && lotDate > filters.endDate) {
        return false;
      }

      return true;
    });
  }, [uniqueLots, filters]);

  const handleFilterChange = (updates: Partial<PurchaseOrderFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      itemType: "all",
      stockStatus: "all",
      supplierId: "",
      datePreset: "all",
      startDate: "",
      endDate: "",
      viewMode: filters.viewMode,
    });
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle">
      {/* Header Banner */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <Boxes className="h-5 w-5 text-accent" strokeWidth={2.2} />
              Purchase Orders & Intake Batches
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {filteredLots.length} of {uniqueLots.length} lots
              {isFetching && !isLoading ? " · updating…" : ""}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Vendor procurement registry, immutable batch lot codes, acquisition costs, and stock holding ledger.
          </p>
        </div>

        {canOperate && (
          <button
            type="button"
            onClick={() => setIsFileNewPOOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <FilePlus2 className="h-4 w-4" strokeWidth={2.5} />
            <span>File New Purchase Order</span>
          </button>
        )}
      </div>

      {!canOperate && <OperatorReadOnlyBanner />}

      {/* Network / Connection Error Banner */}
      {error && (
        <QueryErrorBanner
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {/* Main Scoped Scroll Area */}
      <main className="flex-1 overflow-y-auto min-h-0 p-4 md:p-6 space-y-4 bg-bg-subtle">
        {/* Filter Toolbar */}
        <PurchaseOrdersFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          supplierOptions={supplierOptions}
          totalCount={uniqueLots.length}
          filteredCount={filteredLots.length}
        />

        {/* Content View Switching (Card Grid default or Table) */}
        {filters.viewMode === "table" ? (
          <PurchaseOrdersTable
            lots={filteredLots}
            loading={isLoading && !error}
            onSelectLot={setSelectedLot}
            onPrintSlip={setPrintSlipLot}
          />
        ) : (
          <PurchaseOrdersGrid
            lots={filteredLots}
            loading={isLoading && !error}
            onSelectLot={setSelectedLot}
            onPrintSlip={setPrintSlipLot}
          />
        )}
      </main>

      {/* Slide-over Detail Sheet */}
      <PurchaseOrderDetailSheet
        lot={selectedLotSynced}
        isOpen={Boolean(selectedLotSynced)}
        onClose={() => setSelectedLot(null)}
        onPrintSlip={(lot) => setPrintSlipLot(lot)}
      />

      {/* Official Printable CRMC PO Document Dialog */}
      <POPrintSlipDialog
        lot={printSlipLot}
        isOpen={Boolean(printSlipLot)}
        onClose={() => setPrintSlipLot(null)}
      />

      {/* File New Official Purchase Order Modal */}
      {canOperate && (
        <FileNewPODialog
          isOpen={isFileNewPOOpen}
          onClose={() => setIsFileNewPOOpen(false)}
          onSuccess={() => {
            // React Query will refresh purchase lots automatically
          }}
        />
      )}
    </div>
  );
}
