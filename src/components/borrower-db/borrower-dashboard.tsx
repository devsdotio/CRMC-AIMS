"use client";

import { useState } from "react";

import {
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Calendar,
  Tag,
  ChevronRight,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import { useBorrowerPortal } from "./context";
import { RequisitionSlip } from "@/components/requisition-slip/RequisitionSlip";
import type {
  PortalSummaryStats,
  PortalBorrowRequest,
  PortalBorrowLogRecord,
} from "./types";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: React.ElementType;
  tone?: "default" | "warning" | "danger" | "success";
}

function DashStatCard({ label, value, subtext, icon: Icon, tone = "default" }: StatCardProps) {
  const toneStyles = {
    default: {
      icon: "bg-accent/10 text-accent",
      value: "text-text",
    },
    success: {
      icon: "bg-status-active-bg/15 text-status-active-text",
      value: "text-text",
    },
    warning: {
      icon: "bg-status-repair-bg/15 text-status-repair-text",
      value: "text-status-repair-text",
    },
    danger: {
      icon: "bg-status-outofservice-bg/15 text-status-outofservice-text",
      value: "text-status-outofservice-text",
    },
  };

  const styles = toneStyles[tone];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-text-secondary/30 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", styles.icon)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {tone === "warning" && value > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-status-repair-text bg-status-repair-bg/10 border border-status-repair-bg/30 px-2 py-0.5 rounded-full">
            Attention
          </span>
        )}
        {tone === "danger" && value > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-status-outofservice-text bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 px-2 py-0.5 rounded-full">
            Urgent
          </span>
        )}
      </div>
      <div>
        <p className={cn("text-3xl font-bold tabular-nums", styles.value)}>{value}</p>
        <p className="text-sm font-semibold text-text mt-0.5">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

// ─── Active Borrow Card ────────────────────────────────────────────────────────

function ActiveBorrowCard({ record }: { record: PortalBorrowLogRecord }) {
  const categoryMeta = getCategoryStyle(record.category);
  const isOverdue = record.status === "overdue";
  const dueDate = new Date(record.dueDate);
  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg-subtle/50 transition-colors duration-150 border-l-4",
        isOverdue
          ? "border-l-status-outofservice-bg bg-status-outofservice-bg/5"
          : "border-l-status-active-bg/60"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
          categoryMeta.bg
        )}
      >
        <Tag className={cn("h-4 w-4", categoryMeta.text)} aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{record.assetName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-xs text-text-secondary">{record.assetCode}</span>
          <span className="text-text-secondary/40">·</span>
          <span
            className={cn(
              "text-xs font-semibold",
              isOverdue ? "text-status-outofservice-bg dark:text-status-outofservice-text" : daysLeft <= 2 ? "text-status-repair-text" : "text-text-secondary"
            )}
          >
            {isOverdue
              ? `${record.daysOverdue}d overdue`
              : daysLeft === 0
              ? "Due today"
              : daysLeft < 0
              ? "Overdue"
              : `${daysLeft}d left`}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-text-secondary">Due</p>
        <p
          className={cn(
            "text-xs font-bold",
            isOverdue ? "text-status-outofservice-bg dark:text-status-outofservice-text" : "text-text"
          )}
        >
          {record.dueDate}
        </p>
      </div>
    </div>
  );
}

// ─── Pending Request Card ─────────────────────────────────────────────────────

function PendingRequestCard({ request }: { request: PortalBorrowRequest }) {
  const categoryMeta = getCategoryStyle(request.category);
  const isApproved = request.status === "approved";
  const isRejected = request.status === "rejected";

  const statusBadge = isApproved
    ? { label: "Approved", className: "bg-status-active-bg/15 text-status-active-text border-status-active-bg/30" }
    : isRejected
    ? { label: "Rejected", className: "bg-status-outofservice-bg/10 text-status-outofservice-bg dark:text-status-outofservice-text border-status-outofservice-bg/30" }
    : { label: "Pending", className: "bg-status-repair-bg/15 text-status-repair-text border-status-repair-bg/30" };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg-subtle/50 transition-colors duration-150 border-l-4",
      isApproved ? "border-l-status-active-bg/60" : isRejected ? "border-l-status-outofservice-bg/60" : "border-l-status-repair-bg/60"
    )}>
      <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center", categoryMeta.bg)}>
        <Tag className={cn("h-3.5 w-3.5", categoryMeta.text)} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{request.itemDescription}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-text-secondary font-mono">{request.requestCode}</p>
          <span className="text-[10px] font-bold uppercase tracking-wide text-text-secondary border border-border px-1.5 py-0.5 rounded-md bg-bg-subtle leading-none">
            {request.itemType === "asset" ? "Borrow" : "Req"}
          </span>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
          statusBadge.className
        )}
      >
        {statusBadge.label}
      </span>
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────────────────

