"use client";

import { useState, useEffect } from "react";
import { X, ArrowUpFromLine, User, Package, Calendar, QrCode, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowLogRecord } from "./types";

export interface ReleaseAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRelease: (releaseData: {
    borrowerName: string;
    department: string;
    assetCode: string;
    assetName: string;
    dueDate: string;
    notes?: string;
  }) => void;
  onTriggerScanQR: () => void;
}

export function ReleaseAssetDialog({
  isOpen,
  onClose,
  onConfirmRelease,
  onTriggerScanQR,
}: ReleaseAssetDialogProps) {
  const [borrowerName, setBorrowerName] = useState("");
  const [department, setDepartment] = useState("IT");
  const [assetCode, setAssetCode] = useState("");
  const [assetName, setAssetName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setBorrowerName("");
      setDepartment("IT");
      setAssetCode("CP-080");
      setAssetName("Dell Latitude 5420 Laptop");
      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 7);
      setDueDate(defaultDue.toISOString().split("T")[0]);
      setNotes("");
      setVerified(false);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) {
      setError("Please enter the borrower's full name.");
      return;
    }
    if (!assetCode.trim()) {
      setError("Please specify the asset tag code being released.");
      return;
    }
    if (!dueDate) {
      setError("Please specify the expected return due date.");
      return;
    }
    if (!verified) {
      setError("Please confirm physical item inspection before processing release.");
      return;
    }

    onConfirmRelease({
      borrowerName: borrowerName.trim(),
      department: department.trim(),
      assetCode: assetCode.trim().toUpperCase(),
      assetName: assetName.trim() || assetCode.trim(),
      dueDate,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-dialog-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <ArrowUpFromLine className="h-5 w-5" />
            </div>
            <div>
              <h3 id="release-dialog-title" className="text-base font-bold text-text leading-tight">
                Process Physical Asset Release
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Record checkout handoff of an approved asset to borrower
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close release dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Lookup & Scan Row */}
          <div className="p-3.5 rounded-xl border border-border bg-bg-subtle space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="release-asset-code" className="text-xs font-bold text-text">
                Asset Tag Code <span className="text-accent">*</span>
              </label>
              <button
                type="button"
                onClick={onTriggerScanQR}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                Scan Tag
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                id="release-asset-code"
                type="text"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
                placeholder="e.g. CP-080, AV-031"
                className="h-9 px-3 text-xs bg-bg border border-border rounded-lg font-mono font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Asset Item Name"
                className="h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Borrower Name & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="borrower-name-input" className="block text-xs font-semibold text-text">
                Borrower Name <span className="text-accent">*</span>
              </label>
              <input
                id="borrower-name-input"
                type="text"
                value={borrowerName}
                onChange={(e) => {
                  setBorrowerName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Full Name (Personnel)"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="department-select-release" className="block text-xs font-semibold text-text">
                Department <span className="text-accent">*</span>
              </label>
              <select
                id="department-select-release"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {["IT", "Finance", "HR", "Engineering", "Admin", "Communications", "Executive", "Operations"].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expected Due Date */}
          <div className="space-y-1">
            <label htmlFor="due-date-input" className="block text-xs font-semibold text-text">
              Expected Return Date <span className="text-accent">*</span>
            </label>
            <input
              id="due-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="release-notes-input" className="block text-xs font-semibold text-text">
              Handoff Notes (Accessories, Cables, Conditions)
            </label>
            <textarea
              id="release-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Issued with power adapter & protective pouch…"
              className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Verification Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-bg-subtle cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => {
                setVerified(e.target.checked);
                if (error) setError("");
              }}
              className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            <span className="text-xs text-text leading-tight">
              I confirm physical item inspection and borrower identification verification before release.
            </span>
          </label>

          {error && <p className="text-xs font-bold text-status-outofservice-text">{error}</p>}

          {/* Footer Actions */}
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
              Process Checkout Handoff
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
