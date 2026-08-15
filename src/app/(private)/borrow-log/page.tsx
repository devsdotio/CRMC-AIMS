"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Repeat, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import { OverdueBadge } from "@/components/ui/overdue-badge";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { ReturnLogDialog } from "@/components/borrow-log/return-log-dialog";
import { useToast } from "@/components/providers/toast-context";
import {
  useBorrowLogQuery,
  useReturnBorrowMutation,
  type BorrowLogRecord,
} from "@/features/borrow-log/client";

type LogTab = "all" | "active" | "overdue" | "returned";

const TABS: { id: LogTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "overdue", label: "Overdue" },
  { id: "returned", label: "Returned" },
];

function BorrowLogContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const initialTab: LogTab =
    filterParam === "overdue" ||
    filterParam === "active" ||
    filterParam === "returned"
      ? filterParam
      : "all";

  const [tab, setTab] = useState<LogTab>(initialTab);
  const [search, setSearch] = useState("");
  const [returnTarget, setReturnTarget] = useState<BorrowLogRecord | null>(null);
  const toast = useToast();

  const {
    data: records = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useBorrowLogQuery(
    tab === "all" ? undefined : { status: tab }
  );
  const returnMutation = useReturnBorrowMutation();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((row) => {
      return (
        row.assetName.toLowerCase().includes(q) ||
        row.assetCode.toLowerCase().includes(q) ||
        row.borrowerName.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q) ||
        row.logCode.toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  const handleReturn = async (payload: {
    condition: "good" | "damaged" | "needs_repair";
    conditionNotes?: string;
    flagMaintenance?: boolean;
  }) => {
    if (!returnTarget) return;
    try {
      await returnMutation.mutateAsync({
        id: returnTarget.id,
        payload,
      });
      toast.success(`${returnTarget.assetCode} marked returned.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record return.");
      throw err;
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md">
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 border-b border-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
                <Repeat className="h-5 w-5 text-accent" />
                Borrow & Return Log
              </h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
                {filtered.length} records
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Active custody, overdue returns, and completed borrow transactions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-border p-1 bg-bg-subtle">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md",
                  tab === item.id
                    ? "bg-bg text-text shadow-xs"
                    : "text-text-secondary hover:text-text"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search asset, borrower, or log code"
              className="w-full h-9 pl-8 pr-3 text-xs bg-bg border border-border rounded-lg"
            />
          </div>
        </div>
      </div>

      {isError && (
        <QueryErrorBanner
          message={error?.message || "Failed to load borrow log."}
          onRetry={() => void refetch()}
        />
      )}

      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-text">No borrow records</p>
            <p className="text-xs text-text-secondary mt-1">
              Released assets will appear here until they are returned.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-subtle border-b border-border">
              <tr>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Asset
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Borrower
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary hidden md:table-cell">
                  Due
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
                <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((row) => {
                const category = getCategoryStyle(row.category);
                return (
                  <tr key={row.id} className="hover:bg-bg-subtle/60">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-text">{row.assetName}</p>
                      <p className="text-xs font-mono text-text-secondary">
                        {row.assetCode}
                        <span className="mx-1.5 opacity-40">·</span>
                        {category.label}
                      </p>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-text">{row.borrowerName}</p>
                      <p className="text-xs text-text-secondary">{row.department}</p>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-text-secondary hidden md:table-cell">
                      {row.dueDate}
                    </td>
                    <td className="px-3 py-3.5">
                      {row.status === "overdue" ? (
                        <OverdueBadge daysOverdue={row.daysOverdue ?? 1} />
                      ) : (
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            row.status === "active"
                              ? "bg-status-active-bg/15 text-status-active-text border-status-active-bg/30"
                              : "bg-bg-subtle text-text-secondary border-border"
                          )}
                        >
                          {row.status === "returned" ? "Returned" : "Active"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {row.status !== "returned" && (
                        <button
                          type="button"
                          onClick={() => setReturnTarget(row)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-primary hover:text-text text-text-secondary"
                        >
                          Record return
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>

      <ReturnLogDialog
        record={returnTarget}
        isOpen={Boolean(returnTarget)}
        onClose={() => setReturnTarget(null)}
        onConfirm={handleReturn}
      />
    </div>
  );
}

export default function BorrowLogPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-xs text-text-secondary">
          Loading borrow log…
        </div>
      }
    >
      <BorrowLogContent />
    </Suspense>
  );
}
