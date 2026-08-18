"use client";

import { useState } from "react";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { ReleaseConsumableRequestDialog } from "@/components/consumable-requests/release-consumable-request-dialog";
import { useToast } from "@/components/providers/toast-context";
import { useAssetOperator } from "@/hooks/use-asset-operator";
import {
  useApproveConsumableRequestMutation,
  useCancelConsumableRequestMutation,
  useConsumableRequests,
  useRejectConsumableRequestMutation,
  useReleaseConsumableRequestMutation,
  type ConsumableRequest,
} from "@/features/consumable-requests/client";
import type { ReleaseConsumableRequestPayload } from "@/features/consumable-requests/client/consumable-requests-api";

export function SupplyRequestsQueue() {
  const { canOperate } = useAssetOperator();
  const toast = useToast();
  const [status, setStatus] = useState<
    ConsumableRequest["status"] | undefined
  >("pending");
  const [releaseTarget, setReleaseTarget] = useState<ConsumableRequest | null>(
    null
  );
  const { data, isLoading, isError, error, refetch } = useConsumableRequests({
    status,
    limit: 50,
  });
  const rows = data?.data ?? [];
  const approve = useApproveConsumableRequestMutation();
  const reject = useRejectConsumableRequestMutation();
  const cancel = useCancelConsumableRequestMutation();
  const release = useReleaseConsumableRequestMutation();

  const handleApprove = async (row: ConsumableRequest) => {
    try {
      await approve.mutateAsync({ id: row.id });
      toast.success(`${row.requestCode} approved.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approve failed.");
    }
  };

  const handleReject = async (row: ConsumableRequest) => {
    const reason = window.prompt("Rejection reason?");
    if (!reason?.trim()) return;
    try {
      await reject.mutateAsync({ id: row.id, reason: reason.trim() });
      toast.success(`${row.requestCode} rejected.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed.");
    }
  };

  const handleCancelApproved = async (row: ConsumableRequest) => {
    if (
      !window.confirm(
        `Cancel ${row.requestCode}? Reserved stock will be released back to available quantity.`
      )
    ) {
      return;
    }
    try {
      await cancel.mutateAsync({ id: row.id });
      toast.success(`${row.requestCode} cancelled. Reservation released.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancel failed.");
    }
  };
    row: ConsumableRequest,
    payload: ReleaseConsumableRequestPayload
  ) => {
    await release.mutateAsync({ id: row.id, payload });
    toast.success(`${row.requestCode} issued. Stock deducted.`);
    setReleaseTarget(null);
  };

  return (
    <>
      <div className="px-4 md:px-6 py-3 bg-bg border-b border-border flex flex-wrap gap-1.5 shrink-0">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["released", "Issued"],
            ["rejected", "Rejected"],
            ["cancelled", "Cancelled"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
              status === id
                ? "bg-bg-subtle border-primary text-text"
                : "border-border text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isError && (
        <QueryErrorBanner
          message={error?.message || "Failed to load supply requests."}
          onRetry={() => void refetch()}
        />
      )}

      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-border" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-sm text-text-secondary text-center">
            No supply requests in this status.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => (
              <li
                key={row.id}
                className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-text-secondary">
                    {row.requestCode}
                  </p>
                  <p className="text-sm font-semibold text-text">
                    {row.department} · {row.purpose}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {row.lines
                      .map((l) => `${l.itemName} × ${l.quantityRequested}`)
                      .join(", ")}
                  </p>
                </div>
                {canOperate && row.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleApprove(row)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-accent text-accent-foreground"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(row)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {canOperate && row.status === "approved" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setReleaseTarget(row)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground"
                    >
                      Issue…
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCancelApproved(row)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-border"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <ReleaseConsumableRequestDialog
        request={releaseTarget}
        isOpen={Boolean(releaseTarget)}
        onClose={() => setReleaseTarget(null)}
        onConfirm={handleReleaseConfirm}
      />
    </>
  );
}
