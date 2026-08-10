"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, PlusCircle } from "lucide-react";
import {
  useConsumablesQuery,
  useCreateConsumableMutation,
  useUpdateConsumableMutation,
  useRestockConsumableMutation,
  useAdjustConsumableMutation,
} from "@/features/consumables/client/use-consumables";
import type { ConsumableItem, ConsumableFilterState } from "@/types/inventory";
import { getStockSeverity } from "@/components/consumables/utils";
import { ConsumableFilters } from "@/components/consumables/consumable-filters";
import { AssetViewToggle } from "@/components/assets/asset-view-toggle"; // Reused view mode toggle
import { ConsumableGrid } from "@/components/consumables/consumable-grid";
import { ConsumableTable } from "@/components/consumables/consumable-table";
import { ConsumableDetailPanel } from "@/components/consumables/consumable-detail-panel";
import { AddEditConsumableDialog } from "@/components/consumables/add-edit-consumable-dialog";
import { RestockDialog } from "@/components/consumables/restock-dialog";
import { AdjustStockDialog } from "@/components/consumables/adjust-stock-dialog";
import { useSuppliersQuery } from "@/features/suppliers/client";

export default function ConsumablesPage() {
  const { data: paginatedData, isLoading: isConsumablesLoading } = useConsumablesQuery();
  const items = useMemo(() => paginatedData?.data ?? [], [paginatedData?.data]);

  const createMutation = useCreateConsumableMutation();
  const updateMutation = useUpdateConsumableMutation();
  const restockMutation = useRestockConsumableMutation();
  const adjustMutation = useAdjustConsumableMutation();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { data: suppliers = [], isLoading: isSuppliersLoading } = useSuppliersQuery({ activeOnly: true });
  
  const isLoading = isConsumablesLoading || isSuppliersLoading;

  // Filter & Sort State
  const [filters, setFilters] = useState<ConsumableFilterState>({
    searchQuery: "",
    category: "all",
    stockLevel: "all",
    sortBy: "critical", // Default: Most critical first
  });

  // Modal / Drawer States
  const [selectedItem, setSelectedItem] = useState<ConsumableItem | null>(null);
  const [addEditState, setAddEditState] = useState<{ isOpen: boolean; item: ConsumableItem | null }>({
    isOpen: false,
    item: null,
  });
  const [restockState, setRestockState] = useState<{ isOpen: boolean; item: ConsumableItem | null }>({
    isOpen: false,
    item: null,
  });
  const [adjustState, setAdjustState] = useState<{ isOpen: boolean; item: ConsumableItem | null }>({
    isOpen: false,
    item: null,
  });

  // Filter & Sort Items
  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      // 1. Search Query
      if (filters.searchQuery?.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchCode = item.itemCode.toLowerCase().includes(query);
        if (!matchName && !matchCode) return false;
      }

      // 2. Category Filter
      if (filters.category && filters.category !== "all" && item.category !== filters.category) {
        return false;
      }

      // 3. Stock Level Filter
      if (filters.stockLevel && filters.stockLevel !== "all") {
        const severity = getStockSeverity(item.currentQty, item.minThreshold);
        if (severity !== filters.stockLevel) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === "critical") {
        // Compute severity score: Critical (0), Low (1), Healthy (2)
        const sevOrder = { critical: 0, low: 1, healthy: 2 };
        const sevA = sevOrder[getStockSeverity(a.currentQty, a.minThreshold)];
        const sevB = sevOrder[getStockSeverity(b.currentQty, b.minThreshold)];
        if (sevA !== sevB) return sevA - sevB;
        // Ratio of currentQty to minThreshold as secondary sort
        return a.currentQty / a.minThreshold - b.currentQty / b.minThreshold;
      }
      if (filters.sortBy === "qty") {
        return a.currentQty - b.currentQty;
      }
      if (filters.sortBy === "updated") {
        return b.lastRestocked.localeCompare(a.lastRestocked);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [items, filters]);

  // Handlers
  const handleFilterChange = (updated: Partial<ConsumableFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      category: "all",
      stockLevel: "all",
      sortBy: "critical",
    });
  };

  const handleSaveConsumable = async (itemData: Partial<ConsumableItem>) => {
    if (addEditState.item) {
      // Edit
      await updateMutation.mutateAsync({
        id: addEditState.item.id,
        payload: {
          name: itemData.name,
          category: itemData.category,
          unit: itemData.unit,
          minThreshold: itemData.minThreshold,
          location: itemData.location,
          supplier: itemData.supplier,
          notes: itemData.notes,
        },
      });
      if (selectedItem?.id === addEditState.item.id) {
        setSelectedItem(null);
      }
    } else {
      // Create
      await createMutation.mutateAsync({
        itemCode: itemData.itemCode,
        name: itemData.name || "New Supply Item",
        category: itemData.category || "office_supplies",
        unit: itemData.unit || "reams",
        currentQty: itemData.currentQty ?? 50,
        minThreshold: itemData.minThreshold ?? 15,
        location: itemData.location || "Supply Storage Bay A1",
        supplier: itemData.supplier,
        notes: itemData.notes,
      });
    }
  };

  const handleConfirmRestock = async (input: {
    itemId: string;
    qtyReceived: number;
    unitCost: number;
    supplierId?: string | null;
    notes?: string;
  }) => {
    await restockMutation.mutateAsync({
      id: input.itemId,
      payload: {
        quantity: input.qtyReceived,
        unitCost: input.unitCost,
        supplierId: input.supplierId,
        notes: input.notes,
      },
    });
    if (selectedItem?.id === input.itemId) {
      setSelectedItem(null);
    }
  };

  const handleConfirmAdjust = async (
    itemId: string,
    adjustmentDelta: number,
    reason: string,
    notes?: string
  ) => {
    await adjustMutation.mutateAsync({
      id: itemId,
      payload: {
        quantityChange: adjustmentDelta,
        reason,
        notes,
      },
    });
    if (selectedItem?.id === itemId) {
      setSelectedItem(null);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      {/* ── Top Header Banner ────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">
              Consumables Inventory
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {filteredItems.length} of {items.length} supply items
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Stock control for office paper, printer ink, cleaning supplies, and non-serialized consumables.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRestockState({ isOpen: true, item: null })}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-bg text-text hover:border-primary transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-accent" />
            <span>Restock Inventory</span>
          </button>

          <button
            type="button"
            onClick={() => setAddEditState({ isOpen: true, item: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Supply Item
          </button>

          <AssetViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* ── Filters Row ───────────────────────────────────────────────── */}
      <ConsumableFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={items.length}
        filteredCount={filteredItems.length}
      />

      {/* ── Internal Scrollable Main Content Region ───────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        {viewMode === "grid" ? (
          <ConsumableGrid
            items={filteredItems}
            loading={isLoading}
            onSelect={setSelectedItem}
            onRestock={(item) => setRestockState({ isOpen: true, item })}
            onAdjust={(item) => setAdjustState({ isOpen: true, item })}
          />
        ) : (
          <ConsumableTable
            items={filteredItems}
            loading={isLoading}
            onSelect={setSelectedItem}
            onRestock={(item) => setRestockState({ isOpen: true, item })}
            onAdjust={(item) => setAdjustState({ isOpen: true, item })}
          />
        )}
      </main>

      {/* ── Detail Slide-over Panel ───────────────────────────────────── */}
      <ConsumableDetailPanel
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onRestock={(item) => setRestockState({ isOpen: true, item })}
        onAdjust={(item) => setAdjustState({ isOpen: true, item })}
      />

      {/* ── Add / Edit Consumable Dialog ─────────────────────────────── */}
      <AddEditConsumableDialog
        isOpen={addEditState.isOpen}
        initialItem={addEditState.item}
        onClose={() => setAddEditState({ isOpen: false, item: null })}
        onSave={handleSaveConsumable}
      />

      {/* ── Restock Dialog ───────────────────────────────────────────── */}
      <RestockDialog
        item={restockState.item}
        allItems={items}
        suppliers={suppliers}
        isOpen={restockState.isOpen}
        onClose={() => setRestockState({ isOpen: false, item: null })}
        onConfirmRestock={handleConfirmRestock}
      />

      {/* ── Manual Stock Adjustment Dialog ───────────────────────────── */}
      <AdjustStockDialog
        item={adjustState.item}
        isOpen={adjustState.isOpen}
        onClose={() => setAdjustState({ isOpen: false, item: null })}
        onConfirmAdjust={handleConfirmAdjust}
      />
    </div>
  );
}
