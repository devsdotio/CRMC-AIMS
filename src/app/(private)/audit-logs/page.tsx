"use client";

/**
 * TEMP: Audit Logs UI is hidden. Writes are disabled in AuditLogRepository.create.
 * Restore the previous page contents to re-enable the screen.
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