function QuickActionBtn({
  icon: Icon,
  label,
  description,
  onClick,
  href,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick?: () => void;
  href?: string;
  tone?: "accent" | "default";
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 w-full text-left cursor-pointer",
        "hover:border-text-secondary/30 transition-colors duration-150",
        tone === "accent"
          ? "border-accent/30 bg-accent/5 hover:bg-accent/10"
          : "border-border bg-card hover:bg-bg-subtle"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          tone === "accent" ? "bg-accent text-accent-foreground" : "bg-bg-subtle text-text-secondary"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", tone === "accent" ? "text-accent" : "text-text")}>
          {label}
        </p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-text-secondary shrink-0" aria-hidden />
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return <button type="button" onClick={onClick}>{inner}</button>;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

interface BorrowerDashboardProps {
  stats: PortalSummaryStats;
  activeItems: PortalBorrowLogRecord[];
  recentRequests: PortalBorrowRequest[];
}

export function BorrowerDashboard({
  stats,
  activeItems,
  recentRequests,
}: BorrowerDashboardProps) {
  const { openWizard } = useBorrowerPortal();
  const [isReqOpen, setIsReqOpen] = useState(false);

  const statCards: StatCardProps[] = [
    {
      label: "Active Borrowings",
      value: stats.activeBorrowings,
      subtext: "Items currently out on loan",
      icon: Package,
      tone: "default",
    },
    {
      label: "Pending Requests",
      value: stats.pendingRequests,
      subtext: stats.pendingRequests > 0 ? "Awaiting staff approval" : "No pending requests",
      icon: Clock,
      tone: stats.pendingRequests > 0 ? "warning" : "default",
    },
    {
      label: "Overdue Items",
      value: stats.overdueItems,
      subtext: stats.overdueItems > 0 ? "Past due date — return immediately" : "All items on time",
      icon: AlertTriangle,
      tone: stats.overdueItems > 0 ? "danger" : "default",
    },
    {
      label: "Completed This Semester",
      value: stats.completedThisSemester,
      subtext: "Successfully returned items",
      icon: CheckCircle2,
      tone: "success",
    },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── Greeting Banner ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
          <TrendingUp className="h-6 w-6 text-accent" aria-hidden />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-text">Good day, Maria!</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Here&apos;s a summary of your borrowing activity. You have{" "}
            <span className="font-semibold text-text">{stats.activeBorrowings} item{stats.activeBorrowings !== 1 ? "s" : ""}</span> currently on loan
            {stats.overdueItems > 0 && (
              <> and <span className="font-bold text-status-outofservice-bg dark:text-status-outofservice-text">{stats.overdueItems} overdue</span></>
            )}.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => openWizard(null, "borrow")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Package className="h-4 w-4" aria-hidden />
            Borrow Equipment
          </button>
          <button
            type="button"
            onClick={() => setIsReqOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-subtle border border-border text-text text-sm font-semibold hover:bg-border/50 active:bg-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Zap className="h-4 w-4 text-accent" aria-hidden />
            Requisition Supplies
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <section aria-label="Borrowing overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <DashStatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* ── Row 2: Active Items + Recent Requests ──────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Active Borrowings */}
        <section aria-labelledby="active-borrowings-heading">
          <div className="rounded-2xl border border-border bg-card overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 id="active-borrowings-heading" className="text-sm font-bold text-text">
                Active Borrowings
              </h2>
              <Link
                href="/borrower-db/history"
                className="text-xs text-accent font-semibold hover:underline inline-flex items-center gap-1"
              >
                View all history <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {activeItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-bg-subtle flex items-center justify-center mb-3">
                  <Package className="h-5 w-5 text-text-secondary" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-text">Nothing out on loan</p>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">
                  You currently have no active borrowings. Browse available items to get started.
                </p>
                <button
                  type="button"
                  onClick={() => openWizard()}
                  className="mt-4 text-xs text-accent font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Browse items →
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {activeItems.map((record) => (
                  <ActiveBorrowCard key={record.id} record={record} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Requests */}
        <section aria-labelledby="recent-requests-heading">
          <div className="rounded-2xl border border-border bg-card overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 id="recent-requests-heading" className="text-sm font-bold text-text">
                Recent Requests
              </h2>
              <Link
                href="/borrower-db/requests"
                className="text-xs text-accent font-semibold hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-10 text-center px-6">
                <p className="text-sm text-text-secondary">No requests yet.</p>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {recentRequests.slice(0, 5).map((req) => (
                  <PendingRequestCard key={req.id} request={req} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <RequisitionSlip open={isReqOpen} onOpenChange={setIsReqOpen} />
    </div>
  );
}
