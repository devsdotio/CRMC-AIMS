"use client";

import { useState } from "react";
import { AuditLogsLayout } from "@/components/audit-logs/audit-logs-layout";
import { GeneralAuditList } from "@/components/audit-logs/general-audit-list";
import { BorrowRequestsList } from "@/components/audit-logs/borrow-requests-list";
import { RequisitionsList } from "@/components/audit-logs/requisitions-list";
import { PurchaseOrdersList } from "@/components/audit-logs/purchase-orders-list";

export type AuditLogTab = "borrow-requests" | "general" | "requisitions" | "purchase-orders";

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<AuditLogTab>("borrow-requests");

  return (
    <div className="flex flex-col h-full bg-bg-subtle min-h-0" data-theme="light">
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-text">Audit Logs</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          View system audit history, including borrow requests, general activity, requisitions, and purchase orders.
        </p>
      </div>

      <AuditLogsLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === "borrow-requests" && <BorrowRequestsList />}
        {activeTab === "general" && <GeneralAuditList />}
        {activeTab === "requisitions" && <RequisitionsList />}
        {activeTab === "purchase-orders" && <PurchaseOrdersList />}
      </AuditLogsLayout>
    </div>
  );
}
