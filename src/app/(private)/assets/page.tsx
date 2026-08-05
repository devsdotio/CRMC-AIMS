"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import type { Asset, ViewMode, AssetFilterState } from "@/components/assets/types";
import { INITIAL_MOCK_ASSETS } from "@/components/assets/mock-data";
import { AssetFilters } from "@/components/assets/asset-filters";
import { AssetViewToggle } from "@/components/assets/asset-view-toggle";
import { AssetGrid } from "@/components/assets/asset-grid";
import { AssetTable } from "@/components/assets/asset-table";
import { AssetDetailPanel } from "@/components/assets/asset-detail-panel";
import { AddEditAssetDialog } from "@/components/assets/add-edit-asset-dialog";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_MOCK_ASSETS);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isLoading, setIsLoading] = useState(true);

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

  // Initial load simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter & Sort Assets
  const filteredAssets = useMemo(() => {
    const result = assets.filter((asset) => {
      // 1. Search Query
      if (filters.searchQuery.trim()) {
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

  const handleSaveAsset = (assetData: Partial<Asset>) => {
    if (addEditState.asset) {
      // Edit
      setAssets((prev) =>
        prev.map((item) => (item.id === assetData.id ? ({ ...item, ...assetData } as Asset) : item))
      );
      if (selectedAsset?.id === assetData.id) {
        setSelectedAsset((prev) => (prev ? ({ ...prev, ...assetData } as Asset) : null));
      }
    } else {
      // Create
      const newAsset: Asset = {
        id: assetData.id || `ast-${Date.now()}`,
        assetCode: assetData.assetCode || "CP-999",
        name: assetData.name || "New Asset",
        category: assetData.category || "computing",
        status: assetData.status || "active",
        serialNumber: assetData.serialNumber,
        location: assetData.location || "Central Storage",
        department: assetData.department,
        purchaseDate: assetData.purchaseDate,
        value: assetData.value,
        notes: assetData.notes,
        lastUpdated: new Date().toISOString().split("T")[0],
        maintenanceHistory: [],
      };
      setAssets((prev) => [newAsset, ...prev]);
    }
  };

  const handleMarkMaintenance = (asset: Asset) => {
    setAssets((prev) =>
      prev.map((item) => {
        if (item.id !== asset.id) return item;
        return {
          ...item,
          status: "needs_repair",
          lastUpdated: new Date().toISOString().split("T")[0],
          maintenanceHistory: [
            ...item.maintenanceHistory,
            {
              id: `m-${Date.now()}`,
              date: new Date().toISOString().split("T")[0],
              type: "flagged",
              description: "Flagged for maintenance inspection by Custodian.",
              technician: "Property Custodian",
            },
          ],
        };
      })
    );
    if (selectedAsset?.id === asset.id) {
      setSelectedAsset((prev) => (prev ? { ...prev, status: "needs_repair" } : null));
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
        onMarkMaintenance={handleMarkMaintenance}
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
