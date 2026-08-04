"use client";

import { useState, useMemo } from "react";
import type { SimpleReportCategory, SimpleReportFilterState, SimpleUserRole } from "@/components/reports/types";
import {
  MOCK_SIMPLE_ASSETS,
  MOCK_SIMPLE_BORROWINGS,
  MOCK_SIMPLE_FREQUENT_BORROWED,
  MOCK_SIMPLE_MAINTENANCE,
  MOCK_SIMPLE_DAMAGED_LOST,
  MOCK_SIMPLE_ACQUISITIONS,
  MOCK_SIMPLE_DISPOSALS,
} from "@/components/reports/mock-data";

import { ReportsHeader } from "@/components/reports/reports-header";
import { ReportsFiltersBar } from "@/components/reports/reports-filters-bar";
import { ReportsNavTabs } from "@/components/reports/reports-nav-tabs";
import { ExportModal } from "@/components/reports/export-modal";

import { OverviewReportView } from "@/components/reports/views/overview-report-view";
import { AssetInventoryView } from "@/components/reports/views/asset-inventory-view";
import { BorrowingReportView } from "@/components/reports/views/borrowing-report-view";
import { MaintenanceReportView } from "@/components/reports/views/maintenance-report-view";
import { ProcurementReportView } from "@/components/reports/views/procurement-report-view";
import { DisposalReportView } from "@/components/reports/views/disposal-report-view";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<SimpleReportCategory>("overview");
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Global Report Filter State
  const [filters, setFilters] = useState<SimpleReportFilterState>({
    dateRange: "cy-2026",
    department: "all",
    category: "all",
    status: "all",
    searchQuery: "",
    roleView: "admin",
  });

  const generatedTimestamp = "2026-07-31 09:18 AM PST";
  const currentUserOfficer = "Dave Custodio (Property Custodian Admin)";

  const handleFilterChange = (updated: Partial<SimpleReportFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      department: "all",
      category: "all",
      status: "all",
      searchQuery: "",
    }));
  };

  // Filtered Assets Dataset
  const filteredAssets = useMemo(() => {
    return MOCK_SIMPLE_ASSETS.filter((ast) => {
      if (filters.department !== "all" && ast.department !== filters.department) return false;
      if (filters.category !== "all" && ast.category !== filters.category) return false;
      if (filters.status !== "all" && ast.status !== filters.status) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTag = ast.tagNumber.toLowerCase().includes(q);
        const matchName = ast.name.toLowerCase().includes(q);
        const matchSerial = ast.serialNumber.toLowerCase().includes(q);
        if (!matchTag && !matchName && !matchSerial) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md" data-theme="light">
      {/* Top Header Banner */}
      <ReportsHeader
        generatedAt={generatedTimestamp}
        generatedBy={currentUserOfficer}
        roleView={filters.roleView}
        onRoleChange={(roleView: SimpleUserRole) => setFilters((prev) => ({ ...prev, roleView }))}
        onExportClick={() => setExportModalOpen(true)}
      />

      {/* Global Filters Control Bar */}
      <ReportsFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* 6-Category Navigation Tabs */}
      <ReportsNavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Scrollable View Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0 bg-bg">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && <OverviewReportView />}

          {activeTab === "asset-inventory" && (
            <AssetInventoryView assets={filteredAssets} />
          )}

          {activeTab === "borrowing" && (
            <BorrowingReportView logs={MOCK_SIMPLE_BORROWINGS} frequent={MOCK_SIMPLE_FREQUENT_BORROWED} />
          )}

          {activeTab === "maintenance" && (
            <MaintenanceReportView maintenanceLogs={MOCK_SIMPLE_MAINTENANCE} damagedLogs={MOCK_SIMPLE_DAMAGED_LOST} />
          )}

          {activeTab === "procurement" && (
            <ProcurementReportView acquisitions={MOCK_SIMPLE_ACQUISITIONS} />
          )}

          {activeTab === "disposal" && (
            <DisposalReportView disposals={MOCK_SIMPLE_DISPOSALS} />
          )}
        </div>
      </main>

      {/* Official Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        activeTab={activeTab}
        roleView={filters.roleView}
        generatedAt={generatedTimestamp}
        generatedBy={currentUserOfficer}
      />
    </div>
  );
}
