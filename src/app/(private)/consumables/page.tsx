"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, PlusCircle } from "lucide-react";
import type { ConsumableItem, ConsumableFilterState } from "@/components/consumables/types";
import { getStockSeverity } from "@/components/consumables/types";
import { INITIAL_MOCK_CONSUMABLES } from "@/components/consumables/mock-data";
import { ConsumableFilters } from "@/components/consumables/consumable-filters";
import { AssetViewToggle } from "@/components/assets/asset-view-toggle"; // Reused view mode toggle
import { ConsumableGrid } from "@/components/consumables/consumable-grid";
import { ConsumableTable } from "@/components/consumables/consumable-table";
import { ConsumableDetailPanel } from "@/components/consumables/consumable-detail-panel";
import { AddEditConsumableDialog } from "@/components/consumables/add-edit-consumable-dialog";
import { RestockDialog } from "@/components/consumables/restock-dialog";
import { AdjustStockDialog } from "@/components/consumables/adjust-stock-dialog";

export default function ConsumablesPage() {
  const [items, setItems] = useState<ConsumableItem[]>(INITIAL_MOCK_CONSUMABLES);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = useState(true);

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

  // Initial load simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter & Sort Items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
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

  const handleSaveConsumable = (itemData: Partial<ConsumableItem>) => {
    if (addEditState.item) {
      // Edit
      setItems((prev) =>
        prev.map((i) => (i.id === itemData.id ? ({ ...i, ...itemData } as ConsumableItem) : i))
      );
      if (selectedItem?.id === itemData.id) {
        setSelectedItem((prev) => (prev ? ({ ...prev, ...itemData } as ConsumableItem) : null));
      }
    } else {
      // Create
      const newItem: ConsumableItem = {
        id: itemData.id || `con-${Date.now()}`,
        itemCode: itemData.itemCode || `CON-${Math.floor(1000 + Math.random() * 9000)}`,
        name: itemData.name || "New Supply Item",
        category: itemData.category || "office_supplies",
        unit: itemData.unit || "reams",
        currentQty: itemData.currentQty ?? 50,
        minThreshold: itemData.minThreshold ?? 15,
        location: itemData.location || "Supply Storage Bay A1",
        supplier: itemData.supplier,
        lastRestocked: new Date().toISOString().split("T")[0],
        notes: itemData.notes,
        history: [],
      };
      setItems((prev) => [newItem, ...prev]);
    }
  };

  const handleConfirmRestock = (itemId: string, qtyReceived: number, notes?: string) => {
    const today = new Date().toISOString().split("T")[0];
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const newQty = i.currentQty + qtyReceived;
        return {
          ...i,
          currentQty: newQty,
          lastRestocked: today,
          history: [
            {
              id: `sh-${Date.now()}`,
              date: today,
              type: "restock",
              quantityChange: qtyReceived,
              actor: "Property Custodian",
              notes: notes || `Restock shipment received (+${qtyReceived} ${i.unit})`,
            },
            ...i.history,
          ],
        };
      })
    );

    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              currentQty: prev.currentQty + qtyReceived,
              lastRestocked: today,
            }
          : null
      );
    }
  };

  const handleConfirmAdjust = (
    itemId: string,
    adjustmentDelta: number,
    reason: string,
    notes?: string
  ) => {
    const today = new Date().toISOString().split("T")[0];
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const newQty = Math.max(0, i.currentQty + adjustmentDelta);
        return {
          ...i,
          currentQty: newQty,
          history: [
            {
              id: `sh-${Date.now()}`,
              date: today,
              type: "adjustment",
              quantityChange: adjustmentDelta,
              actor: "Property Custodian",
              reason,
              notes,
            },
            ...i.history,
          ],
        };
      })
    );

    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              currentQty: Math.max(0, prev.currentQty + adjustmentDelta),
            }
          : null
      );
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle" data-theme="light">
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
