"use client";

import { AlertOctagon } from "lucide-react";
import type { SimpleMaintenanceLog, SimpleDamagedLostItem } from "../types";

interface MaintenanceReportViewProps {
  maintenanceLogs: SimpleMaintenanceLog[];
  damagedLogs: SimpleDamagedLostItem[];
}

export function MaintenanceReportView({
  maintenanceLogs,
  damagedLogs,
}: MaintenanceReportViewProps) {
  const totalCost = maintenanceLogs.reduce((acc, m) => acc + m.repairCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text">Maintenance & Condition Reports</h2>
          <p className="text-xs text-text-secondary">
            Maintenance history per asset, items due for maintenance, damaged/lost logs, and repair cost tracking.
          </p>
        </div>
        <div className="font-mono text-xs bg-bg-subtle px-3 py-1.5 rounded-lg border border-border">
          Total Repair Expenditure: <strong className="text-text font-bold">₱{totalCost.toLocaleString()}</strong>
        </div>
      </div>

      {/* Service History Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-border bg-bg-subtle/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Maintenance & Repair History</h3>
          <span className="text-xs text-text-secondary">{maintenanceLogs.length} Records</span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-subtle border-b border-border text-text-secondary uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="p-3">Asset Tag & Description</th>
                <th className="p-3">Department</th>
                <th className="p-3">Service Type & Issue</th>
                <th className="p-3 font-mono">Repair Cost</th>
                <th className="p-3 font-mono">Service Date</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {maintenanceLogs.map((log) => (
                <tr key={log.id} className="hover:bg-bg-subtle/50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-text">{log.assetName}</div>
                    <div className="text-[10px] text-text-secondary font-mono">{log.assetTag}</div>
                  </td>
                  <td className="p-3 font-semibold text-text">
                    {log.department}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-text">{log.serviceType}</div>
                    <div className="text-[10px] text-text-secondary">{log.issue}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-text">
                    ₱{log.repairCost.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-text-secondary">
                    {log.serviceDate}
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        log.status === "Completed"
                          ? "bg-status-active-bg/20 text-status-active-text"
                          : "bg-status-repair-bg/20 text-status-repair-text border border-status-repair-bg/40"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Damaged / Lost Items Log */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <AlertOctagon className="h-5 w-5 text-status-outofservice-bg" />
          <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Damaged, Lost, or Condemned Items Log</h3>
        </div>

        <div className="divide-y divide-border">
          {damagedLogs.map((dmg) => (
            <div key={dmg.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-text">{dmg.assetName} ({dmg.assetTag})</div>
                <div className="text-[11px] text-text-secondary">Reason: {dmg.reason} • Department: {dmg.department}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-status-outofservice-bg font-bold">Cost Impact: ₱{dmg.costImpact.toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-outofservice-bg/20 text-status-outofservice-text">
                  {dmg.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
