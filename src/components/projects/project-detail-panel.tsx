"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  X,
  Pencil,
  MapPin,
  Building2,
  Calendar,
  Wallet,
  User,
  FileText,
  Package,
  Boxes,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/projects";
import { ProjectStatusBadge } from "./project-status-badge";
import { formatPhp } from "./format-money";

export interface ProjectDetailPanelProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-text">{children}</dd>
    </div>
  );
}

export function ProjectDetailPanel({
  project,
  isOpen,
  onClose,
  onEdit,
}: ProjectDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-detail-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <ProjectStatusBadge status={project.status} />
              {!project.isMutable && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-subtle border border-border text-text-secondary">
                  <Lock className="h-3 w-3" />
                  Read-only
                </span>
              )}
            </div>
            <h2
              id="project-detail-heading"
              className="text-base font-bold text-text mt-0.5 leading-tight"
            >
              {project.name}
            </h2>
            <p className="text-[11px] font-mono text-text-secondary mt-0.5">
              {project.projectCode}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project detail"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section className="grid grid-cols-2 gap-4">
            <div className="col-span-2 p-3 rounded-lg border border-border bg-bg-subtle/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Budget overview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] text-text-secondary font-medium">
                    Budget
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-text">
                    {project.budget ? formatPhp(project.budget) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-secondary font-medium">
                    Spent
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-text">
                    {formatPhp(project.totalSpent)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-text-secondary font-medium">
                    Remaining
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-text">
                    {project.budgetRemaining != null
                      ? formatPhp(project.budgetRemaining)
                      : "—"}
                  </div>
                </div>
              </div>
            </div>

            <Field label="Location">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                {project.location || "—"}
              </span>
            </Field>
            <Field label="Department">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                {project.department || "—"}
              </span>
            </Field>
            <Field label="Start date">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                {project.startDate || "—"}
              </span>
            </Field>
            <Field label="End date">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                {project.endDate || "—"}
              </span>
            </Field>
            <Field label="Created by">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                {project.createdByName}
              </span>
            </Field>
          </section>

          {project.description && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-2">
                <FileText className="h-3.5 w-3.5" />
                Description
              </h3>
              <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </section>
          )}

          {project.notes && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Notes
              </h3>
              <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                {project.notes}
              </p>
            </section>
          )}

          {/* Phase 2 / 3 / 4 placeholders keep the shell ready without fake data */}
          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Linked activity
            </h3>
            <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
              <div className="flex items-start gap-2.5 opacity-70">
                <Boxes className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-text">Expenses & materials</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Coming next — misc costs, then inventory consumables with supplier pricing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 opacity-70">
                <Package className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-text">Assigned assets</p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Coming later — project custody (assign/return) without a borrower account.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-border bg-bg-subtle/40 shrink-0 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            Close
          </button>
          {project.isMutable && (
            <button
              type="button"
              onClick={() => onEdit(project)}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit project
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
