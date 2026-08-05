"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Repeat,
  Boxes,
  Wrench,
  Users,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeTone?: "accent" | "warning";
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
  onLogout?: () => void;
}

export default function Sidebar({
  className,
  onCollapsedChange,
  pendingCount = 0,
  lowStockCount = 0,
  overdueCount = 0,
  userName = "Demo User",
  userEmail = "user@aims",
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setUserMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      router.push("/sign-in");
    }
  };

  // Close the user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Operations",
      items: [
        { name: "Borrow Requests", href: "/borrow-requests", icon: ClipboardList, badge: pendingCount, badgeTone: "accent" },
        { name: "Assets", href: "/assets", icon: Package },
        { name: "Borrow & Return Log", href: "/borrow-log", icon: Repeat, badge: overdueCount, badgeTone: "warning" },
        { name: "Inventory", href: "/consumables", icon: Boxes, badge: lowStockCount, badgeTone: "warning" }
      ],
    },
    {
      label: "Administration",
      items: [
        { name: "Users & Roles", href: "/users", icon: Users },
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

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
      item.badgeTone === "warning"
        ? "bg-status-repair-bg text-status-repair-text"
        : "bg-accent text-accent-foreground";

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium",
          "outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
          "transition-colors duration-150 group",
          isActive ? "text-white font-semibold" : "text-white/60 hover:text-white hover:bg-white/6"
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
              isActive ? "text-accent" : "text-white/50 group-hover:text-white"
            )}
          />
          {!isCollapsed && <span className="truncate">{item.name}</span>}
        </span>

        {!isCollapsed && hasBadge && (
          <span
            className={cn(
              "relative flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold rounded-full shrink-0 tabular-nums",
              badgeClass
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
              "group-hover:opacity-100 group-hover:scale-100"
            )}
          >
            {item.name}
            {hasBadge && (
              <span className={cn("flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full", badgeClass)}>
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
      className={cn(
        "relative flex flex-col h-full bg-primary border-r border-white/10",
        "transition-[width] duration-300 ease-in-out z-30 overflow-x-hidden",
        isCollapsed ? "w-19" : "w-64",
        className
      )}
    >
      {/* Brand header */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden select-none">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white p-1.5 shrink-0 shadow-sm shadow-black/20">
            <Image
              src="/aims-logo.svg"
              alt="CRMC-AIMS Logo"
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
      <div className="relative border-t border-white/10 p-3 shrink-0" ref={userMenuRef}>
        <button
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors",
            "hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          )}
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white shrink-0">
            <User className="w-4.5 h-4.5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-active-bg ring-2 ring-primary" />
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{userName}</p>
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
                isCollapsed ? "left-full ml-2 w-44" : "left-3 right-3"
              )}
            >
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-white/70 hover:bg-white/6 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse toggle — absolutely positioned on the right edge of the sidebar, vertically centered */}
      <button
        onClick={handleToggle}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 -right-3 hidden md:flex items-center justify-center w-6 h-6 rounded-full",
          "bg-primary border border-white/20 text-white shadow-md cursor-pointer z-40",
          "hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        )}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}