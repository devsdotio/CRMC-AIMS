"use client";

import { useEffect, useState } from "react";
import { PackageMinus, X } from "lucide-react";
import type { ConsumableItem } from "@/types/inventory";
import { useDepartmentsQuery } from "@/features/departments/client";
import { useProjectsQuery } from "@/features/projects/client";
import { fetchJson, type ApiResponse } from "@/features/shared/fetch-json";
import { useQueryClient } from "@tanstack/react-query";
import { consumableQueryKeys } from "@/features/consumables/client/query-keys";
import { purchaseLotQueryKeys } from "@/features/purchase-lots/client/query-keys";
import { stockMovementQueryKeys } from "@/features/stock-movements/client/query-keys";

export interface IssueConsumableDialogProps {
  item: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

type DestinationKind = "department" | "project";

export function IssueConsumableDialog({
  item,
  isOpen,
  onClose,
  onSuccess,
}: IssueConsumableDialogProps) {
  const qc = useQueryClient();
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: projects = [] } = useProjectsQuery();

  const [destinationKind, setDestinationKind] =
    useState<DestinationKind>("department");
  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [receivedBy, setReceivedBy] = useState("");
  const [requestedByName, setRequestedByName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setQuantity(1);
    setReceivedBy("");
    setRequestedByName("");
    setNotes("");
    setDepartmentId(departments[0]?.id ?? "");
    setProjectId(
      projects.find((p) => p.status !== "completed")?.id ?? projects[0]?.id ?? ""
    );
    setDestinationKind("department");
  }, [isOpen, item, departments, projects]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (destinationKind === "department" && !departmentId) {
      setError("Select a department.");
      return;
    }
    if (destinationKind === "project" && !projectId) {
      setError("Select a project.");
      return;
    }
    if (item.currentQty < 1) {
      setError(
        "Not on hand. Restock first. Purchase orders will be added later."
      );
      return;
    }
    if (quantity > item.currentQty) {
      setError(
        `Not on hand. Available: ${item.currentQty} ${item.unit}. Restock first.`
      );
      return;
    }

    setPending(true);
    try {
      await fetchJson<ApiResponse<ConsumableItem>>(
        `/api/consumables/${item.id}/issue`,
        {
          method: "POST",
          body: JSON.stringify({
            quantity,
            departmentId:
              destinationKind === "department" ? departmentId : undefined,
            projectId: destinationKind === "project" ? projectId : undefined,
            useFifo: true,
            receivedBy: receivedBy.trim() || undefined,
            requestedByName: requestedByName.trim() || undefined,
            notes: notes.trim() || undefined,
          }),
        }
      );
      qc.invalidateQueries({ queryKey: consumableQueryKeys.all });
      qc.invalidateQueries({ queryKey: purchaseLotQueryKeys.all });
      qc.invalidateQueries({ queryKey: stockMovementQueryKeys.all });
      onSuccess?.(`${item.itemCode} issued (${quantity} ${item.unit}).`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Issue failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !pending && onClose()}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-bg shadow-xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-text">Issue supplies</h2>
            <p className="text-xs text-text-secondary mt-0.5 font-mono">
              {item.itemCode} · {item.currentQty} {item.unit} on hand
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-bg-subtle text-text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-text-secondary">
            Manual issue from on-hand stock. Destination is exactly one department or project. Consumables are not returned.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDestinationKind("department")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                destinationKind === "department"
                  ? "border-primary bg-primary/5 text-text"
                  : "border-border text-text-secondary"
              }`}
            >
              Department
            </button>
            <button
              type="button"
              onClick={() => setDestinationKind("project")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border ${
                destinationKind === "project"
                  ? "border-primary bg-primary/5 text-text"
                  : "border-border text-text-secondary"
              }`}
            >
              Project
            </button>
          </div>

          {destinationKind === "department" ? (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold uppercase text-text-secondary">
                Department
              </span>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-border rounded-lg bg-bg"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block space-y-1">
              <span className="text-[11px] font-bold uppercase text-text-secondary">
                Project
              </span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-9 px-3 text-sm border border-border rounded-lg bg-bg"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectCode})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-[11px] font-bold uppercase text-text-secondary">
              Quantity
            </span>
            <input
              type="number"
              min={1}
              max={item.currentQty}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full h-9 px-3 text-sm border border-border rounded-lg bg-bg"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold uppercase text-text-secondary">
              Received by (optional)
            </span>
            <input
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="Person who picked up"
              className="w-full h-9 px-3 text-sm border border-border rounded-lg bg-bg"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold uppercase text-text-secondary">
              Requested by (optional)
            </span>
            <input
              value={requestedByName}
              onChange={(e) => setRequestedByName(e.target.value)}
              placeholder="Person on paper slip"
              className="w-full h-9 px-3 text-sm border border-border rounded-lg bg-bg"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-bold uppercase text-text-secondary">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg resize-none"
            />
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || item.currentQty < 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          >
            <PackageMinus className="h-3.5 w-3.5" />
            {pending ? "Issuing…" : "Confirm issue"}
          </button>
        </div>
      </form>
    </div>
  );
}
