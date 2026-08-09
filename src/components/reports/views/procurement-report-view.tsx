"use client";

import {  Landmark } from "lucide-react";
import type { SimpleAcquisitionItem } from "@/types/reports";

interface ProcurementReportViewProps {
  acquisitions: SimpleAcquisitionItem[];
}

export function ProcurementReportView({ acquisitions }: ProcurementReportViewProps) {
  const totalSpent = acquisitions.reduce((acc, a) => acc + a.totalCost, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text">Procurement & Acquisition Reports</h2>
          <p className="text-xs text-text-secondary">
            Newly added assets per period and acquisition cost summary over time.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-border">
          <Landmark className="h-4 w-4 text-status-active-bg" />
          <span className="text-xs font-semibold text-text-secondary">Total Acquisition Spend:</span>
          <span className="font-mono text-sm font-extrabold text-text">₱{totalSpent.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-2xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle border-b border-border text-text-secondary uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="p-3 font-mono">Acquisition Date</th>
                <th className="p-3">Asset Description & Category</th>
                <th className="p-3">Department</th>
                <th className="p-3">Supplier</th>
                <th className="p-3 text-center font-mono">Quantity</th>
                <th className="p-3 text-right font-mono">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {acquisitions.map((item) => (
                <tr key={item.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-text">
                    {item.acquisitionDate}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-text">{item.assetName}</div>
                    <div className="text-[10px] text-text-secondary">{item.category}</div>
                  </td>
                  <td className="p-3 font-semibold text-text">
                    {item.department}
                  </td>
                  <td className="p-3 text-text-secondary">
                    {item.supplier}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-text">
                    {item.quantity}
                  </td>
                  <td className="p-3 text-right font-mono font-extrabold text-text">
                    ₱{item.totalCost.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
