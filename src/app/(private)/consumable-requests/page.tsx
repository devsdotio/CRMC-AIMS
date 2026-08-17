"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { OperatorReadOnlyBanner } from "@/components/shared/operator-read-only-banner";
import { useToast } from "@/components/providers/toast-context";
import { useAssetOperator } from "@/hooks/use-asset-operator";
import {
  useApproveConsumableRequestMutation,
  useConsumableRequests,
  useRejectConsumableRequestMutation,
  useReleaseConsumableRequestMutation,
  type ConsumableRequest,
} from "@/features/consumable-requests/client";

export default function ConsumableRequestsPage() {
  const { canOperate } = useAssetOperator();
  const toast = useToast();
  const [status, setStatus] = useState<
    ConsumableRequest["status"] | undefined
  >("pending");
  const { data, isLoading, isError, error, refetch } = useConsumableRequests({
    status,
    limit: 50,
  });
  const rows = data?.data ?? [];
  const approve = useApproveConsumableRequestMutation();
  const reject = useRejectConsumableRequestMutation();
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

  const handleRelease = async (row: ConsumableRequest) => {
    const receivedBy =
      window.prompt("Received by (person who picked up)?")?.trim() ||
      row.department;
    try {
      await release.mutateAsync({
        id: row.id,
        payload: {
          receivedBy,
          lines: row.lines.map((line) => ({
            lineId: line.id,
            useFifo: true,
          })),
        },
      });
      toast.success(`${row.requestCode} released.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Release failed.");
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md">
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-accent" />
            Supply requests
          </h1>
        </div>
        <p className="text-xs text-text-secondary mt-0.5">
          Department portal requisitions. Approve, then release from on-hand lots (FIFO). Consumables are not returned.
        </p>
      </div>

      {!canOperate && <OperatorReadOnlyBanner />}

      <div className="px-4 md:px-6 py-3 bg-bg border-b border-border flex flex-wrap gap-1.5">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["released", "Released"],
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
              <li key={row.id} className="px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center gap-3">
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
                  <button
                    type="button"
                    onClick={() => void handleRelease(row)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground shrink-0"
                  >
                    Release (FIFO)
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
