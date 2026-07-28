"use client";

import { useState, useEffect } from "react";
import { X, QrCode, Camera, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QRScanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (assetCode: string) => void;
  title?: string;
  subtitle?: string;
}

export function QRScanDialog({
  isOpen,
  onClose,
  onResolve,
  title = "Scan Asset QR Code",
  subtitle = "Point camera at asset tag or manually enter code for lookup",
}: QRScanDialogProps) {
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [cameraAccess, setCameraAccess] = useState<"pending" | "denied" | "simulated">("simulated");

  useEffect(() => {
    if (isOpen) {
      setManualCode("");
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

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter a valid asset tag code (e.g. CP-080, AV-031).");
      return;
    }
    onResolve(cleaned);
    onClose();
  };

  const handleSimulatedScan = (sampleCode: string) => {
    onResolve(sampleCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-scan-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 id="qr-scan-title" className="text-base font-bold text-text leading-tight">
                {title}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder Simulation Area */}
        <div className="relative flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border bg-bg-subtle overflow-hidden p-4 text-center">
          {cameraAccess === "simulated" && (
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center w-24 h-24 rounded-lg border-2 border-accent bg-black/5 animate-pulse">
                <Camera className="h-8 w-8 text-accent opacity-80" />
                <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-accent" />
                <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-accent" />
                <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-accent" />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-accent" />
              </div>
              <p className="text-xs text-text-secondary">
                Viewfinder active — scanning physical QR code tag
              </p>
            </div>
          )}

          {cameraAccess === "denied" && (
            <div className="p-3 bg-status-outofservice-bg/10 border border-status-outofservice-bg/20 rounded-lg text-xs text-status-outofservice-text">
              <AlertCircle className="h-5 w-5 mx-auto mb-1" />
              Camera permission denied or unavailable. Please use manual entry below.
            </div>
          )}
        </div>

        {/* Quick Sample Scan Shortcuts for Demo */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">
            Demo Quick Scan Shortcuts:
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {["CP-080", "AV-031", "TR-004", "FN-045"].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => handleSimulatedScan(code)}
                className="px-2.5 py-1 rounded bg-bg-subtle border border-border text-text hover:border-accent hover:text-accent font-mono font-semibold transition-colors cursor-pointer"
              >
                Scan {code}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Code Fallback Form */}
        <form onSubmit={handleSubmitManual} className="space-y-3 pt-2 border-t border-border">
          <label htmlFor="manual-code-input" className="block text-xs font-semibold text-text">
            Manual Asset Code Entry
          </label>
          <div className="flex gap-2">
            <input
              id="manual-code-input"
              type="text"
              value={manualCode}
              onChange={(e) => {
                setManualCode(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. CP-080, AV-031"
              className={cn(
                "flex-1 h-9 px-3 text-xs bg-bg border rounded-lg font-mono font-semibold text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent",
                error ? "border-status-outofservice-bg" : "border-border"
              )}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 h-9 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-accent transition-colors cursor-pointer shadow-xs"
            >
              <Search className="h-3.5 w-3.5" />
              Lookup
            </button>
          </div>
          {error && <p className="text-[11px] font-semibold text-status-outofservice-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}
