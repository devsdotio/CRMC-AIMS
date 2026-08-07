"use client";

import { useState, useEffect } from "react";
import { X, RotateCcw, AlertTriangle, Check } from "lucide-react";
import type { BorrowLogRecord, ReturnCondition } from "@/types/borrow-log";
import { ConditionSelect } from "./condition-select";

export interface ReturnAssetDialogProps {
  record: BorrowLogRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReturn: (record: BorrowLogRecord, condition: ReturnCondition, notes?: string) => void;
}

interface ReturnAssetDialogFormProps {
  record: BorrowLogRecord;
  onClose: () => void;
  onConfirmReturn: ReturnAssetDialogProps["onConfirmReturn"];
}

function ReturnAssetDialogForm({
  record,
  onClose,
  onConfirmReturn,
}: ReturnAssetDialogFormProps) {
  const [condition, setCondition] = useState<ReturnCondition>("good");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmReturn(record, condition, notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-dialog-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 id="return-dialog-title" className="text-base font-bold text-text leading-tight">
                Process Asset Return Check-In
              </h3>
              <p className="text-xs text-text-secondary mt-0.5 font-mono">
                {record.logCode} · Tag {record.assetCode}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close return dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl border border-border bg-bg-subtle space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-text">{record.assetName}</span>
            <span className="font-mono font-bold text-text-secondary">{record.assetCode}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 text-text-secondary pt-1 border-t border-border">
            <span>Borrower: <strong className="text-text">{record.borrowerName}</strong> ({record.department})</span>
            <span>Due: <strong className="text-text">{record.dueDate}</strong></span>
          </div>
          {record.status === "overdue" && record.daysOverdue && (
            <div className="mt-1.5 p-2 rounded bg-status-outofservice-bg/10 border border-status-outofservice-bg/20 text-status-outofservice-text font-semibold flex items-center gap-1.5 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Item returned {record.daysOverdue} days after scheduled due date.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
              Returned Condition Assessment <span className="text-accent">*</span>
            </label>
            <ConditionSelect value={condition} onChange={setCondition} />
          </div>

          <div className="space-y-1">
            <label htmlFor="return-notes-input" className="block text-xs font-semibold text-text">
              Condition & Inspection Notes
            </label>
            <textarea
              id="return-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="State any wear, physical damage, missing cables, or maintenance notes…"
              className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Confirm Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ReturnAssetDialog({
  record,
  isOpen,
  onClose,
  onConfirmReturn,
}: ReturnAssetDialogProps) {
  if (!isOpen || !record) return null;

  return (
    <ReturnAssetDialogForm
      key={record.id}
      record={record}
      onClose={onClose}
      onConfirmReturn={onConfirmReturn}
    />
  );
}
