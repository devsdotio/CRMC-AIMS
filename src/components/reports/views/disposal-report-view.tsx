"use client";


import type { SimpleDisposalItem } from "@/types/reports";

interface DisposalReportViewProps {
  disposals: SimpleDisposalItem[];
}

export function DisposalReportView({ disposals }: DisposalReportViewProps) {
  const totalOriginalCost = disposals.reduce((acc, d) => acc + d.originalCost, 0);
  const totalSalvageValue = disposals.reduce((acc, d) => acc + d.salvageValue, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text">Disposal & Write-off Reports</h2>
          <p className="text-xs text-text-secondary">
            Disposed and written-off assets list with reason, original acquisition cost, salvage value, and approval authority.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs bg-bg-subtle px-3 py-1.5 rounded-lg border border-border">
          <span>Cost Written Off: <strong className="text-status-outofservice-bg font-bold">₱{totalOriginalCost.toLocaleString()}</strong></span>
          <span className="text-border">|</span>
          <span>Salvage Recovered: <strong className="text-status-active-text font-bold">₱{totalSalvageValue.toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-2xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle border-b border-border text-text-secondary uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="p-3 font-mono">Disposal Date</th>
                <th className="p-3">Asset Tag & Description</th>
                <th className="p-3">Department & Category</th>
                <th className="p-3 font-mono">Original Cost</th>
                <th className="p-3 font-mono">Salvage Value</th>
                <th className="p-3">Reason for Disposal</th>
                <th className="p-3 text-right">Approved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {disposals.map((item) => (
                <tr key={item.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-text">
                    {item.disposalDate}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-text">{item.assetName}</div>
                    <div className="text-[10px] text-text-secondary font-mono">{item.assetTag}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-text">{item.department}</div>
                    <div className="text-[10px] text-text-secondary">{item.category}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-text">
                    ₱{item.originalCost.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-status-active-text font-bold">
                    ₱{item.salvageValue.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-outofservice-bg/20 text-status-outofservice-text">
                      {item.disposalReason}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-text">
                    {item.approvedBy}
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
