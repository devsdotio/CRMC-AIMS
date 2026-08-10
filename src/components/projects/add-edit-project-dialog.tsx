"use client";

import { useEffect, useState } from "react";
import { X, FolderPlus, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types/projects";
import { PROJECT_STATUS_LABELS } from "@/types/projects";

export type ProjectFormInput = {
  name: string;
  description: string;
  status: ProjectStatus;
  location: string;
  department: string;
  startDate: string;
  endDate: string;
  budget: string;
  notes: string;
};

export interface AddEditProjectDialogProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSubmit: (input: ProjectFormInput) => void | Promise<void>;
}

function emptyForm(): ProjectFormInput {
  return {
    name: "",
    description: "",
    status: "active",
    location: "",
    department: "",
    startDate: "",
    endDate: "",
    budget: "",
    notes: "",
  };
}

function fromProject(project: Project): ProjectFormInput {
  return {
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    location: project.location ?? "",
    department: project.department ?? "",
    startDate: project.startDate ?? "",
    endDate: project.endDate ?? "",
    budget: project.budget ?? "",
    notes: project.notes ?? "",
  };
}

const MUTABLE_STATUSES: ProjectStatus[] = [
  "draft",
  "active",
  "on_hold",
  "completed",
  "cancelled",
];

export function AddEditProjectDialog({
  isOpen,
  project,
  onClose,
  onSubmit,
}: AddEditProjectDialogProps) {
  const isEdit = Boolean(project);
  const [form, setForm] = useState<ProjectFormInput>(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(project ? fromProject(project) : emptyForm());
    setError("");
    setIsSubmitting(false);
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof ProjectFormInput>(
    key: K,
    value: ProjectFormInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError("End date cannot be earlier than start date.");
      return;
    }
    if (form.budget.trim()) {
      const n = Number(form.budget);
      if (!Number.isFinite(n) || n < 0) {
        setError("Budget must be a non-negative number.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        department: form.department.trim(),
        notes: form.notes.trim(),
        budget: form.budget.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project.");
      setIsSubmitting(false);
    }
  };

  const fieldClass = cn(
    "w-full h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
  );

  const labelClass =
    "block text-[11px] font-bold text-text-secondary mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="absolute inset-0"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-heading"
        className="relative w-full max-w-lg bg-bg border border-border rounded-xl shadow-2xl z-10 overflow-hidden my-4"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              {isEdit ? (
                <Save className="h-4 w-4" />
              ) : (
                <FolderPlus className="h-4 w-4" />
              )}
            </div>
            <div>
              <h2
                id="project-form-heading"
                className="text-sm font-bold text-text"
              >
                {isEdit ? "Edit project" : "Add project"}
              </h2>
              <p className="text-[11px] text-text-secondary">
                {isEdit
                  ? project?.projectCode
                  : "Code is assigned automatically (PRJ-YYYY-…)."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label htmlFor="project-name" className={labelClass}>
              Project name *
            </label>
            <input
              id="project-name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={fieldClass}
              placeholder="e.g. Room 204 renovation"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="project-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="project-description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={2}
              className={cn(fieldClass, "h-auto py-2 resize-y min-h-16")}
              placeholder="Brief scope of the work…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-status" className={labelClass}>
                Status
              </label>
              <select
                id="project-status"
                value={form.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as ProjectStatus)
                }
                className={cn(fieldClass, "cursor-pointer")}
              >
                {MUTABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="project-budget" className={labelClass}>
                Budget (₱, optional)
              </label>
              <input
                id="project-budget"
                type="number"
                min={0}
                step="0.01"
                value={form.budget}
                onChange={(e) => handleChange("budget", e.target.value)}
                className={fieldClass}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-location" className={labelClass}>
                Location
              </label>
              <input
                id="project-location"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className={fieldClass}
                placeholder="Building / room"
              />
            </div>
            <div>
              <label htmlFor="project-department" className={labelClass}>
                Department
              </label>
              <input
                id="project-department"
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                className={fieldClass}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="project-start" className={labelClass}>
                Start date
              </label>
              <input
                id="project-start"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="project-end" className={labelClass}>
                End date
              </label>
              <input
                id="project-end"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="project-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="project-notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={2}
              className={cn(fieldClass, "h-auto py-2 resize-y min-h-14")}
              placeholder="Internal notes…"
            />
          </div>

          {form.status === "completed" && (
            <p className="text-[11px] text-status-repair-text bg-status-repair-bg/15 border border-status-repair-bg/30 rounded-lg px-3 py-2">
              Marking as completed will make this project read-only.
            </p>
          )}

          {error && (
            <p className="text-xs text-status-outofservice-text bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isEdit ? (
                <Save className="h-3.5 w-3.5" />
              ) : (
                <FolderPlus className="h-3.5 w-3.5" />
              )}
              {isSubmitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
