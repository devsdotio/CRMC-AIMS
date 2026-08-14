"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Edit3,
  MapPin,
  User,
  Tag,
  Calendar,
  Truck,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Send,
  CheckCircle,
  XCircle,
  PackageCheck,
  PackageMinus,
  RotateCcw,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { custodyBadgeLabel } from "@/lib/assets-custody";
import type { Asset, AssetStatus } from "@/types/assets";
import { useSuppliersQuery } from "@/features/suppliers/client";
import { QRCodeDisplay } from "./qr-code-display";
import { getCategoryStyle } from "@/constants/categories";
import { useBorrowRequests } from "@/features/borrow-requests/client";
import { useState } from "react";

function getRequestIcon(status: string) {
  switch (status) {
    case "pending":
      return <Send className="h-4 w-4" />;
    case "approved":
      return <CheckCircle className="h-4 w-4" />;
    case "rejected":
      return <XCircle className="h-4 w-4" />;
    case "released":
      return <PackageCheck className="h-4 w-4" />;
    case "unreleased":
      return <PackageMinus className="h-4 w-4" />;
    case "returned":
      return <RotateCcw className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
}

function getRequestStyle(status: string) {
  switch (status) {
    case "pending":
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
    case "approved":
      return {
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
      };
    case "rejected":
      return {
        bg: "bg-destructive border-destructive",
        text: "text-destructive",
        iconText: "text-white",
      };
    case "released":
      return {
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
      };
    case "unreleased":
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
    case "returned":
      return {
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
      };
    default:
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
  }
}

function AssetHistoryTimeline({ asset }: { asset: Asset }) {
  const { data, isLoading } = useBorrowRequests({ assetId: asset.id, limit: 50 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
      </div>
    );
  }

  const requests = data?.data || [];
  
  // Prepare unified timeline items
  type TimelineItem = {
    id: string;
    type: "borrow" | "creation" | "update" | "maintenance";
    date: Date;
    title: string;
    subtitle: string;
    department?: string;
    status: string;
    iconType: string;
  };
  
  const timeline: TimelineItem[] = [];
  
  // 1. Borrow Requests
  for (const req of requests) {
    timeline.push({
      id: req.id,
      type: "borrow",
      date: new Date(req.requestedAt),
      title: req.requestCode,
      subtitle: `By ${req.requesterName}`,
      department: req.department,
      status: req.status,
      iconType: req.status,
    });
  }
  
  // 2. Creation Log
  // If no createdAt exists, we fallback to purchaseDate or a dummy date to show the section is prepared.
  const creationDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  timeline.push({
    id: "creation-log",
    type: "creation",
    date: creationDate,
    title: "Asset Created",
    subtitle: "System initialization",
    status: "created",
    iconType: "approved",
  });
  
  // 3. Update Log
  // We use lastUpdated if available, otherwise just use current date
  const updateDate = asset.lastUpdated ? new Date(asset.lastUpdated) : new Date();
  timeline.push({
    id: "last-update-log",
    type: "update",
    date: updateDate,
    title: "Last Updated",
    subtitle: "System record updated",
    status: "updated",
    iconType: "pending",
  });
  
  // 4. Maintenance Logs
  if (asset.maintenanceHistory) {
    for (const log of asset.maintenanceHistory) {
      timeline.push({
        id: log.id,
        type: "maintenance",
        date: new Date(log.date),
        title: `Maintenance: ${log.type}`,
        subtitle: `By ${log.technician}`,
        status: "maintenance",
        iconType: "returned",
      });
    }
  }
  
  // Sort descending (newest first)
  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const recentTimeline = timeline.slice(0, 5);
  const hasMore = timeline.length > 5;

  if (timeline.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-text-secondary">
        No history found for this asset.
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl border border-border bg-bg shadow-xs overflow-hidden">
      <ol className="relative border-l-2 border-border/60 ml-3 space-y-4">
        {recentTimeline.map((item) => {
          const style = getRequestStyle(item.iconType);
          return (
            <li key={item.id} className="pl-6 relative flex items-center min-h-8">
              <span className={cn(
                "absolute -left-4.25 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full border-2 flex items-center justify-center bg-bg shadow-sm z-10",
                style.bg,
                (style as Record<string, string>).iconText || style.text
              )}>
                {getRequestIcon(item.iconType)}
              </span>
              
              <div className="flex items-center flex-wrap gap-2 w-full text-xs py-1">
                <span className={cn("font-bold", style.text)}>
                  {item.title}
                </span>
                <span className="text-text-secondary font-medium truncate max-w-30">
                  {item.subtitle}
                </span>
                
                {item.department && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-bg-subtle text-text-secondary border border-border/50 ml-auto">
                    {item.department}
                  </span>
                )}
                
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border whitespace-nowrap", !item.department && "ml-auto", style.bg, style.text, style.bg.replace('bg-', 'border-'))}>
                  {item.status}
                </span>
                <time className="text-[10px] text-text-secondary font-medium shrink-0">
                  {item.date.toLocaleDateString()}
                </time>
              </div>
            </li>
          );
        })}
      </ol>
      {hasMore && (
        <div className="mt-4 pt-3 border-t border-border flex justify-center">
          <Link href="/dashboard/audit-logs" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View full history in Audit Logs <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export interface AssetDetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
}

const STATUS_STYLES: Record<
  AssetStatus,
  { bg: string; text: string; label: string }
> = {
  active: {
    bg: "bg-status-active-bg/20",
    text: "text-status-active-text font-bold",
    label: "Active",
  },
  needs_repair: {
    bg: "bg-status-repair-bg/20",
    text: "text-status-repair-text font-bold",
    label: "Needs Repair",
  },
  out_of_service: {
    bg: "bg-status-outofservice-bg/20",
    text: "text-status-outofservice-text font-bold",
    label: "Out of Service",
  },
  retired: {
    bg: "bg-status-retired-bg/20",
    text: "text-status-retired-text font-bold",
    label: "Retired",
  },
};

export function AssetDetailPanel({
  asset,
  isOpen,
  onClose,
  onEdit,
}: AssetDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Suppliers only needed when panel is open with a linked vendor — never on list paint.
  const { data: suppliers = [] } = useSuppliersQuery({
    enabled: Boolean(isOpen && asset?.supplierId),
  });

  const supplierName = asset?.supplierId
    ? (suppliers.find((s) => s.id === asset.supplierId)?.name ?? null)
    : null;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const categoryMeta = getCategoryStyle(asset.category);
  const statusMeta = STATUS_STYLES[asset.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-detail-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out",
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-text bg-bg px-2 py-0.5 rounded border border-border">
                {asset.assetCode}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  categoryMeta.bg,
                  categoryMeta.text,
                )}
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {categoryMeta.label}
              </span>
            </div>
            <h2
              id="asset-detail-heading"
              className="text-base font-bold text-text mt-0.5 leading-tight"
            >
              {asset.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onEdit(asset)}
            aria-label="Edit asset details"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg text-text-secondary hover:text-text border border-border hover:border-primary transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* QR Code Tag Card */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Physical QR Tag
            </h3>
            <QRCodeDisplay assetCode={asset.assetCode} assetName={asset.name} />
          </div>

          {/* Asset Record Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Asset Record
            </h3>

            <div className="bg-bg rounded-xl border border-border shadow-xs overflow-hidden">
              {/* Status Header */}
              <div className="p-4 border-b border-border bg-bg-subtle flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Current Condition
                </span>
                <div className="flex gap-2">
                  {asset.currentHolder ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent uppercase tracking-wider">
                      {custodyBadgeLabel(asset.currentHolder)}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-active-bg/20 text-status-active-text uppercase tracking-wider">
                      Available
                    </span>
                  )}
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      statusMeta.bg,
                      statusMeta.text,
                    )}
                  >
                    {statusMeta.label}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      asset.assignmentType === "assignable"
                        ? "border-status-repair-text text-status-repair-text bg-status-repair-bg/10"
                        : "border-accent text-accent bg-accent/10",
                    )}
                  >
                    {asset.assignmentType === "assignable"
                      ? "Assignable"
                      : "Borrowable"}
                  </span>
                </div>
              </div>

              {/* Grid Properties */}
              <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Serial Number
                  </p>
                  <p className="text-sm font-mono font-medium text-text">
                    {asset.serialNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Location
                  </p>
                  <p
                    className="text-sm font-medium text-text truncate"
                    title={asset.location}
                  >
                    {asset.location}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Custody
                  </p>
                  <p className="text-sm font-medium text-text truncate">
                    {asset.currentHolder ? (
                      <span
                        title={`${asset.currentHolder} ${asset.department ? `(${asset.department})` : ""}`}
                      >
                        {asset.currentHolder}
                      </span>
                    ) : (
                      <span className="text-status-active-text">
                        Available In Stock
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Acquisition
                  </p>
                  <p className="text-sm font-medium text-text">
                    {asset.purchaseDate || "Unrecorded"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Truck className="h-3 w-3" /> Supplier
                  </p>
                  <p className="text-sm font-medium text-text truncate">
                    {supplierName ||
                      (asset.supplierId
                        ? "Supplier record unavailable"
                        : "Unspecified")}
                  </p>
                </div>

                {asset.value != null && asset.value !== undefined && (
                  <div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      Inventory Value (₱)
                    </p>
                    <p className="text-sm font-mono font-medium text-text">
                      ₱{asset.value.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes Full Width */}
              {asset.notes && (
                <div className="p-5 border-t border-border bg-bg-subtle/30">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Custody Notes / Details
                  </p>
                  <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                    {asset.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Asset History Card */}
          <div className="space-y-3 pb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Asset History
            </h3>
            <AssetHistoryTimeline asset={asset} />
          </div>
        </div>
      </aside>
    </div>
  );
}
