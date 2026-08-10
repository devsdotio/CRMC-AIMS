"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  Plus,
  Trash2,
  Lock,
  AlertTriangle,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, ProjectExpenseLine } from "@/types/projects";
import { PROJECT_EXPENSE_CATEGORY_LABELS } from "@/types/projects";
import { ProjectStatusBadge } from "./project-status-badge";
import { formatPhp } from "./format-money";
import {
  useCreateProjectExpenseMutation,
  useDeleteProjectExpenseMutation,
  useProjectExpensesQuery,
  useProjectMaterialMutation,
  useUpdateProjectExpenseMutation,
} from "@/features/projects/client";
import { useConsumablesQuery } from "@/features/consumables/client";
import {
  AddEditExpenseDialog,
  type ExpenseFormInput,
} from "./add-edit-expense-dialog";
import {
  AddMaterialDialog,
  type MaterialFormInput,
} from "./add-material-dialog";

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
  const {
    data: expenses = [],
    isLoading: expensesLoading,
  } = useProjectExpensesQuery(isOpen && project ? project.id : null);

  const createExpense = useCreateProjectExpenseMutation();
  const updateExpense = useUpdateProjectExpenseMutation();
  const deleteExpense = useDeleteProjectExpenseMutation();
  const useMaterial = useProjectMaterialMutation();
  const {
    data: consumables = [],
    isLoading: consumablesLoading,
  } = useConsumablesQuery();

  const [editExpense, setEditExpense] = useState<
    ProjectExpenseLine | null | undefined
  >(undefined);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "Escape" &&
        isOpen &&
        editExpense === undefined &&
        !materialOpen
      )
        onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, editExpense, materialOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEditExpense(undefined);
      setMaterialOpen(false);
      setActionError(null);
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const overBudget =
    project.budgetRemaining != null && Number(project.budgetRemaining) < 0;

  const handleExpenseSubmit = async (input: ExpenseFormInput) => {
    setActionError(null);
    const payload = {
      lineType: input.lineType,
      category: input.category,
      description: input.description,
      amount: input.amount,
      incurredOn: input.incurredOn || undefined,
      notes: input.notes || null,
    };
    if (editExpense) {
      await updateExpense.mutateAsync({
        projectId: project.id,
        expenseId: editExpense.id,
        payload,
      });
    } else {
      await createExpense.mutateAsync({
        projectId: project.id,
        payload,
      });
    }
  };

  const handleMaterialSubmit = async (input: MaterialFormInput) => {
    setActionError(null);
    await useMaterial.mutateAsync({
      projectId: project.id,
      payload: {
        consumableId: input.consumableId,
        quantity: input.quantity,
        notes: input.notes || null,
      },
    });
  };

  const handleDeleteExpense = async (line: ProjectExpenseLine) => {
    const msg =
      line.lineType === "consumable"
        ? `Remove material charge “${line.description}”? Stock and purchase lots will be restored.`
        : `Delete expense “${line.description}”?`;
    if (!window.confirm(msg)) return;
    setActionError(null);
    try {
      await deleteExpense.mutateAsync({
        projectId: project.id,
        expenseId: line.id,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete expense."
      );
    }
  };

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
                {overBudget && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-status-outofservice-text">
                    <AlertTriangle className="h-3 w-3" />
                    Over budget
                  </span>
                )}
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
                  <div
                    className={cn(
                      "text-sm font-bold font-mono tabular-nums",
                      overBudget
                        ? "text-status-outofservice-text"
                        : "text-text"
                    )}
                  >
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

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Expenses & materials
              </h3>
              {project.isMutable && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMaterialOpen(true)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-bold rounded-md border border-border bg-bg text-text hover:bg-bg-subtle cursor-pointer"
                  >
                    <Boxes className="h-3.5 w-3.5" />
                    Materials
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExpense(null)}
                    className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-bold rounded-md bg-accent text-accent-foreground cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Misc
                  </button>
                </div>
              )}
            </div>

            {actionError && (
              <p className="text-[11px] text-status-outofservice-text">
                {actionError}
              </p>
            )}

            {expensesLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-12 bg-border rounded-lg" />
                <div className="h-12 bg-border rounded-lg" />
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-[11px] text-text-secondary border border-dashed border-border rounded-lg p-3">
                No spend yet. Use <strong>Materials</strong> for inventory (stock
                checkout + lot cost) or <strong>Misc</strong> for travel, snacks,
                fees, and adjustments.
              </p>
            ) : (
              <ul className="space-y-2">
                {expenses.map((line) => {
                  const amount = Number(line.amount);
                  const isCredit = amount < 0;
                  const isMaterial = line.lineType === "consumable";
                  return (
                    <li
                      key={line.id}
                      className="rounded-lg border border-border bg-bg-subtle/40 px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-text truncate">
                              {line.description}
                            </span>
                            {isMaterial && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/15 text-accent">
                                <Boxes className="h-2.5 w-2.5" />
                                Inventory
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-text-secondary mt-0.5">
                            {isMaterial
                              ? [
                                  line.quantity != null
                                    ? `qty ${Number(line.quantity)}`
                                    : null,
                                  line.unitCost != null
                                    ? `@ ${formatPhp(line.unitCost)}`
                                    : null,
                                  line.incurredOn,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")
                              : `${PROJECT_EXPENSE_CATEGORY_LABELS[line.category]} · ${line.incurredOn}`}
                            {line.recordedByName
                              ? ` · ${line.recordedByName}`
                              : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={cn(
                              "font-mono font-bold tabular-nums",
                              isCredit
                                ? "text-status-active-text"
                                : "text-text"
                            )}
                          >
                            {formatPhp(line.amount)}
                          </span>
                          {project.isMutable &&
                            (line.lineType === "miscellaneous" ||
                              line.lineType === "adjustment") && (
                              <button
                                type="button"
                                onClick={() => setEditExpense(line)}
                                className="p-1 rounded-md border border-border hover:bg-bg cursor-pointer"
                                aria-label="Edit expense"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                          {project.isMutable &&
                            (line.lineType === "miscellaneous" ||
                              line.lineType === "adjustment" ||
                              line.lineType === "consumable") && (
                              <button
                                type="button"
                                onClick={() => {
                                  void handleDeleteExpense(line);
                                }}
                                className="p-1 rounded-md border border-border text-status-outofservice-text hover:bg-status-outofservice-bg/10 cursor-pointer"
                                aria-label="Delete expense"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Assigned assets
            </h3>
            <div className="rounded-lg border border-dashed border-border p-3 flex items-start gap-2.5 opacity-70">
              <Package className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-text">Coming later</p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Project custody (assign/return) without a borrower account.
                </p>
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

      <AddEditExpenseDialog
        isOpen={editExpense !== undefined}
        expense={editExpense ?? null}
        onClose={() => setEditExpense(undefined)}
        onSubmit={handleExpenseSubmit}
      />

      <AddMaterialDialog
        isOpen={materialOpen}
        items={consumables}
        loadingItems={consumablesLoading}
        onClose={() => setMaterialOpen(false)}
        onSubmit={handleMaterialSubmit}
      />
    </div>
  );
}
