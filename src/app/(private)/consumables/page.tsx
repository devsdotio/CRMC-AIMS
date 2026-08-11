"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, PlusCircle, PackageMinus } from "lucide-react";
import {
  useConsumablesQuery,
  useCreateConsumableMutation,
  useUpdateConsumableMutation,
  useRestockConsumableMutation,
  useAdjustConsumableMutation,
} from "@/features/consumables/client/use-consumables";
import {
  usePurchaseLotsQuery,
  useReleaseFromLotMutation,
} from "@/features/purchase-lots/client";
import type { ConsumableItem, ConsumableFilterState } from "@/types/inventory";
import type { PurchaseLot } from "@/types/purchase-lots";
import { getStockSeverity } from "@/components/consumables/utils";
import { ConsumableFilters } from "@/components/consumables/consumable-filters";
import { AssetViewToggle } from "@/components/assets/asset-view-toggle";
import { ConsumableGrid } from "@/components/consumables/consumable-grid";
import { ConsumableTable } from "@/components/consumables/consumable-table";
import { ConsumableDetailPanel } from "@/components/consumables/consumable-detail-panel";
import { AddEditConsumableDialog } from "@/components/consumables/add-edit-consumable-dialog";
import { RestockDialog } from "@/components/consumables/restock-dialog";
import { AdjustStockDialog } from "@/components/consumables/adjust-stock-dialog";
import {
  ReleaseFromLotDialog,
  type ReleaseFromLotInput,
} from "@/components/consumables/release-from-lot-dialog";
import { useSuppliersQuery } from "@/features/suppliers/client";

