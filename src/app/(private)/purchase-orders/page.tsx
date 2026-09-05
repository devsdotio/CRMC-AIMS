"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  FilePlus2,
} from "lucide-react";
import {
  usePurchaseLotsQuery,
  useDeletePurchaseOrderMutation,
} from "@/features/purchase-lots/client/use-purchase-lots";
import { useAssetOperator } from "@/hooks/use-asset-operator";
import { OperatorReadOnlyBanner } from "@/components/shared/operator-read-only-banner";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useToast } from "@/components/providers/toast-context";
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
import { LotPrintTagDialog } from "@/components/purchase-orders/lot-print-tag-dialog";
import { LotReleaseDialog } from "@/components/purchase-orders/lot-release-dialog";

export default function PurchaseOrdersPage() {
  const {
    data: lots = [],
    isLoading,
    error,
    isFetching,
    refetch,
  } = usePurchaseLotsQuery();
  const { canOperate } = useAssetOperator();
  const deleteMutation = useDeletePurchaseOrderMutation();
  const toast = useToast();

  const [filters, setFilters] = useState<PurchaseOrderFilterState>({
    search: "",
    itemType: "all",
    status: "all",
    stockStatus: "all",
    supplierId: "",
    datePreset: "all",
    startDate: "",
    endDate: "",
    viewMode: "table",
  });

  const [selectedLot, setSelectedLot] = useState<PurchaseLot | null>(null);
  const [printSlipLot, setPrintSlipLot] = useState<PurchaseLot | null>(null);
  const [printTagLot, setPrintTagLot] = useState<PurchaseLot | null>(null);
  const [releaseLot, setReleaseLot] = useState<PurchaseLot | null>(null);
  const [lotToDelete, setLotToDelete] = useState<PurchaseLot | null>(null);
  const [isFileNewPOOpen, setIsFileNewPOOpen] = useState(false);

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

  const selectedLotSynced = useMemo(() => {
    if (!selectedLot) return null;
    return uniqueLots.find((l) => l.id === selectedLot.id) ?? selectedLot;
  }, [uniqueLots, selectedLot]);

  const releaseLotSynced = useMemo(() => {
    if (!releaseLot) return null;
    return uniqueLots.find((l) => l.id === releaseLot.id) ?? releaseLot;
  }, [uniqueLots, releaseLot]);

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

  const filteredLots = useMemo(() => {
    return uniqueLots.filter((lot) => {
      // 1. Search Query
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchCode = (lot.poNumber || lot.lotCode).toLowerCase().includes(q);
        const matchLot = lot.lotCode.toLowerCase().includes(q);
        const matchItem =
          lot.itemName.toLowerCase().includes(q) ||
          lot.itemCode.toLowerCase().includes(q);
        const matchSupplier = lot.supplierName?.toLowerCase().includes(q);
        const matchRecorder = lot.recordedByName?.toLowerCase().includes(q);
        const matchRef = lot.reference?.toLowerCase().includes(q);
        const matchNotes = lot.notes?.toLowerCase().includes(q);
        const matchPurpose = lot.purpose?.toLowerCase().includes(q);
        if (
          !matchCode &&
          !matchLot &&
          !matchItem &&
          !matchSupplier &&
          !matchRecorder &&
          !matchRef &&
          !matchNotes &&
          !matchPurpose
        ) {
          return false;
        }
      }

      // 2. Workflow Status Filter
      if (filters.status !== "all" && lot.status !== filters.status) {
        return false;
      }

      // 3. Item Type Filter
      if (filters.itemType !== "all" && lot.itemType !== filters.itemType) {
        return false;
      }

      // 4. Stock Status Filter
      if (filters.stockStatus === "in_stock" && lot.quantityRemaining <= 0) {
        return false;
      }
      if (filters.stockStatus === "depleted" && lot.quantityRemaining > 0) {
        return false;
      }
      if (filters.stockStatus === "low_stock") {
        const ratio =
          lot.quantity > 0 ? lot.quantityRemaining / lot.quantity : 0;
        if (lot.quantityRemaining <= 0 || ratio > 0.2) {
          return false;
        }
      }

      // 5. Supplier Filter
      if (
        filters.supplierId &&
        (lot.supplierName || "") !== filters.supplierId
      ) {
        return false;
      }

      // 6. Date Range
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
      status: "all",
      stockStatus: "all",
      supplierId: "",
      datePreset: "all",
      startDate: "",
      endDate: "",
      viewMode: filters.viewMode,
    });
  };

  const handleConfirmDelete = async () => {
    if (!lotToDelete) return;
    try {
      await deleteMutation.mutateAsync(lotToDelete.id);
      toast.success(
        `Purchase Order "${lotToDelete.poNumber || lotToDelete.lotCode}" deleted.`
      );
      if (selectedLot?.id === lotToDelete.id) {
        setSelectedLot(null);
      }
      setLotToDelete(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete purchase order."
      );
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle">
      {/* Header Bar */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <Boxes className="h-5 w-5 text-accent" strokeWidth={2.2} />
              Purchase Orders & Acquisition
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {isLoading
                ? "Loading orders…"
                : `${filteredLots.length} of ${uniqueLots.length} orders`}
              {isFetching && !isLoading ? " · updating…" : ""}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Official PO workflow, stock intake batches, supplier costs, and delivery tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
      </div>

      {!canOperate && <OperatorReadOnlyBanner />}

      {error && (
        <QueryErrorBanner
          message={error.message}
          onRetry={() => refetch()}
        />
      )}

      {/* Filters Toolbar */}
      <PurchaseOrdersFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        supplierOptions={supplierOptions}
        totalCount={uniqueLots.length}
        filteredCount={filteredLots.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        {filters.viewMode === "table" ? (
          <PurchaseOrdersTable
            lots={filteredLots}
            loading={isLoading && !error}
            onSelectLot={setSelectedLot}
            onPrintSlip={setPrintSlipLot}
            onDelete={
              canOperate
                ? (lot) => setLotToDelete(lot)
                : undefined
            }
          />
        ) : (
          <div className="p-4 md:p-6">
            <PurchaseOrdersGrid
              lots={filteredLots}
              loading={isLoading && !error}
              onSelectLot={setSelectedLot}
              onPrintSlip={setPrintSlipLot}
              onDelete={
                canOperate
                  ? (lot) => setLotToDelete(lot)
                  : undefined
              }
            />
          </div>
        )}
      </main>

      {/* Detail Slide-Out Sheet with Workflow Stepper & Audit Logs */}
      <PurchaseOrderDetailSheet
        lot={selectedLotSynced}
        isOpen={Boolean(selectedLotSynced)}
        onClose={() => setSelectedLot(null)}
        onPrintSlip={(lot) => setPrintSlipLot(lot)}
        onPrintTag={(lot) => setPrintTagLot(lot)}
        onReleaseStock={(lot) => setReleaseLot(lot)}
        onDelete={
          canOperate
            ? (lot) => setLotToDelete(lot)
            : undefined
        }
        canOperate={canOperate}
      />

      {/* Official CRMC PO Printable Form Slip */}
      <POPrintSlipDialog
        lot={printSlipLot}
        isOpen={Boolean(printSlipLot)}
        onClose={() => setPrintSlipLot(null)}
      />

      {/* Physical Bin / Lot Tag */}
      <LotPrintTagDialog
        lot={printTagLot}
        isOpen={Boolean(printTagLot)}
        onClose={() => setPrintTagLot(null)}
      />

      {/* Staff Operator Modals */}
      {canOperate && (
        <>
          <LotReleaseDialog
            lot={releaseLotSynced}
            isOpen={Boolean(releaseLotSynced)}
            onClose={() => setReleaseLot(null)}
            onSuccess={() => {
              void refetch();
            }}
          />

          <FileNewPODialog
            isOpen={isFileNewPOOpen}
            onClose={() => setIsFileNewPOOpen(false)}
            onSuccess={() => {
              void refetch();
            }}
          />

          <ConfirmDialog
            isOpen={Boolean(lotToDelete)}
            title="Delete Purchase Order"
            description={
              lotToDelete
                ? `Are you sure you want to delete purchase order "${lotToDelete.poNumber || lotToDelete.lotCode}" (${lotToDelete.itemName})? This will cancel the order and cannot be undone.`
                : ""
            }
            confirmLabel="Delete Order"
            variant="destructive"
            isLoading={deleteMutation.isPending}
            onConfirm={handleConfirmDelete}
            onClose={() => setLotToDelete(null)}
          />
        </>
      )}
    </div>
  );
}
