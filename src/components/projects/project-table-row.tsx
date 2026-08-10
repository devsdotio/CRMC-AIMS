"use client";

import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import type { Project } from "@/types/projects";
import { ProjectStatusBadge } from "./project-status-badge";
import { formatPhp } from "./format-money";

export interface ProjectTableRowProps {
  project: Project;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectTableRow({
  project,
  onSelect,
  onEdit,
  onDelete,
}: ProjectTableRowProps) {
  const canDelete =
    project.isMutable &&
    (project.status === "draft" || project.status === "cancelled");

  return (
    <tr
      className="border-b border-border bg-bg hover:bg-bg-subtle/60 transition-colors cursor-pointer"
      onClick={() => onSelect(project)}
    >
      <td className="px-5 py-4">
        <div className="font-bold text-sm text-text leading-tight">
          {project.name}
        </div>
        <div className="text-[11px] font-mono text-text-secondary mt-0.5">
          {project.projectCode}
        </div>
      </td>
      <td className="px-3 py-4">
        <ProjectStatusBadge status={project.status} />
      </td>
      <td className="px-3 py-4 text-xs text-text-secondary hidden md:table-cell">
        {project.location || "—"}
      </td>
      <td className="px-3 py-4 text-xs text-text-secondary hidden lg:table-cell">
        {project.department || "—"}
      </td>
      <td className="px-3 py-4 text-xs font-mono tabular-nums text-text hidden sm:table-cell">
        {project.budget ? formatPhp(project.budget) : "—"}
      </td>
      <td className="px-3 py-4 text-xs font-mono tabular-nums text-text-secondary hidden sm:table-cell">
        {formatPhp(project.totalSpent)}
      </td>
      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onSelect(project)}
            className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-bold rounded-md border border-border bg-bg-subtle text-text hover:bg-border/60 transition-colors cursor-pointer"
            title="View"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          {project.isMutable && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-bold rounded-md border border-border bg-bg text-text hover:bg-bg-subtle transition-colors cursor-pointer"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(project)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border text-status-outofservice-text hover:bg-status-outofservice-bg/10 transition-colors cursor-pointer"
              title="Delete"
              aria-label="Delete project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {!project.isMutable && (
            <span className="inline-flex items-center h-7 px-2 text-[10px] font-bold text-text-secondary">
              <MoreHorizontal className="h-3.5 w-3.5 opacity-40" />
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
