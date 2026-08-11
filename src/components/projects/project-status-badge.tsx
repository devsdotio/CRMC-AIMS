"use client";

import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/projects";
import { PROJECT_STATUS_LABELS } from "@/types/projects";

const STYLES: Record<
  ProjectStatus,
  { bg: string; text: string }
> = {
  draft: {
    bg: "bg-bg-subtle border border-border",
    text: "text-text-secondary",
  },
  active: {
    bg: "bg-status-active-bg/20",
    text: "text-status-active-text",
  },
  on_hold: {
    bg: "bg-status-repair-bg/20",
    text: "text-status-repair-text",
  },
  completed: {
    bg: "bg-status-retired-bg/20",
    text: "text-status-retired-text",
  },
  cancelled: {
    bg: "bg-status-outofservice-bg/15",
    text: "text-status-outofservice-text",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
        style.bg,
        style.text
      )}
    >
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}
