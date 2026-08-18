"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { History, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { QueryErrorBanner } from "@/components/shared/query-error-banner";
import { formatPhp } from "@/components/projects/format-money";
import { useBorrowLogQuery } from "@/features/borrow-log/client";
import {
  useStockMovementsQuery,
  type StockMovement,
} from "@/features/stock-movements/client";
import type { BorrowLogRecord } from "@/features/borrow-log/client";

type KindTab = "all" | "asset" | "supply";

const TABS: { id: KindTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "asset", label: "Assets" },
  { id: "supply", label: "Supplies" },
];

type HistoryRow = {
  id: string;
  code: string;
  kind: "asset" | "supply";
  itemLabel: string;
  itemCode: string;
  destination: string;
  qtyLabel: string;
  when: string;
  actor: string;
  source?: string;
  extra?: string;
};

function assetRow(row: BorrowLogRecord): HistoryRow {
  return {
    id: `asset-${row.id}`,
    code: row.logCode,
    kind: "asset",
    itemLabel: row.assetName,
    itemCode: row.assetCode,
    destination: row.department,
    qtyLabel: row.custodyKind === "assignment" ? "Assigned" : "Borrowed",
    when: row.releasedAt,
    actor: row.releasedBy,
    source:
      row.source === "admin_manual"
        ? "Manual"
        : row.source === "project_legacy"
          ? "Project"
          : "Portal",
    extra: row.requestCode || undefined,
  };
}

function supplyRow(row: StockMovement): HistoryRow {
  const signed = row.direction === "out" ? `−${row.qty}` : `+${row.qty}`;
  return {
    id: `mov-${row.id}`,
    code: row.movementCode,
    kind: "supply",
    itemLabel: row.itemName ?? "Consumable",
    itemCode: row.itemCode ?? "",
    destination: row.destinationLabel ?? "—",
    qtyLabel: `${signed}${row.unit ? ` ${row.unit}` : ""}`,
    when: row.createdAt,
    actor: row.actorName,
    source: row.reason === "issue" ? "Issue" : row.reason,
    extra: row.lotCode
      ? `${row.lotCode}${row.lineTotal ? ` · ${formatPhp(Number(row.lineTotal))}` : ""}`
      : row.lineTotal
        ? formatPhp(Number(row.lineTotal))
        : undefined,
  };
}

function IssueHistoryContent() {
  const searchParams = useSearchParams();
  const kindParam = searchParams.get("kind");
  const itemParam = searchParams.get("item") ?? "";
  const initialKind: KindTab =
    kindParam === "asset" || kindParam === "supply" ? kindParam : "all";

  const [tab, setTab] = useState<KindTab>(initialKind);
  const [search, setSearch] = useState(itemParam);

  const {
    data: assetLogs = [],
    isLoading: loadingAssets,
    isError: assetError,
    error: assetErr,
    refetch: refetchAssets,
  } = useBorrowLogQuery();
  const {
    data: movements = [],
    isLoading: loadingMoves,
    isError: moveError,
    error: moveErr,
    refetch: refetchMoves,
  } = useStockMovementsQuery({ reason: "issue", limit: 200 });

  const rows = useMemo(() => {
    const assets = assetLogs.map(assetRow);
    const supplies = movements.map(supplyRow);
    const merged =
      tab === "asset" ? assets : tab === "supply" ? supplies : [...assets, ...supplies];
    merged.sort((a, b) => b.when.localeCompare(a.when));
    const q = search.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.itemLabel.toLowerCase().includes(q) ||
        r.itemCode.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        (r.extra ?? "").toLowerCase().includes(q)
    );
  }, [assetLogs, movements, tab, search]);

  const loading = loadingAssets || loadingMoves;

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-bg-subtle rounded-md">
      <div className="px-4 md:px-6 pt-5 pb-3 bg-bg shrink-0 border-b border-border space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              Issue history
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold bg-bg-subtle text-text-secondary rounded-full border border-border">
              {rows.length} records
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Asset custody codes (<span className="font-mono">LOG-</span>) and
            supply movement codes (<span className="font-mono">MOV-</span>).
          </p>
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
              placeholder="Search code, item, or destination"
              className="w-full h-9 pl-8 pr-3 text-xs bg-bg border border-border rounded-lg"
            />
          </div>
        </div>
      </div>

      {(assetError || moveError) && (
        <QueryErrorBanner
          message={
            assetErr?.message ||
            moveErr?.message ||
            "Failed to load issue history."
          }
          onRetry={() => {
            void refetchAssets();
            void refetchMoves();
          }}
        />
      )}

      <main className="flex-1 overflow-y-auto min-h-0 bg-bg">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-border" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-semibold text-text">No issues yet</p>
            <p className="text-xs text-text-secondary mt-1">
              Portal releases and admin manual issues appear here with their
              transaction codes.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-subtle border-b border-border">
              <tr>
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Code
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Item
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  Destination
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary hidden md:table-cell">
                  Qty / kind
                </th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary hidden lg:table-cell">
                  When
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-bg-subtle/60">
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-xs font-semibold text-text">
                      {row.code}
                    </p>
                    <p className="text-[10px] text-text-secondary">
                      {row.kind === "asset" ? "Asset" : "Supply"}
                      {row.source ? ` · ${row.source}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-medium text-text">{row.itemLabel}</p>
                    <p className="text-xs font-mono text-text-secondary">
                      {row.itemCode}
                      {row.extra ? ` · ${row.extra}` : ""}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-text">
                    {row.destination}
                    <p className="text-[10px] text-text-secondary mt-0.5">
                      {row.actor}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-text-secondary hidden md:table-cell">
                    {row.qtyLabel}
                  </td>
                  <td className="px-3 py-3.5 text-xs text-text-secondary hidden lg:table-cell">
                    {new Date(row.when).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default function IssueHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center text-xs text-text-secondary">
          Loading issue history…
        </div>
      }
    >
      <IssueHistoryContent />
    </Suspense>
  );
}