export default function ConsumablesPage() {
  const { data: paginatedData, isLoading: isConsumablesLoading } =
    useConsumablesQuery({ limit: 100 });
  const items = useMemo(
    () => paginatedData?.data ?? [],
    [paginatedData?.data]
  );

  const createMutation = useCreateConsumableMutation();
  const updateMutation = useUpdateConsumableMutation();
  const restockMutation = useRestockConsumableMutation();
  const adjustMutation = useAdjustConsumableMutation();
  const releaseMutation = useReleaseFromLotMutation();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Grid/table only need the consumables list; suppliers load when restock opens.
  const isLoading = isConsumablesLoading;

  const [filters, setFilters] = useState<ConsumableFilterState>({
    searchQuery: "",
    category: "all",
    stockLevel: "all",
    sortBy: "critical",
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  const [addEditState, setAddEditState] = useState<{
    isOpen: boolean;
    item: ConsumableItem | null;
  }>({ isOpen: false, item: null });
  const [restockState, setRestockState] = useState<{
    isOpen: boolean;
    item: ConsumableItem | null;
  }>({ isOpen: false, item: null });
  const [adjustState, setAdjustState] = useState<{
    isOpen: boolean;
    item: ConsumableItem | null;
  }>({ isOpen: false, item: null });
  const [releaseState, setReleaseState] = useState<{
    isOpen: boolean;
    item: ConsumableItem | null;
    lot: PurchaseLot | null;
  }>({ isOpen: false, item: null, lot: null });

  // Suppliers only matter for Restock dialog (add/edit loads its own registry list).
  const { data: suppliers = [] } = useSuppliersQuery({
    activeOnly: true,
    enabled: restockState.isOpen,
  });

  const releaseItemId = releaseState.item?.id;
  const { data: releaseLots = [] } = usePurchaseLotsQuery({
    consumableId: releaseItemId,
    itemType: "consumable",
    enabled: Boolean(releaseState.isOpen && releaseItemId),
  });

  const [actionError, setActionError] = useState<string | null>(null);

  // Keep detail selection valid when list refreshes
  useEffect(() => {
    if (selectedId && !items.some((i) => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  const filteredItems = useMemo(() => {
    const result = items.filter((item) => {
      if (filters.searchQuery?.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchCode = item.itemCode.toLowerCase().includes(query);
        if (!matchName && !matchCode) return false;
      }

      if (
        filters.category &&
        filters.category !== "all" &&
        item.category !== filters.category
      ) {
        return false;
      }

      if (filters.stockLevel && filters.stockLevel !== "all") {
        const severity = getStockSeverity(item.currentQty, item.minThreshold);
        if (severity !== filters.stockLevel) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      if (filters.sortBy === "critical") {
        const sevOrder = { critical: 0, low: 1, healthy: 2 };
        const sevA = sevOrder[getStockSeverity(a.currentQty, a.minThreshold)];
        const sevB = sevOrder[getStockSeverity(b.currentQty, b.minThreshold)];
        if (sevA !== sevB) return sevA - sevB;
        const thrA = a.minThreshold || 1;
        const thrB = b.minThreshold || 1;
        return a.currentQty / thrA - b.currentQty / thrB;
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

  const openRelease = (item: ConsumableItem, lot?: PurchaseLot | null) => {
    setActionError(null);
    setReleaseState({ isOpen: true, item, lot: lot ?? null });
  };

  const handleSaveConsumable = async (itemData: Partial<ConsumableItem>) => {
    setActionError(null);
    try {
      if (addEditState.item) {
        await updateMutation.mutateAsync({
          id: addEditState.item.id,
          payload: {
            name: itemData.name,
            category: itemData.category,
            unit: itemData.unit,
            minThreshold: itemData.minThreshold,
            location: itemData.location,
            supplier:
              itemData.supplier === undefined
                ? undefined
                : itemData.supplier || null,
            notes: itemData.notes,
          },
        });
      } else {
        const created = await createMutation.mutateAsync({
          itemCode: itemData.itemCode,
          name: itemData.name || "New Supply Item",
          category: itemData.category || "",
          unit: itemData.unit || "reams",
          currentQty: itemData.currentQty ?? 0,
          minThreshold: itemData.minThreshold ?? 15,
          location: itemData.location || "Supply Storage",
          supplier: itemData.supplier || undefined,
          notes: itemData.notes,
        });
        setSelectedId(created.id);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to save consumable."
      );
      throw err;
    }
  };

  const handleConfirmRestock = async (input: {
    itemId: string;
    qtyReceived: number;
    unitCost: number;
    supplierId?: string | null;
    notes?: string;
  }) => {
    setActionError(null);
    try {
      await restockMutation.mutateAsync({
        id: input.itemId,
        payload: {
          quantity: input.qtyReceived,
          unitCost: input.unitCost,
          supplierId: input.supplierId,
          notes: input.notes,
        },
      });
      setSelectedId(input.itemId);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Restock failed."
      );
      throw err;
    }
  };

  const handleConfirmAdjust = async (
    itemId: string,
    adjustmentDelta: number,
    reason: string,
    notes?: string
  ) => {
    setActionError(null);
    try {
      await adjustMutation.mutateAsync({
        id: itemId,
        payload: {
          quantityChange: adjustmentDelta,
          reason,
          notes,
        },
      });
      setSelectedId(itemId);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Adjustment failed."
      );
      throw err;
    }
  };

  const handleConfirmRelease = async (input: ReleaseFromLotInput) => {
    setActionError(null);
    await releaseMutation.mutateAsync(input);
    if (releaseState.item) {
      setSelectedId(releaseState.item.id);
    }
  };

  return (
    <div
      className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md"
      data-theme="light"
    >
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
          <p className="text-xs text-text-secondary mt-0.5 max-w-xl">
            Non-serialized stock (paper, ink, cleaning). Multi-supplier lots
            hold unit cost; release via lot QR for accountable issue logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (selectedItem) openRelease(selectedItem);
              else if (filteredItems[0]) openRelease(filteredItems[0]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-bg text-text hover:border-primary transition-colors cursor-pointer"
          >
            <PackageMinus className="h-4 w-4 text-primary" />
            <span>Release from lot</span>
          </button>

          <button
            type="button"
            onClick={() => setRestockState({ isOpen: true, item: null })}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-bg text-text hover:border-primary transition-colors cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 text-accent" />
            <span>Restock</span>
          </button>

          <button
            type="button"
            onClick={() => setAddEditState({ isOpen: true, item: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add supply item
          </button>

          <AssetViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {actionError && (
        <div className="px-4 md:px-6 py-2 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive shrink-0">
          {actionError}
        </div>
      )}

      <ConsumableFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={items.length}
        filteredCount={filteredItems.length}
      />

      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        {viewMode === "grid" ? (
          <ConsumableGrid
            items={filteredItems}
            loading={isLoading}
            onSelect={(item) => setSelectedId(item.id)}
            onRestock={(item) => setRestockState({ isOpen: true, item })}
            onAdjust={(item) => setAdjustState({ isOpen: true, item })}
          />
        ) : (
          <ConsumableTable
            items={filteredItems}
            loading={isLoading}
            onSelect={(item) => setSelectedId(item.id)}
            onRestock={(item) => setRestockState({ isOpen: true, item })}
            onAdjust={(item) => setAdjustState({ isOpen: true, item })}
          />
        )}
      </main>

      <ConsumableDetailPanel
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedId(null)}
        onRestock={(item) => setRestockState({ isOpen: true, item })}
        onAdjust={(item) => setAdjustState({ isOpen: true, item })}
        onRelease={(item, lot) => openRelease(item, lot)}
        onEdit={(item) => setAddEditState({ isOpen: true, item })}
      />

      <AddEditConsumableDialog
        isOpen={addEditState.isOpen}
        initialItem={addEditState.item}
        onClose={() => setAddEditState({ isOpen: false, item: null })}
        onSave={handleSaveConsumable}
      />

      <RestockDialog
        item={restockState.item}
        allItems={items}
        suppliers={suppliers}
        isOpen={restockState.isOpen}
        onClose={() => setRestockState({ isOpen: false, item: null })}
        onConfirmRestock={handleConfirmRestock}
      />

      <AdjustStockDialog
        item={adjustState.item}
        isOpen={adjustState.isOpen}
        onClose={() => setAdjustState({ isOpen: false, item: null })}
        onConfirmAdjust={handleConfirmAdjust}
      />

      <ReleaseFromLotDialog
        isOpen={releaseState.isOpen}
        item={releaseState.item}
        lots={releaseLots}
        initialLot={releaseState.lot}
        isSubmitting={releaseMutation.isPending}
        onClose={() =>
          setReleaseState({ isOpen: false, item: null, lot: null })
        }
        onConfirm={handleConfirmRelease}
      />
    </div>
  );
}
