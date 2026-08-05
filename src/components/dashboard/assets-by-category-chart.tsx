"use client";

import { BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AssetCategory = "transport" | "computing" | "av" | "furniture";

export interface CategoryCount {
  category: AssetCategory;
  label: string;
  count: number;
}

export interface AssetsByCategoryChartProps {
  data: CategoryCount[];
  loading?: boolean;
}

// ─── Category tokens ─────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<
  AssetCategory,
  { bg: string; text: string; cssVar: string }
> = {
  transport: {
    bg:     "bg-category-transport-bg",
    text:   "text-category-transport-text",
    cssVar: "var(--category-transport-bg)",
  },
  computing: {
    bg:     "bg-category-computing-bg",
    text:   "text-category-computing-text",
    cssVar: "var(--category-computing-bg)",
  },
  av: {
    bg:     "bg-category-av-bg",
    text:   "text-category-av-text",
    cssVar: "var(--category-av-bg)",
  },
  furniture: {
    bg:     "bg-category-furniture-bg",
    text:   "text-category-furniture-text",
    cssVar: "var(--category-furniture-bg)",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-border", className)}
      style={style}
      aria-hidden="true"
    />
  );
}

// Custom tooltip — typed as plain object to avoid recharts version variance
function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { label: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-md border border-border bg-bg px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-text">{item.payload.label}</p>
      <p className="text-sm font-bold tabular-nums text-text">
        {item.value} asset{item.value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AssetsByCategoryChart({ data, loading = false }: AssetsByCategoryChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <section
      className="flex flex-col rounded-lg border border-border bg-bg overflow-hidden"
      aria-labelledby="assets-by-category-heading"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 id="assets-by-category-heading" className="text-sm font-semibold text-text">
          Assets by Category
        </h2>
        {!loading && (
          <p className="text-xs text-text-secondary mt-0.5">
            {total.toLocaleString()} fixed assets total
          </p>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4">
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-8" />
                </div>
                <Skeleton className="h-7 rounded-md" style={{ width: `${60 + i * 10}%` }} />
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <BarChart2 className="h-8 w-8 text-border" />
            <p className="text-sm text-text-secondary">No asset data to display yet.</p>
          </div>
        ) : (
          <>
            <div aria-hidden="true">
              <ResponsiveContainer width="100%" height={data.length * 52}>
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={80}
                    tick={{ fontSize: 12, fill: "var(--color-text-secondary)", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-bg-subtle)" }} />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    label={{ position: "right", fontSize: 11, fill: "var(--color-text-secondary)", fontWeight: 600 }}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_STYLES[entry.category].cssVar} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Accessible text summary */}
            <ul className="sr-only" aria-label="Asset count by category">
              {data.map((d) => (
                <li key={d.category}>{d.label}: {d.count} assets</li>
              ))}
            </ul>

            {/* Category pill legend */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              {data.map((d) => (
                <span
                  key={d.category}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    CATEGORY_STYLES[d.category].bg,
                    CATEGORY_STYLES[d.category].text,
                  )}
                >
                  {d.label}
                  <span className="tabular-nums font-bold">{d.count}</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
