"use client";

import {
  Package,
  DollarSign,
  Repeat,
  AlertTriangle,
  Wrench,
  PieChart,
  BarChart2,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

export function OverviewReportView() {
  return (
    <div className="space-y-6">
      {/* ── Summary Cards Grid ──────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-3">
          ANALYTICS SUMMARY OVERVIEW
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total Assets"
            value={1420}
            contextLine="Across all departments"
            icon={Package}
            variant="default"
          />
          <StatCard
            label="Total Valuation"
            value={12850000}
            contextLine="₱12.85M total asset value"
            icon={DollarSign}
            variant="default"
          />
          <StatCard
            label="Active Borrowings"
            value={42}
            contextLine="Items currently checked out"
            icon={Repeat}
            variant="default"
          />
          <StatCard
            label="Overdue Items"
            value={3}
            contextLine="Past return date"
            icon={AlertTriangle}
            variant="danger"
          />
          <StatCard
            label="Items Needing Maintenance"
            value={5}
            contextLine="Pending service or repair"
            icon={Wrench}
            variant="warning"
          />
        </div>
      </div>

      {/* ── Analytics Visual Breakdown Grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category & Department Asset Distribution */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-accent" />
              <div>
                <h3 className="text-sm font-bold text-text">Asset Distribution by Category & Dept</h3>
                <p className="text-xs text-text-secondary">Quantity and percentage breakdown</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-text-secondary bg-bg-subtle px-2 py-0.5 rounded border border-border">
              1,420 Items
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Computing & IT (45%)</span>
                <span>639 items</span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
                <div className="h-full bg-primary rounded-full w-[45%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>AV Equipment (25%)</span>
                <span>355 items</span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
                <div className="h-full bg-accent rounded-full w-[25%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Lab Tools & Equipment (20%)</span>
                <span>284 items</span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
                <div className="h-full bg-status-active-bg rounded-full w-[20%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Furniture & Fixtures (10%)</span>
                <span>142 items</span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-subtle overflow-hidden">
                <div className="h-full bg-status-repair-bg rounded-full w-[10%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Condition Breakdown */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-status-active-bg" />
              <div>
                <h3 className="text-sm font-bold text-text">Asset Condition Breakdown</h3>
                <p className="text-xs text-text-secondary">Good vs Fair vs Poor vs Damaged</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-status-active-bg/30 bg-status-active-bg/10 text-center">
              <span className="text-[11px] font-bold text-status-active-text block uppercase">Good Condition</span>
              <span className="text-2xl font-mono font-extrabold text-status-active-text">78%</span>
              <span className="text-[10px] text-text-secondary block mt-0.5">1,107 items operational</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-bg-subtle text-center">
              <span className="text-[11px] font-bold text-text-secondary block uppercase">Fair Condition</span>
              <span className="text-2xl font-mono font-extrabold text-text">14%</span>
              <span className="text-[10px] text-text-secondary block mt-0.5">199 items slight wear</span>
            </div>

            <div className="p-3.5 rounded-lg border border-status-repair-bg/30 bg-status-repair-bg/10 text-center">
              <span className="text-[11px] font-bold text-status-repair-text block uppercase">Poor / Maintenance</span>
              <span className="text-2xl font-mono font-extrabold text-status-repair-text">5%</span>
              <span className="text-[10px] text-text-secondary block mt-0.5">71 items service due</span>
            </div>

            <div className="p-3.5 rounded-lg border border-status-outofservice-bg/30 bg-status-outofservice-bg/10 text-center">
              <span className="text-[11px] font-bold text-status-outofservice-bg block uppercase">Damaged / Condemned</span>
              <span className="text-2xl font-mono font-extrabold text-status-outofservice-bg">3%</span>
              <span className="text-[10px] text-text-secondary block mt-0.5">43 items written off</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
