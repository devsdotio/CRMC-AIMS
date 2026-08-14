"use client";

import { useState } from "react";
import { ShieldCheck, QrCode } from "lucide-react";
import { AuditLogsLayout } from "@/components/audit-logs/audit-logs-layout";
import { AssetsAuditList } from "@/components/audit-logs/assets-audit-list";
import { ConsumablesAuditList } from "@/components/audit-logs/consumables-audit-list";
import { AuditQuickCodeLookup } from "@/components/audit-logs/audit-quick-code-lookup";
import { useAssetsQuery } from "@/features/assets/client";
import { useConsumablesQuery } from "@/features/consumables/client/use-consumables";

export type AuditLogTab = "assets" | "consumables";

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<AuditLogTab>("assets");

  // Query records for live count badges (1 entry per unique asset & consumable)
  const { data: assets = [] } = useAssetsQuery();
  const { data: consumableResponse } = useConsumablesQuery({ limit: 100 });
  const consumables = consumableResponse?.data || [];

  const totalEntries = assets.length + consumables.length;

  return (
    <div className="flex flex-col h-full bg-bg-subtle min-h-0">
      {/* Top Banner Header with Quick Code Search */}
      <div className="px-4 md:px-6 pt-5 pb-4 bg-bg shrink-0 border-b border-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                Inventory & Lifecycle Audit Logs
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-accent/10 text-accent rounded-full border border-accent/20">
                {totalEntries} tracked inventory units
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Complete immutable lifecycle audit trails for capital assets and consumable inventory stock movements.
            </p>
          </div>

          {/* Quick Status Tag */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-subtle border border-border">
              <span className="h-2 w-2 rounded-full bg-status-active-bg animate-pulse" />
              <span className="text-text-secondary">Inventory Audit Sync:</span>
              <strong className="text-text">Active</strong>
            </div>
          </div>
        </div>

        {/* Global Quick Code Lookup Bar */}
        <div className="pt-1">
          <AuditQuickCodeLookup />
        </div>
      </div>

      {/* Main Tabbed Layout Container */}
      <AuditLogsLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          assets: assets.length,
          consumables: consumables.length,
        }}
      >
        {activeTab === "assets" && <AssetsAuditList />}
        {activeTab === "consumables" && <ConsumablesAuditList />}
      </AuditLogsLayout>
    </div>
  );
}
