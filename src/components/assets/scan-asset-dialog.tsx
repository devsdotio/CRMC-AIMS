"use client";

import { useEffect, useState } from "react";
import { Loader2, QrCode, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useResolveScanMutation,
  useScanReleaseMutation,
  useScanReturnMutation,
} from "@/features/assets/client/use-assets";
import type { ScanResolveResult } from "@/features/assets/client/assets-api";

function nextWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function ScanAssetDialog({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [code, setCode] = useState("");
  const [resolved, setResolved] = useState<ScanResolveResult | null>(null);
  const [error, setError] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerDepartment, setBorrowerDepartment] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState(nextWeek);
  const [condition, setCondition] = useState("good");
  const [flagMaintenance, setFlagMaintenance] = useState(false);

  const resolveMutation = useResolveScanMutation();
  const releaseMutation = useScanReleaseMutation();
  const returnMutation = useScanReturnMutation();

  const busy =
    resolveMutation.isPending ||
    releaseMutation.isPending ||
    returnMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setCode("");
    setResolved(null);
    setError("");
    setBorrowerName("");
    setBorrowerDepartment("");
    setExpectedReturnDate(nextWeek());
    setCondition("good");
    setFlagMaintenance(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Enter a QR payload or asset code.");
      return;
    }
    try {
      const result = await resolveMutation.mutateAsync(code.trim());
      setResolved(result);
    } catch (err) {
      setResolved(null);
      setError(err instanceof Error ? err.message : "Could not resolve that code.");
    }
  };

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolved) return;
    if (!borrowerName.trim()) {
      setError("Borrower name is required.");
      return;
    }
    setError("");
    try {
      await releaseMutation.mutateAsync({
        code: resolved.code,
        borrowerName: borrowerName.trim(),
        borrowerDepartment: borrowerDepartment.trim() || undefined,
        expectedReturnDate: expectedReturnDate || undefined,
      });
      onSuccess(`${resolved.asset.assetCode} released.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to release asset.");
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolved) return;
    setError("");
    try {
      await returnMutation.mutateAsync({
        code: resolved.code,
        condition,
        flagMaintenance,
      });
      onSuccess(`${resolved.asset.assetCode} returned.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to return asset.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-asset-title"
        className="relative z-10 w-full max-w-md rounded-xl bg-bg border border-border shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-accent" />
            <h2 id="scan-asset-title" className="text-sm font-bold text-text">
              Scan asset code
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleResolve} className="space-y-2">
            <label htmlFor="scan-code" className="block text-xs font-bold text-text">
              QR payload or asset code
            </label>
            <div className="flex gap-2">
              <input
                id="scan-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CRMC-AIMS:AST-0001"
                className="flex-1 h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent font-mono"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 h-9 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {resolveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Lookup
              </button>
            </div>
          </form>

          {error && (
            <p className="text-xs font-semibold text-status-outofservice-text">{error}</p>
          )}

          {resolved && (
            <div className="rounded-lg border border-border bg-bg-subtle p-3 space-y-3">
              <div>
                <p className="text-sm font-bold text-text">{resolved.asset.name}</p>
                <p className="text-xs font-mono text-text-secondary">{resolved.asset.assetCode}</p>
                <p className="text-[11px] text-text-secondary mt-1">
                  Suggested: <strong className="text-text">{resolved.suggestedAction}</strong>
                  {resolved.reason ? ` — ${resolved.reason}` : ""}
                </p>
              </div>

              {resolved.suggestedAction === "release" && (
                <form onSubmit={handleRelease} className="space-y-2">
                  <input
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="Borrower name"
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg"
                  />
                  <input
                    value={borrowerDepartment}
                    onChange={(e) => setBorrowerDepartment(e.target.value)}
                    placeholder="Department"
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg"
                  />
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className={cn(
                      "w-full h-9 text-xs font-bold rounded-lg bg-accent text-accent-foreground",
                      busy && "opacity-60"
                    )}
                  >
                    {releaseMutation.isPending ? "Releasing…" : "Release from scan"}
                  </button>
                </form>
              )}

              {resolved.suggestedAction === "return" && (
                <form onSubmit={handleReturn} className="space-y-2">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg"
                  >
                    <option value="good">Good condition</option>
                    <option value="damaged">Damaged</option>
                    <option value="needs_repair">Needs repair</option>
                  </select>
                  <label className="flex items-center gap-2 text-xs text-text">
                    <input
                      type="checkbox"
                      checked={flagMaintenance}
                      onChange={(e) => setFlagMaintenance(e.target.checked)}
                    />
                    Flag for maintenance
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className={cn(
                      "w-full h-9 text-xs font-bold rounded-lg bg-accent text-accent-foreground",
                      busy && "opacity-60"
                    )}
                  >
                    {returnMutation.isPending ? "Returning…" : "Return from scan"}
                  </button>
                </form>
              )}

              {(resolved.suggestedAction === "project" ||
                resolved.suggestedAction === "blocked") && (
                <p className="text-xs text-text-secondary">
                  This unit cannot be released or returned from the scanner. Use Projects or the asset record instead.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
