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
import { cn } from "@/lib/utils";

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
    subtitle: "Track active borrowings, returns, and overdue items",
    category: "Operations",
  },
  "/consumables": {
    title: "Consumables Inventory",
    subtitle: "Monitor stock quantities and minimum threshold alerts",
    category: "Operations",
  },
  "/maintenance-logs": {
    title: "Condition & Maintenance Logs",
    subtitle: "Log asset repairs, condition reports, and service logs",
    category: "Operations",
  },
  "/users": {
    title: "Users & Roles",
    subtitle: "Manage custodian permissions and department users",
    category: "Administration",
  },
  "/reports": {
    title: "Reports & Analytics",
    subtitle: "Generate and export inventory utilization reports",
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
}

export default function GlobalHeader({ onMobileMenuOpen }: GlobalHeaderProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

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
      if (quickActionRef.current && !quickActionRef.current.contains(e.target as Node)) {
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
            <span className="font-semibold text-[#1B2140] truncate">{currentRoute.title}</span>
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
        <div className="relative hidden md:block w-60 lg:w-72">
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
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative p-2 text-[#5A5F73] hover:text-[#1B2140] hover:bg-[#F2F3F7] rounded-lg transition-colors cursor-pointer"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4E45] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4E45]" />
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E3E5EC] rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3E5EC] bg-[#F2F3F7]/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[#1B2140]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#FF4E45] rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-[#FF4E45] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#E3E5EC] max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#5A5F73]">
                    <CheckCircle2 className="w-6 h-6 text-[#2ECC71] mx-auto mb-1.5" />
                    No unread notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3.5 flex gap-3 transition-colors hover:bg-[#F2F3F7]/40",
                        item.unread && "bg-white font-medium"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === "urgent" && <AlertTriangle className="w-4 h-4 text-[#FF4E45]" />}
                        {item.type === "warning" && <Clock className="w-4 h-4 text-[#FFB020]" />}
                        {item.type === "info" && <Bell className="w-4 h-4 text-[#1B2140]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#1B2140] truncate">{item.title}</p>
                          <span className="text-[10px] text-[#5A5F73] shrink-0">{item.time}</span>
                        </div>
                        <p className="text-xs text-[#5A5F73] mt-0.5 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-[#E3E5EC] bg-[#F2F3F7]/30 text-center">
                <Link
                  href="/borrow-requests"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-semibold text-[#1B2140] hover:text-[#FF4E45] transition-colors"
                >
                  View all system logs →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Dropdown */}
        <div className="relative" ref={quickActionRef}>
          <button
            onClick={() => setIsQuickActionOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B2140] text-white font-medium text-xs rounded-lg hover:bg-[#FF4E45] transition-all duration-200 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {isQuickActionOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E3E5EC] rounded-xl shadow-xl z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                href="/assets/new"
                onClick={() => setIsQuickActionOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#1B2140] hover:bg-[#F2F3F7] rounded-lg transition-colors font-medium"
              >
                <PackagePlus className="w-4 h-4 text-[#FF4E45]" />
                Add New Asset
              </Link>
              <Link
                href="/borrow-log/return"
                onClick={() => setIsQuickActionOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#1B2140] hover:bg-[#F2F3F7] rounded-lg transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4 text-[#2ECC71]" />
                Log Return
              </Link>
              <Link
                href="/consumables/restock"
                onClick={() => setIsQuickActionOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#1B2140] hover:bg-[#F2F3F7] rounded-lg transition-colors font-medium"
              >
                <Boxes className="w-4 h-4 text-[#FFB020]" />
                Restock Consumable
              </Link>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-[#E3E5EC] mx-0.5 hidden sm:block" />

        {/* User Pill Header Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-[#F2F3F7] border border-[#E3E5EC]">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1B2140] text-white text-[10px] font-bold">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-[#1B2140] pr-1">Custodian</span>
        </div>
      </div>
    </header>
  );
}
