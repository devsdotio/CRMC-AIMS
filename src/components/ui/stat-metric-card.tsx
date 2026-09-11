"use client";

import React, { useState } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardTone = "blue" | "emerald" | "amber" | "purple";

export interface StatMetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  description: string;
  icon: LucideIcon;
  tone?: StatCardTone;
  className?: string;
}

const toneStyles: Record<
  StatCardTone,
  {
    iconBadgeBg: string;
    iconBadgeColor: string;
    fadedIconColor: string;
    dotColor: string;
  }
> = {
  blue: {
    iconBadgeBg: "bg-blue-50",
    iconBadgeColor: "text-blue-600",
    fadedIconColor: "text-blue-600",
    dotColor: "bg-blue-500",
  },
  emerald: {
    iconBadgeBg: "bg-emerald-50",
    iconBadgeColor: "text-emerald-600",
    fadedIconColor: "text-emerald-600",
    dotColor: "bg-emerald-500",
  },
  amber: {
    iconBadgeBg: "bg-amber-50",
    iconBadgeColor: "text-amber-600",
    fadedIconColor: "text-amber-600",
    dotColor: "bg-amber-500",
  },
  purple: {
    iconBadgeBg: "bg-purple-50",
    iconBadgeColor: "text-purple-600",
    fadedIconColor: "text-purple-600",
    dotColor: "bg-purple-500",
  },
};

export function StatMetricCard({
  title,
  value,
  subtitle,
  description,
  icon: Icon,
  tone = "blue",
  className,
}: StatMetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const currentTone = toneStyles[tone];

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={`${title}: ${value}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      className={cn(
        "group relative flex flex-col justify-between p-5 rounded-2xl bg-bg border border-border",
        "shadow-xs hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-default select-none overflow-visible hover:z-30 focus-within:z-30",
        className,
      )}
    >
      {/* ── Background Watermark (Clipped inside rounded container) ── */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="pointer-events-none absolute -bottom-3 -right-3 select-none">
          <Icon
            className={cn(
              "w-28 h-28 stroke-[1.2] transition-all duration-300",
              currentTone.fadedIconColor,
              "opacity-[0.08] group-hover:opacity-[0.14] group-hover:scale-105",
            )}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Top Row: Header (Icon Badge + Title) ───────────────────── */}
      <div className="relative flex items-center gap-2 z-10">
        <span
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg transition-transform duration-200 group-hover:scale-105 shrink-0",
            currentTone.iconBadgeBg,
            currentTone.iconBadgeColor,
          )}
        >
          <Icon className="w-4 h-4" />
        </span>

        <span className="text-xs font-semibold text-text-secondary truncate">
          {title}
        </span>
      </div>

      {/* ── Middle Row: Enlarged Bold Numerical Value ───────────────── */}
      <div className="relative mt-3.5 z-10">
        <span className="text-4xl sm:text-[42px] font-black text-text tabular-nums tracking-tight leading-none">
          {value}
        </span>
      </div>

      {/* ── Bottom Row: Subtitle with Indicator Dot ─────────────────── */}
      {subtitle && (
        <div className="relative mt-2.5 flex items-center gap-1.5 text-xs text-text-secondary z-10">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              currentTone.dotColor,
            )}
          />
          <span className="text-[11px] text-text-secondary truncate">
            {subtitle}
          </span>
        </div>
      )}

      {/* ── Brief Info Tooltip (Renders Below Card Without Clipping) ── */}
      {showTooltip && (
        <div
          role="tooltip"
          className={cn(
            "absolute top-[calc(100%+8px)] left-0 right-0 z-50",
            "px-3.5 py-2.5 rounded-xl bg-text text-white text-xs border border-white/15 shadow-md",
            "animate-in fade-in zoom-in-95 duration-100 pointer-events-none",
          )}
        >
          <div className="absolute -top-1 left-6 w-2 h-2 rotate-45 bg-text border-l border-t border-white/15" />
          <p className="leading-snug text-white/95 font-normal">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}
