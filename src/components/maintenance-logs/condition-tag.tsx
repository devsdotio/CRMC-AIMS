"use client";

import { CheckCircle2, Wrench, AlertOctagon, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConditionState } from "@/types/maintenance-logs";

export interface ConditionTagProps {
  condition: ConditionState;
  className?: string;
  showIcon?: boolean;
}

const CONDITION_META: Record<
  ConditionState,
  { bg: string; text: string; label: string; icon: typeof CheckCircle2 }
> = {
  good: {
    bg: "bg-status-active-bg/20",
    text: "text-status-active-text font-bold",
    label: "Good Condition",
    icon: CheckCircle2,
  },
  needs_maintenance: {
    bg: "bg-status-repair-bg/20",
    text: "text-status-repair-text font-bold",
    label: "Needs Maintenance",
    icon: Wrench,
  },
  damaged: {
    bg: "bg-status-outofservice-bg/20",
    text: "text-status-outofservice-text font-bold",
    label: "Damaged / Out of Service",
    icon: AlertOctagon,
  },
  resolved: {
    bg: "bg-status-retired-bg/20",
    text: "text-status-retired-text font-bold",
    label: "Resolved",
    icon: CheckCheck,
  },
};

export function ConditionTag({
  condition,
  className,
  showIcon = true,
}: ConditionTagProps) {
  const meta = CONDITION_META[condition];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs whitespace-nowrap",
        meta.bg,
        meta.text,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{meta.label}</span>
    </span>
  );
}
