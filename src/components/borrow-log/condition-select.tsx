"use client";

import { CheckCircle2, Wrench, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReturnCondition } from "@/types/borrow-log";

export interface ConditionSelectProps {
  value: ReturnCondition;
  onChange: (condition: ReturnCondition) => void;
  className?: string;
}

const CONDITIONS: {
  id: ReturnCondition;
  label: string;
  sublabel: string;
  icon: typeof CheckCircle2;
  bgActive: string;
  textActive: string;
  borderActive: string;
}[] = [
  {
    id: "good",
    label: "Good / Serviceable",
    sublabel: "Clean & ready for immediate re-issue",
    icon: CheckCircle2,
    bgActive: "bg-status-active-bg/15",
    textActive: "text-status-active-text",
    borderActive: "border-status-active-bg",
  },
  {
    id: "needs_repair",
    label: "Needs Repair / Maintenance",
    sublabel: "Minor fault — flag for tech inspection",
    icon: Wrench,
    bgActive: "bg-status-repair-bg/15",
    textActive: "text-status-repair-text",
    borderActive: "border-status-repair-bg",
  },
  {
    id: "damaged",
    label: "Damaged / Out of Service",
    sublabel: "Severe defect — remove from active stock",
    icon: AlertOctagon,
    bgActive: "bg-status-outofservice-bg/15",
    textActive: "text-status-outofservice-text",
    borderActive: "border-status-outofservice-bg",
  },
];

export function ConditionSelect({
  value,
  onChange,
  className,
}: ConditionSelectProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-2.5", className)} role="radiogroup" aria-label="Return asset condition">
      {CONDITIONS.map((cond) => {
        const isSelected = value === cond.id;
        const Icon = cond.icon;
        return (
          <button
            key={cond.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(cond.id)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer outline-none",
              "focus-visible:ring-2 focus-visible:ring-accent",
              isSelected
                ? [cond.bgActive, cond.borderActive, "ring-1", cond.borderActive, "shadow-2xs"]
                : "bg-bg border-border hover:bg-bg-subtle"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full shrink-0 mt-0.5",
                isSelected ? cond.textActive : "text-text-secondary/60 bg-bg-subtle"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <span className={cn("text-xs font-bold block leading-tight", isSelected ? "text-text" : "text-text-secondary")}>
                {cond.label}
              </span>
              <span className="text-[11px] text-text-secondary block mt-0.5 truncate">
                {cond.sublabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
