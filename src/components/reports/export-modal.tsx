"use client";

import { useState } from "react";
import { X, FileText, FileSpreadsheet, Download, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimpleReportCategory, SimpleUserRole } from "@/types/reports";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: SimpleReportCategory;
  roleView: SimpleUserRole;
  generatedAt: string;
  generatedBy: string;
}

export function ExportModal({
  isOpen,
  onClose,
  activeTab,
  roleView,
  generatedAt,
  generatedBy,
}: ExportModalProps) {
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const handleStartExport = () => {
    setIsExporting(true);
    setExportComplete(false);

    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 1200);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text leading-tight">
                Export Report Data
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Generate formatted report file for download
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
            Select Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat("pdf")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer",
                format === "pdf"
                  ? "bg-bg-subtle border-primary ring-2 ring-primary text-text font-bold"
                  : "bg-card border-border text-text-secondary hover:bg-bg-subtle/50"
              )}
            >
              <FileText className="h-7 w-7 text-status-outofservice-bg" />
              <div>
                <p className="text-xs font-bold">PDF Document</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Printable Report PDF</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer",
                format === "csv"
                  ? "bg-bg-subtle border-primary ring-2 ring-primary text-text font-bold"
                  : "bg-card border-border text-text-secondary hover:bg-bg-subtle/50"
              )}
            >
              <FileSpreadsheet className="h-7 w-7 text-status-active-bg" />
              <div>
                <p className="text-xs font-bold">Excel / CSV Spreadsheet</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Raw Data Table</p>
              </div>
            </button>
          </div>
        </div>

        {/* Audit Details */}
        <div className="p-3.5 rounded-xl border border-border bg-bg-subtle space-y-1.5 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5 font-bold text-text">
            <ShieldCheck className="h-4 w-4 text-status-active-bg" />
            <span>Report Generation Details</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>Report: <strong className="text-text capitalize">{activeTab.replace("-", " ")}</strong></div>
            <div>Role Access: <strong className="text-text">{roleView}</strong></div>
            <div>Timestamp: <strong className="text-text">{generatedAt}</strong></div>
            <div>Generated by: <strong className="text-text">{generatedBy}</strong></div>
          </div>
        </div>

        {/* Export Completion Banner */}
        {exportComplete && (
          <div className="p-3 rounded-lg bg-status-active-bg/15 border border-status-active-bg/30 text-status-active-text text-xs font-bold flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Report exported successfully!
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-card transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            {isExporting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                <span>Exporting {format.toUpperCase()}…</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
