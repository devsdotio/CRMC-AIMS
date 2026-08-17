"use client";

import { useEffect, useState } from "react";
import { Building2, Check, Edit3, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DepartmentDTO } from "@/features/departments/client";

export interface DepartmentsSectionProps {
  departments: DepartmentDTO[];
  onSave: (input: {
    id?: string;
    code: string;
    name: string;
  }) => Promise<void>;
  onDelete: (department: DepartmentDTO) => Promise<void>;
}

export function DepartmentsSection({
  departments,
  onSave,
  onDelete,
}: DepartmentsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DepartmentDTO | null>(null);

  return (
    <div className="w-full space-y-6">
      <div className="p-6 rounded-2xl border border-border bg-bg space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4 gap-3">
          <div>
            <h3 className="text-base font-bold text-text">Departments</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Master list used for department logins and later issue destinations
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Add Department
          </button>
        </div>

        {departments.length === 0 ? (
          <div className="py-8 text-center bg-bg-subtle/50 rounded-xl border border-dashed border-border">
            <p className="text-xs font-medium text-text-secondary">
              No departments yet.
            </p>
            <p className="text-[11px] text-text-secondary/70 mt-1">
              Add a department before creating a department login.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const hasAccount = Boolean(dept.accountUserId);
              return (
                <div
                  key={dept.id}
                  className="flex items-center justify-between gap-3 p-3.5 bg-bg rounded-xl border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-bg-subtle text-text-secondary shrink-0">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-text block leading-tight truncate">
                        {dept.name}
                      </span>
                      <span className="text-[11px] text-text-secondary font-mono">
                        {dept.code}
                      </span>
                      <span className="text-[11px] text-text-secondary block mt-0.5 truncate">
                        {hasAccount
                          ? `Login: ${dept.accountEmail}${
                              dept.accountStatus === "deactivated"
                                ? " (deactivated)"
                                : ""
                            }`
                          : "No department account yet"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditTarget(dept);
                        setDialogOpen(true);
                      }}
                      aria-label={`Edit ${dept.name}`}
                      className="p-1.5 rounded-md border border-border bg-bg text-text-secondary hover:text-text hover:border-primary transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(dept)}
                      disabled={hasAccount}
                      title={
                        hasAccount
                          ? "Deactivate or reassign the department account before deleting."
                          : `Delete ${dept.name}`
                      }
                      aria-label={`Delete ${dept.name}`}
                      className="p-1.5 rounded-md border border-border bg-bg text-text-secondary hover:border-status-retired-bg hover:text-status-retired-text transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DepartmentDialog
        isOpen={dialogOpen}
        department={editTarget}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSave={onSave}
      />
    </div>
  );
}

function DepartmentDialog({
  isOpen,
  department,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  department: DepartmentDTO | null;
  onClose: () => void;
  onSave: (input: { id?: string; code: string; name: string }) => Promise<void>;
}) {
  const isEditing = Boolean(department);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCode(department?.code ?? "");
    setName(department?.name ?? "");
    setError("");
    setIsSubmitting(false);
  }, [isOpen, department]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }
    if (!code.trim()) {
      setError("Department code is required.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await onSave({
        id: department?.id,
        code: code.trim(),
        name: name.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save department.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={isSubmitting ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="department-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 space-y-4"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 id="department-dialog-title" className="text-base font-bold text-text">
              {isEditing ? "Edit Department" : "Add Department"}
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Code is a short unique label (e.g. REG, IT, FIN).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="dept-name" className="block text-xs font-semibold text-text">
              Name <span className="text-accent">*</span>
            </label>
            <input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Registrar"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="dept-code" className="block text-xs font-semibold text-text">
              Code <span className="text-accent">*</span>
            </label>
            <input
              id="dept-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. REG"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-mono focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-status-outofservice-text">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-text-secondary border border-border rounded-md cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md bg-accent text-accent-foreground cursor-pointer disabled:opacity-50"
              )}
            >
              <Check className="h-3.5 w-3.5" />
              {isSubmitting ? "Saving…" : isEditing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
