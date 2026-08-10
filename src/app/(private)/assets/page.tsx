"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { 
  useAssetsQuery, 
  useCreateAssetMutation, 
  useUpdateAssetMutation 
} from "@/features/assets/client/use-assets";
import type { Asset, ViewMode, AssetFilterState, AssetStatus } from "@/types/assets";
import { AssetFilters } from "@/components/assets/asset-filters";
import { AssetViewToggle } from "@/components/assets/asset-view-toggle";
import { AssetGrid } from "@/components/assets/asset-grid";
import { AssetTable } from "@/components/assets/asset-table";
import { AssetDetailPanel } from "@/components/assets/asset-detail-panel";
import { AddEditAssetDialog } from "@/components/assets/add-edit-asset-dialog";

export default function AssetsPage() {
  const { data: assets = [], isLoading } = useAssetsQuery();
  const createMutation = useCreateAssetMutation();
  const updateMutation = useUpdateAssetMutation();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filter & Sort State
  const [filters, setFilters] = useState<AssetFilterState>({
    searchQuery: "",
    categories: [],
    statuses: [],
    sortBy: "name",
    sortOrder: "asc",
  });

  // Modal / Drawer States
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [addEditState, setAddEditState] = useState<{ isOpen: boolean; asset: Asset | null }>({
    isOpen: false,
    asset: null,
  });

  // Filter & Sort Assets
  const filteredAssets = useMemo(() => {
    const result = assets.filter((asset) => {
      // 1. Search Query
      if (filters.searchQuery?.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = asset.name.toLowerCase().includes(query);
        const matchCode = asset.assetCode.toLowerCase().includes(query);
        const matchSerial = asset.serialNumber?.toLowerCase().includes(query) ?? false;
        if (!matchName && !matchCode && !matchSerial) return false;
      }

      // 2. Category Filter (multi-select)
      if (filters.categories.length > 0 && !filters.categories.includes(asset.category)) {
        return false;
      }

      // 3. Status Filter (multi-select)
      if (filters.statuses.length > 0 && !filters.statuses.includes(asset.status)) {
        return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (filters.sortBy === "code") {
        return a.assetCode.localeCompare(b.assetCode);
      }
      if (filters.sortBy === "date") {
        return b.lastUpdated.localeCompare(a.lastUpdated);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [assets, filters]);

  // Handlers
  const handleFilterChange = (updated: Partial<AssetFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      categories: [],
      statuses: [],
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  const handleSaveAsset = async (assetData: Partial<Asset>) => {
    if (addEditState.asset) {
      // Edit
      await updateMutation.mutateAsync({
        id: addEditState.asset.id,
        payload: {
          name: assetData.name,
          category: assetData.category,
          status: assetData.status,
          assignmentType: assetData.assignmentType as
            | "borrowable"
            | "assignable"
            | undefined,
          serialNumber: assetData.serialNumber,
          location: assetData.location,
          department: assetData.department,
          purchaseDate: assetData.purchaseDate,
          value: assetData.value,
          notes: assetData.notes,
        },
      });
      if (selectedAsset?.id === addEditState.asset.id) {
        setSelectedAsset(null);
      }
    } else {
      // Create
      await createMutation.mutateAsync({
        assetCode: assetData.assetCode || `ASSET-${Date.now()}`,
        name: assetData.name || "New Asset",
        category: (assetData.category as string) || "",
        status: (assetData.status as AssetStatus) || "active",
        assignmentType:
          (assetData.assignmentType as "borrowable" | "assignable") ||
          "borrowable",
        serialNumber: assetData.serialNumber,
        location: assetData.location || "Central Storage",
        department: assetData.department,
        purchaseDate: assetData.purchaseDate,
        value: assetData.value,
        notes: assetData.notes,
      });
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text">
              Institutional Assets Registry
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {filteredAssets.length} of {assets.length} items
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Fixed-asset registry for QR-tagged capital equipment, AV gear, vehicles, and furniture.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddEditState({ isOpen: true, asset: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add Asset
          </button>

          <AssetViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* ── Filters Row ───────────────────────────────────────────────── */}
      <AssetFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalAssetsCount={assets.length}
        filteredAssetsCount={filteredAssets.length}
      />

      {/* ── Internal Scrollable Main Content Region ───────────────────── */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        {viewMode === "grid" ? (
          <AssetGrid
            assets={filteredAssets}
            loading={isLoading}
            onSelect={setSelectedAsset}
          />
        ) : (
          <AssetTable
            assets={filteredAssets}
            loading={isLoading}
            onSelect={setSelectedAsset}
          />
        )}
      </main>

      {/* ── Asset Detail Slide-over Panel ─────────────────────────────── */}
      <AssetDetailPanel
        asset={selectedAsset}
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        onEdit={(asset) => {
          setSelectedAsset(null);
          setAddEditState({ isOpen: true, asset });
        }}
      />

      {/* ── Add / Edit Asset Dialog ───────────────────────────────────── */}
      <AddEditAssetDialog
        isOpen={addEditState.isOpen}
        initialAsset={addEditState.asset}
        onClose={() => setAddEditState({ isOpen: false, asset: null })}
        onSave={handleSaveAsset}
      />
    </div>
  );
}
