"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Plus,
  ChevronRight,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  PackagePlus,
  RotateCcw,
  Boxes,
} from "lucide-react";

// ─── Route Metadata Map ──────────────────────────────────────────────────────

interface RouteMeta {
  title: string;
  subtitle: string;
  category: string;
}

const ROUTE_MAP: Record<string, RouteMeta> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Property & Inventory — at a glance",
    category: "Overview",
  },
  "/borrow-requests": {
    title: "Borrow Requests",
    subtitle: "Review and approve pending asset borrowing requests",
    category: "Operations",
  },
  "/assets": {
    title: "Assets Inventory",
    subtitle: "Manage fixed assets, serial numbers, and equipment records",
    category: "Operations",
  },
  "/borrow-log": {
    title: "Borrow & Return Log",
    subtitle: "Asset custody with LOG codes — borrowable and assignable",
    category: "Operations",
  },
  "/issue-history": {
    title: "Issue history",
    subtitle: "Asset LOG and supply MOV transaction codes",
    category: "Operations",
  },
  "/consumable-requests": {
    title: "Supply requests",
    subtitle: "Department consumable requisitions — approve and release",
    category: "Operations",
  },
  "/maintenance-logs": {
    title: "Maintenance Logs",
    subtitle: "Condition flags, inspections, and repair resolutions",
    category: "Operations",
  },
  "/consumables": {
    title: "Inventory",
    subtitle: "Monitor stock quantities and minimum threshold alerts",
    category: "Operations",
  },
  "/users": {
    title: "Users & Roles",
    subtitle: "Manage custodian permissions and department users",
    category: "Administration",
  },
  "/settings": {
    title: "System Settings",
    subtitle: "Configure custodian rules, categories, and system defaults",
    category: "Administration",
  },
};

// ─── Notification Item Interface ─────────────────────────────────────────────

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: "warning" | "info" | "urgent";
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    title: "Overdue Asset Alert",
    message: "Canon DSLR Camera (AV-031) is 7 days overdue by Ben Aquino.",
    time: "10m ago",
    unread: true,
    type: "urgent",
  },
  {
    id: "n-2",
    title: "Low Stock Warning",
    message: "A4 Bond Paper stock has reached 0 reams.",
    time: "1h ago",
    unread: true,
    type: "warning",
  },
  {
    id: "n-3",
    title: "New Borrow Request",
    message: "Ana Villanueva requested Office Chair for Admin Dept.",
    time: "3h ago",
    unread: true,
    type: "info",
  },
];

interface GlobalHeaderProps {
  onMobileMenuOpen: () => void;
  /** Display name from the signed-in profile (sidebar/header identity). */
  userName?: string;
  /** Role title label, e.g. "Admin", "Staff", "Superadmin". */
  userRoleLabel?: string;
}

export default function GlobalHeader({
  onMobileMenuOpen,
  userName,
  userRoleLabel = "—",
}: GlobalHeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const notifRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);

  // Derive route metadata or fallback
  const currentRoute = ROUTE_MAP[pathname] || {
    title: "CRMC AIMS",
    subtitle: "Asset & Inventory Management System",
    category: "System",
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (
        quickActionRef.current &&
        !quickActionRef.current.contains(e.target as Node)
      ) {
        setIsQuickActionOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-[#E3E5EC] shrink-0 z-20 select-none">
      {/* Left: Mobile hamburger menu & Dynamic Route Title/Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 rounded-lg text-[#5A5F73] hover:bg-[#F2F3F7] hover:text-[#1B2140] transition-colors cursor-pointer"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-xs text-[#5A5F73]">
            <span className="font-medium">{currentRoute.category}</span>
            <ChevronRight className="w-3 h-3 text-[#9AA0AC]" />
            <span className="font-semibold text-[#1B2140] truncate">
              {currentRoute.title}
            </span>
          </div>
          {/* Page Subtitle */}
          <p className="text-xs text-[#5A5F73] truncate hidden sm:block">
            {currentRoute.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Search, Notifications, Quick Actions, User Profile */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Dynamic Search Bar */}
        {/* <div className="relative hidden md:block w-60 lg:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#5A5F73]">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assets, requests, items…"
            className="w-full h-9 pl-9 pr-8 text-xs bg-[#F2F3F7] border border-[#E3E5EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#FF4E45] focus:bg-white transition-all text-[#1B2140] placeholder-[#5A5F73]"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#5A5F73] hover:text-[#1B2140]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#5A5F73] bg-white border border-[#E3E5EC] rounded shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div> */}

        {/* Vertical Divider */}
        {/* <div className="h-6 w-px bg-[#E3E5EC] mx-0.5 hidden sm:block" /> */}

        {/* Signed-in user identity */}
        <div
          className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-[#F2F3F7] border border-[#E3E5EC] max-w-56"
          title={userName ? `${userName} · ${userRoleLabel}` : userRoleLabel}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A3260] text-white text-[10px] font-bold shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 pr-1">
            <span className="block text-xs font-semibold text-[#1B2140] truncate leading-tight">
              {userName ?? userRoleLabel}
            </span>
            {userName ? (
              <span className="block text-[10px] font-medium text-[#6B7280] truncate leading-tight">
                {userRoleLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
