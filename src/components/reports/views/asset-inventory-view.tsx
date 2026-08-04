"use client";

import type { SimpleAssetItem } from "../types";

interface AssetInventoryViewProps {
  assets: SimpleAssetItem[];
}

export function AssetInventoryView({ assets }: AssetInventoryViewProps) {
  const totalCost = assets.reduce((acc, a) => acc + a.cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text">Asset Inventory Summary Ledger</h2>
          <p className="text-xs text-text-secondary">
            Master list of all assets with tag/serial number, category, acquisition date, cost, condition, and location.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs bg-bg-subtle px-3 py-1.5 rounded-lg border border-border">
          <span>Total Count: <strong className="text-text">{assets.length}</strong></span>
          <span className="text-border">|</span>
          <span>Total Value: <strong className="text-text">₱{totalCost.toLocaleString()}</strong></span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-2xs">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle border-b border-border text-text-secondary uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="p-3">Asset Tag / Serial</th>
                <th className="p-3">Item Description & Category</th>
                <th className="p-3">Department & Location</th>
                <th className="p-3 font-mono">Acquisition Date</th>
                <th className="p-3 font-mono">Cost</th>
                <th className="p-3">Condition</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assets.map((ast) => (
                <tr key={ast.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-3 font-mono">
                    <div className="font-bold text-text">{ast.tagNumber}</div>
                    <div className="text-[10px] text-text-secondary">{ast.serialNumber}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-text">{ast.name}</div>
                    <div className="text-[10px] text-text-secondary">{ast.category}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-text">{ast.department}</div>
                    <div className="text-[10px] text-text-secondary">{ast.location}</div>
                  </td>
                  <td className="p-3 font-mono text-text-secondary">
                    {ast.acquisitionDate}
                  </td>
                  <td className="p-3 font-mono font-bold text-text">
                    ₱{ast.cost.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                        ast.condition === "Good"
                          ? "bg-status-active-bg/20 text-status-active-text"
                          : ast.condition === "Fair"
                          ? "bg-bg-subtle text-text"
                          : "bg-status-outofservice-bg/20 text-status-outofservice-text"
                      }`}
                    >
                      {ast.condition}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-text">
                    {ast.status}
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
