"use client";

/**
 * Audit Logs UI is unused. Operational history is Borrow Log + Issue History.
 * The audit_logs table is not written.
 */
export type AuditLogTab =
  | "assets"
  | "consumables"
  | "requests"
  | "requisitions"
  | "purchaseOrders"
  | "general";

export default function AuditLogsPage() {
  return (
    <div className="flex h-full items-center justify-center bg-bg-subtle p-6">
      <p className="text-sm text-text-secondary">
        Audit logs are temporarily disabled.
      </p>
    </div>
  );
}
