"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AuditLogsLayout } from "@/components/audit-logs/audit-logs-layout";
import { AssetsAuditList } from "@/components/audit-logs/assets-audit-list";
import { ConsumablesAuditList } from "@/components/audit-logs/consumables-audit-list";
import { BorrowRequestsList } from "@/components/audit-logs/borrow-requests-list";
import { RequisitionsList } from "@/components/audit-logs/requisitions-list";
import { PurchaseOrdersList } from "@/components/audit-logs/purchase-orders-list";
import { GeneralAuditList } from "@/components/audit-logs/general-audit-list";
import { AuditQuickCodeLookup } from "@/components/audit-logs/audit-quick-code-lookup";
import { useAssetsQuery } from "@/features/assets/client";
import { useConsumablesQuery } from "@/features/consumables/client/use-consumables";
import { useBorrowRequests } from "@/features/borrow-requests/client/use-borrow-requests";
import { useConsumableRequestsAuditQuery } from "@/features/audit-logs/client/use-audit-logs";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client/use-purchase-lots";

export type AuditLogTab =
  | "assets"
  | "consumables"
  | "requests"
  | "requisitions"
  | "purchaseOrders"
  | "general";

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<AuditLogTab>("assets");

  const { data: assets = [] } = useAssetsQuery();
  const { data: consumableResponse } = useConsumablesQuery({ limit: 100 });
  const consumables = consumableResponse?.data || [];
  const { data: requestsResponse } = useBorrowRequests({ limit: 1 });
  const { data: requisitions = [] } = useConsumableRequestsAuditQuery();
  const { data: purchaseLots = [] } = usePurchaseLotsQuery();

  const totalEntries = assets.length + consumables.length;

  return (
    <div className="flex flex-col h-full bg-bg-subtle min-h-0">
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
              Immutable lifecycle trails for assets, supplies, requests, and stock movements.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-subtle border border-border">
              <span className="h-2 w-2 rounded-full bg-status-active-bg animate-pulse" />
              <span className="text-text-secondary">Inventory Audit Sync:</span>
              <strong className="text-text">Active</strong>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <AuditQuickCodeLookup />
        </div>
      </div>

      <AuditLogsLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          assets: assets.length,
          consumables: consumables.length,
          requests: requestsResponse?.meta.total,
          requisitions: requisitions.length,
          purchaseOrders: purchaseLots.length,
        }}
      >
        {activeTab === "assets" && <AssetsAuditList />}
        {activeTab === "consumables" && <ConsumablesAuditList />}
        {activeTab === "requests" && <BorrowRequestsList />}
        {activeTab === "requisitions" && <RequisitionsList />}
        {activeTab === "purchaseOrders" && <PurchaseOrdersList />}
        {activeTab === "general" && <GeneralAuditList />}
      </AuditLogsLayout>
    </div>
  );
}
