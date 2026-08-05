/**
 * Dashboard mock data — isolated so components stay prop-driven and testable.
 * Replace with real API/fetching hooks in production.
 */

import type { StatCardProps } from "@/components/dashboard/stat-card";
import type { PendingRequest } from "@/components/dashboard/pending-approvals-widget";
import type { OverdueAsset } from "@/components/dashboard/overdue-assets-widget";
import type { LowStockItem } from "@/components/dashboard/low-stock-widget";
import type { CategoryCount } from "@/components/dashboard/assets-by-category-chart";
import type { ActivityEntry } from "@/components/dashboard/recent-activity-feed";
import {
  ClipboardList,
  Package,
  Repeat,
  AlertTriangle,
} from "lucide-react";

// ─── Stat Cards ──────────────────────────────────────────────────────────────

export const MOCK_STAT_CARDS: StatCardProps[] = [
  {
    label: "Active Borrowings",
    value: 24,
    contextLine: "Across 8 departments",
    icon: Repeat,
    variant: "default",
    href: "/borrow-log?filter=active",
  },
  {
    label: "Pending Approvals",
    value: 7,
    contextLine: "Oldest request: 3 days ago",
    icon: ClipboardList,
    variant: "default",
    href: "/borrow-requests?filter=pending",
  },
  {
    label: "Low-Stock Items",
    value: 5,
    contextLine: "2 items fully depleted",
    icon: Package,
    variant: "warning",
    href: "/consumables?filter=low-stock",
  },
  {
    label: "Overdue Assets",
    value: 3,
    contextLine: "1 item 7+ days past due",
    icon: AlertTriangle,
    variant: "danger",
    href: "/borrow-log?filter=overdue",
  },
];

// ─── Pending Requests ─────────────────────────────────────────────────────────

export const MOCK_PENDING_REQUESTS: PendingRequest[] = [
  { id: "pr-1", requesterName: "Maria Santos",   department: "IT",        itemDescription: "Laptop (2 units)",           requestedAt: "2026-07-26T08:30:00Z", relativeTime: "2 days ago" },
  { id: "pr-2", requesterName: "Juan dela Cruz",  department: "Finance",   itemDescription: "Projector #A-102",            requestedAt: "2026-07-26T14:00:00Z", relativeTime: "2 days ago" },
  { id: "pr-3", requesterName: "Rosa Reyes",      department: "HR",        itemDescription: "Whiteboard Marker Set (5)",   requestedAt: "2026-07-27T09:15:00Z", relativeTime: "Yesterday" },
  { id: "pr-4", requesterName: "Carlos Mendoza",  department: "Eng.",      itemDescription: "HDMI Cable (3 units)",        requestedAt: "2026-07-27T11:00:00Z", relativeTime: "Yesterday" },
  { id: "pr-5", requesterName: "Ana Villanueva",  department: "Admin",     itemDescription: "Office Chair",                requestedAt: "2026-07-28T07:45:00Z", relativeTime: "5h ago" },
];

// ─── Overdue Assets ───────────────────────────────────────────────────────────

export const MOCK_OVERDUE_ASSETS: OverdueAsset[] = [
  { id: "oa-1", assetName: "Canon DSLR Camera",      assetCode: "AV-031", borrowerName: "Ben Aquino",    department: "Comms",   daysOverdue: 7,  dueSince: "2026-07-21T00:00:00Z" },
  { id: "oa-2", assetName: "HP Laptop",               assetCode: "CP-078", borrowerName: "Luz Castillo",  department: "Finance", daysOverdue: 4,  dueSince: "2026-07-24T00:00:00Z" },
  { id: "oa-3", assetName: "Epson LCD Projector",     assetCode: "AV-014", borrowerName: "Rico Bautista", department: "IT",      daysOverdue: 2,  dueSince: "2026-07-26T00:00:00Z" },
];

// ─── Low Stock ────────────────────────────────────────────────────────────────

export const MOCK_LOW_STOCK: LowStockItem[] = [
  { id: "ls-1", itemName: "A4 Bond Paper",         currentQty: 0,   minThreshold: 10, unit: "reams" },
  { id: "ls-2", itemName: "Toner Cartridge (Black)",currentQty: 1,   minThreshold: 5,  unit: "pcs" },
  { id: "ls-3", itemName: "Whiteboard Markers",     currentQty: 3,   minThreshold: 10, unit: "pcs" },
  { id: "ls-4", itemName: "AA Batteries",           currentQty: 8,   minThreshold: 20, unit: "pcs" },
  { id: "ls-5", itemName: "Staple Wire",            currentQty: 4,   minThreshold: 6,  unit: "boxes" },
];

// ─── Category Chart ───────────────────────────────────────────────────────────

export const MOCK_CATEGORY_DATA: CategoryCount[] = [
  { category: "computing",  label: "Computing",  count: 42 },
  { category: "furniture",  label: "Furniture",  count: 35 },
  { category: "av",         label: "AV",         count: 18 },
  { category: "transport",  label: "Transport",  count: 9  },
];

// ─── Activity Feed ────────────────────────────────────────────────────────────

export const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "af-1", type: "return",      description: "Juan dela Cruz returned Projector #AV-014 — condition: Good",          relativeTime: "1h ago" },
  { id: "af-2", type: "request",     description: "New borrow request from Ana Villanueva (Admin) for Office Chair",       relativeTime: "5h ago" },
  { id: "af-3", type: "borrow",      description: "HP Laptop CP-078 released to IT Dept — 3-day term",                    relativeTime: "Yesterday" },
  { id: "af-4", type: "restock",     description: "A4 Bond Paper restocked: +20 reams by Property Custodian",             relativeTime: "Yesterday" },
  { id: "af-5", type: "maintenance", description: "Canon DSLR AV-031 flagged for cleaning — scheduled next Monday",       relativeTime: "2 days ago" },
  { id: "af-6", type: "release",     description: "Maria Santos picked up 2 Laptops (CP-080, CP-081) for seminar use",    relativeTime: "2 days ago" },
  { id: "af-7", type: "return",      description: "Carlos Mendoza returned 3 HDMI Cables — all in serviceable condition", relativeTime: "3 days ago" },
];
