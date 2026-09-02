"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Printer,
  FileText,
  Building2,
  Calendar,
  Check,
  Download,
} from "lucide-react";
import type { PurchaseLot } from "@/types/purchase-lots";
import { formatDateTime } from "@/components/audit-logs/audit-log-utils";

interface POPrintSlipDialogProps {
  lot: PurchaseLot | null;
  isOpen: boolean;
  onClose: () => void;
}

export function POPrintSlipDialog({
  lot,
  isOpen,
  onClose,
}: POPrintSlipDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [requestedBy, setRequestedBy] = useState("");
  const [requestedByTitle, setRequestedByTitle] = useState("Staff / Requester");

  useEffect(() => {
    if (lot) {
      setRequestedBy(lot.recordedByName || "");
    }
  }, [lot]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lot) return null;

  const poDate = lot.purchasedOn || lot.createdAt.split("T")[0];
  const unitCostNum = parseFloat(lot.unitCost) || 0;
  const totalCostNum = parseFloat(lot.totalCost) || 0;
  const effectiveRequestedBy = requestedBy.trim() || lot.recordedByName || "Authorized Staff";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CRMC Purchase Order - ${lot.lotCode}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.5in;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #111;
              background: #FFF;
            }
            .po-document {
              max-width: 780px;
              margin: 0 auto;
              border: 1px solid #333;
              padding: 24px;
              box-sizing: border-box;
            }
            .header-container {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              margin-bottom: 24px;
            }
            .college-info {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .college-logo {
              width: 54px;
              height: 54px;
              border-radius: 50%;
              border: 1.5px solid #1B2140;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 11px;
              background: #f4f4f6;
            }
            .college-titles h1 {
              font-size: 14px;
              font-weight: 900;
              margin: 0;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .college-titles p {
              font-size: 11px;
              margin: 2px 0 0 0;
              color: #444;
            }
            .po-meta {
              text-align: right;
            }
            .po-title {
              font-size: 20px;
              font-weight: 900;
              letter-spacing: 1px;
              margin: 0 0 6px 0;
              text-transform: uppercase;
            }
            .meta-line {
              font-size: 12px;
              margin: 3px 0;
            }
            .meta-line strong {
              font-family: monospace;
              font-size: 13px;
              border-bottom: 1px solid #111;
              display: inline-block;
              min-width: 130px;
              text-align: center;
              padding: 0 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12px;
            }
            th, td {
              border: 1.5px solid #222;
              padding: 10px 8px;
              text-align: left;
            }
            th {
              font-weight: 800;
              text-align: center;
              background: #fafafa;
              text-transform: capitalize;
            }
            .col-qty { width: 12%; text-align: center; font-weight: bold; }
            .col-desc { width: 34%; }
            .col-dealer { width: 20%; }
            .col-purpose { width: 18%; }
            .col-estimated { width: 16%; text-align: right; font-family: monospace; }
            .empty-row td {
              height: 28px;
            }
            .signatures-container {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            .sig-block {
              width: 45%;
            }
            .sig-label {
              font-weight: 700;
              margin-bottom: 40px;
            }
            .sig-line {
              border-bottom: 1.5px solid #222;
              min-height: 24px;
              text-align: center;
              font-weight: bold;
              padding-bottom: 2px;
            }
            .sig-title {
              font-size: 11px;
              color: #444;
              text-align: center;
              margin-top: 4px;
            }
            @media print {
              body { padding: 0; }
              .po-document { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="po-document">
            <div class="header-container">
              <div class="college-info">
                <div class="college-logo">CRMC</div>
                <div class="college-titles">
                  <h1>Cebu Roosevelt Memorial Colleges, Inc.</h1>
                  <p>San Vicente St., Bogo City, Cebu</p>
                </div>
              </div>
              <div class="po-meta">
                <h2 class="po-title">Purchase Order</h2>
                <div class="meta-line">P.O Number: <strong>${lot.poNumber || lot.lotCode}</strong></div>
                <div class="meta-line">Date: <strong>${poDate}</strong></div>
                <div class="meta-line" style="font-size: 10px; color: #555;">Lot Code: <strong style="min-width:auto; font-size:10px; border-bottom:none;">${lot.lotCode}</strong></div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="col-qty">Quantity</th>
                  <th class="col-desc">Description</th>
                  <th class="col-dealer">Suggested Dealer</th>
                  <th class="col-purpose">Purpose</th>
                  <th class="col-estimated">Estimated</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="col-qty">${lot.quantity}</td>
                  <td class="col-desc">
                    <strong>${lot.itemName}</strong>
                    <div style="font-size: 10px; color: #555; font-family: monospace; margin-top: 2px;">
                      Code: ${lot.itemCode}
                    </div>
                  </td>
                  <td class="col-dealer">${lot.supplierName || "Direct Procurement"}</td>
                  <td class="col-purpose">${lot.notes || "Institutional Inventory & Operations"}</td>
                  <td class="col-estimated">
                    ₱${totalCostNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td></tr>
                <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td></tr>
                <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td></tr>
                <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td></tr>
                <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td></tr>
              </tbody>
            </table>

            <div class="signatures-container">
              <div class="sig-block">
                <div class="sig-label">Requested by:</div>
                <div class="sig-line">${effectiveRequestedBy}</div>
                <div class="sig-title">${requestedByTitle}</div>
              </div>
              <div class="sig-block">
                <div class="sig-label">Approved by:</div>
                <div class="sig-line">JACINTO ANTONIO R. LEPITEN JR.</div>
                <div class="sig-title">Head Property Custodian</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="official-po-title"
        className="relative w-full max-w-3xl h-[680px] max-h-[90vh] rounded-2xl border border-border bg-bg shadow-2xl z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <h2 id="official-po-title" className="text-sm font-bold text-text">
              Official CRMC Purchase Order Document Preview
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Customization Options Toolbar */}
        <div className="px-6 py-2.5 bg-bg-subtle/80 border-b border-border flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 flex-wrap">
            <span className="text-[11px] font-bold text-text-secondary whitespace-nowrap">
              Requested by:
            </span>
            <input
              type="text"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              placeholder="Requester name…"
              className="h-8 px-2.5 text-xs rounded-lg border border-border bg-bg text-text focus:bg-bg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-hidden transition-colors flex-1 min-w-36 max-w-xs font-semibold"
            />
            <input
              type="text"
              value={requestedByTitle}
              onChange={(e) => setRequestedByTitle(e.target.value)}
              placeholder="Title / Role"
              className="h-8 px-2.5 text-xs rounded-lg border border-border bg-bg text-text focus:bg-bg focus:border-accent focus:ring-1 focus:ring-accent focus:outline-hidden transition-colors w-36"
            />
          </div>

          {(requestedBy !== (lot.recordedByName || "") || requestedByTitle !== "Staff / Requester") && (
            <button
              type="button"
              onClick={() => {
                setRequestedBy(lot.recordedByName || "");
                setRequestedByTitle("Staff / Requester");
              }}
              className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
            >
              Reset to default
            </button>
          )}
        </div>

        {/* Document Body (matching physical form) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg-subtle/40">
          <div
            ref={printRef}
            className="max-w-2xl mx-auto p-6 md:p-8 bg-card rounded-xl border border-border shadow-md space-y-6 text-xs text-text"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-0.5">
                <h1 className="text-sm font-extrabold tracking-tight text-text uppercase">
                  Cebu Roosevelt Memorial Colleges, Inc.
                </h1>
                <p className="text-[11px] text-text-secondary">
                  San Vicente St., Bogo City, Cebu
                </p>
              </div>

              <div className="text-right space-y-1">
                <h2 className="text-base font-black tracking-wider uppercase text-text">
                  Purchase Order
                </h2>
                <div className="text-[11px] space-y-0.5">
                  <div>
                    P.O Number: <strong className="font-mono text-text">{lot.poNumber || lot.lotCode}</strong>
                  </div>
                  <div>
                    Date: <strong className="text-text">{poDate}</strong>
                  </div>
                  <div className="text-[10px] text-text-secondary font-mono">
                    Lot Code: <span>{lot.lotCode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Column Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-bg-subtle text-text border-b border-border font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5 text-center w-16 border-r border-border">Quantity</th>
                    <th className="px-3 py-2.5 border-r border-border">Description</th>
                    <th className="px-3 py-2.5 border-r border-border">Suggested Dealer</th>
                    <th className="px-3 py-2.5 border-r border-border">Purpose</th>
                    <th className="px-3 py-2.5 text-right">Estimated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-3 py-3 text-center font-bold text-text border-r border-border">
                      {lot.quantity}
                    </td>
                    <td className="px-3 py-3 border-r border-border">
                      <strong className="text-text block">{lot.itemName}</strong>
                      <span className="font-mono text-[10px] text-text-secondary">
                        Code: {lot.itemCode}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-text-secondary border-r border-border">
                      {lot.supplierName || "Direct / Internal Procurement"}
                    </td>
                    <td className="px-3 py-3 text-text-secondary border-r border-border">
                      {lot.notes || "Institutional Inventory & Operations"}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-status-active-text">
                      ₱{totalCostNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="h-8">
                      <td className="border-r border-border"></td>
                      <td className="border-r border-border"></td>
                      <td className="border-r border-border"></td>
                      <td className="border-r border-border"></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures matching form */}
            <div className="grid grid-cols-2 gap-8 pt-6">
              <div className="space-y-6">
                <span className="text-[11px] font-bold text-text-secondary block">
                  Requested by:
                </span>
                <div className="pt-2 border-b border-text/80 text-center">
                  <span className="font-bold text-xs text-text">{effectiveRequestedBy}</span>
                </div>
                <p className="text-[10px] text-text-secondary text-center -mt-4">
                  {requestedByTitle}
                </p>
              </div>

              <div className="space-y-6">
                <span className="text-[11px] font-bold text-text-secondary block">
                  Approved by:
                </span>
                <div className="pt-2 border-b border-text/80 text-center">
                  <span className="font-bold text-xs text-text">
                    JACINTO ANTONIO R. LEPITEN JR.
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary text-center -mt-4">
                  Head Property Custodian
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-between shrink-0">
          <span className="text-xs text-text-secondary font-medium">
            Formatted to official CRMC Purchase Order specs
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-accent transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Print Official PO Slip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
