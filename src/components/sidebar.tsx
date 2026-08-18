"use client";

import type { UserRole } from "@/types/users";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Repeat,
  Boxes,
  Users,
  Settings,
  LogOut,
  User,
  ChevronsUpDown,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  FolderKanban,
  Truck,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeTone?: "accent" | "warning";
  roles?: UserRole[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  className?: string;
  onCollapsedChange?: (collapsed: boolean) => void;
  pendingCount?: number;
  lowStockCount?: number;
  overdueCount?: number;
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  onLogout?: () => void;
}

export default function Sidebar({
  className,
  onCollapsedChange,
  pendingCount = 0,
  lowStockCount = 0,
  overdueCount = 0,
  userName = "Unknown user",
  userEmail = "",
  userRole,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setUserMenuOpen(false);

    if (onLogout) {
      onLogout();
      return;
    }

    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      queryClient.clear();
      router.push("/sign-in");
      router.refresh();
    } catch {
      // Still leave the app shell if network sign-out fails; proxy will recheck session.
      queryClient.clear();
      router.push("/sign-in");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Close the user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSections: NavSection[] = [
    {
      label: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          roles: ["superadmin", "admin", "staff"],
        },
        {
          name: "My Dashboard",
          href: "/borrower-db/dashboard",
          icon: LayoutDashboard,
          roles: ["borrower"],
        },
      ],
    },
    {
      label: "Operations",
      items: [
        { name: "Assets", href: "/assets", icon: Package, roles: ["superadmin", "admin", "staff"] },
        { name: "Inventory", href: "/consumables", icon: Boxes, badge: lowStockCount, badgeTone: "warning", roles: ["superadmin", "admin", "staff"] },
        { name: "Requests", href: "/borrow-requests", icon: ClipboardList, badge: pendingCount, badgeTone: "accent", roles: ["superadmin", "admin", "staff"] },
        { name: "Borrow Log", href: "/borrow-log", icon: Repeat, badge: overdueCount, badgeTone: "warning", roles: ["superadmin", "admin", "staff"] },
        { name: "Issue history", href: "/issue-history", icon: History, roles: ["superadmin", "admin", "staff"] },
        { name: "Suppliers", href: "/suppliers", icon: Truck, roles: ["superadmin", "admin", "staff"] },
        { name: "Projects", href: "/projects", icon: FolderKanban, roles: ["superadmin", "admin"] },
        { name: "Maintenance Logs", href: "/maintenance-logs", icon: Wrench, roles: ["superadmin", "admin", "staff"] },
        // TEMP: Audit Logs nav hidden while writes are disabled.
        // { name: "Audit Logs", href: "/audit-logs", icon: FileText, roles: ["superadmin", "admin"] },
        { name: "My Requests", href: "/borrower-db/requests", icon: ClipboardList, badge: pendingCount, badgeTone: "accent", roles: ["borrower"] },
        { name: "Borrow History", href: "/borrower-db/history", icon: History, roles: ["borrower"] },
      ],
    },
    {
      label: "Administration",
      items: [
        { name: "Users & Departments", href: "/users", icon: Users, roles: ["superadmin", "admin"] },
        { name: "Settings", href: "/settings", icon: Settings, roles: ["superadmin", "admin"] },
      ],
    },
  ];

  // Filter sections and items based on user role
  const sections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || (userRole && item.roles.includes(userRole)),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const handleToggle = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    onCollapsedChange?.(next);
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    const hasBadge = (item.badge ?? 0) > 0;
    const badgeClass =
      item.badgeTone === "accent"
        ? "bg-blue-100 text-primary"
        : "bg-status-repair-bg text-status-repair-text";

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium",
          "outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
          "transition-colors duration-150 group",
          isActive
            ? "text-white font-semibold"
            : "text-white/60 hover:text-white hover:bg-white/6",
        )}
      >
        {/* Animated active pill — shared layoutId glides between items */}
        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            className="absolute inset-0 rounded-lg bg-white/10 ring-1 ring-white/10"
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
          />
        )}

        <span className="relative flex items-center gap-3 min-w-0">
          <Icon
            className={cn(
              "w-4.5 h-4.5 shrink-0 transition-transform duration-150 group-hover:scale-110",
              isActive ? "text-accent" : "text-white/50 group-hover:text-white",
            )}
          />
          {!isCollapsed && <span className="truncate">{item.name}</span>}
        </span>

        {!isCollapsed && hasBadge && (
          <span
            className={cn(
              "relative flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full shrink-0 tabular-nums",
              badgeClass,
            )}
          >
            {item.badge! > 99 ? "99+" : item.badge}
          </span>
        )}

        {/* Left accent bar on active item */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.75 rounded-r-full bg-accent" />
        )}

        {/* Collapsed-state tooltip */}
        {isCollapsed && (
          <div
            role="tooltip"
            className={cn(
              "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50",
              "flex items-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#0F1329]",
              "px-2.5 py-1.5 text-xs text-white shadow-lg shadow-black/30",
              "opacity-0 scale-95 origin-left transition-all duration-150",
              "group-hover:opacity-100 group-hover:scale-100",
            )}
          >
            {item.name}
            {hasBadge && (
              <span
                className={cn(
                  "flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full",
                  badgeClass,
                )}
              >
                {item.badge}
              </span>
            )}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      onClick={() => {
        if (isCollapsed) {
          handleToggle();
        }
      }}
      className={cn(
        "relative flex flex-col h-full bg-primary border-r border-white/10",
        "transition-[width] duration-300 ease-in-out z-30",
        isCollapsed ? "w-19 cursor-pointer hover:bg-primary/90" : "w-64",
        className,
      )}
    >
      {/* Brand header */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-white/10 shrink-0",
          isCollapsed ? "justify-center" : "justify-between px-4",
        )}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2 overflow-hidden select-none"
          onClick={(e) => {
            // Prevent navigation if we're just clicking to expand the sidebar
            if (isCollapsed) e.preventDefault();
          }}
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 ">
            <Image
              src="/aims-logo-white.svg"
              alt="AIMS"
              width={28}
              height={28}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-wider text-white whitespace-nowrap">
              <span className="text-accent">AIMS</span>
            </span>
          )}
        </Link>

        {!isCollapsed && (
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent clicking the aside
              handleToggle();
            }}
            aria-label="Collapse sidebar"
            className={cn(
              "hidden md:flex items-center justify-center rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors",
              "w-8 h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
            )}
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto overflow-x-hidden min-h-0">
        {sections.map((section) => (
          <div key={section.label}>
            {!isCollapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">
                {section.label}
              </p>
            )}
            <div className="space-y-1">{section.items.map(renderNavItem)}</div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div
        className="relative border-t border-white/10 p-3 shrink-0"
        ref={userMenuRef}
      >
        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
            "hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
          )}
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white shrink-0">
            <User className="w-4.5 h-4.5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-active-bg ring-2 ring-primary" />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {userName}
                </p>
                <p className="text-xs text-white/40 truncate">{userEmail}</p>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
            </>
          )}
        </button>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.14 }}
              className={cn(
                "absolute bottom-full mb-2 rounded-lg border border-white/10 bg-[#0F1329] shadow-lg shadow-black/40 p-1 z-50",
                isCollapsed ? "left-full ml-2 w-44" : "left-3 right-3",
              )}
            >
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-white/70 hover:bg-white/6 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "Signing out..." : "Log out"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
