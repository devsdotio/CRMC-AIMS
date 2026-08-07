"use client";

import { TrendingUp } from "lucide-react";
import type { SimpleBorrowingEntry, SimpleFrequentBorrowed } from "@/types/reports";

interface BorrowingReportViewProps {
  logs: SimpleBorrowingEntry[];
  frequent: SimpleFrequentBorrowed[];
}

export function BorrowingReportView({ logs, frequent }: BorrowingReportViewProps) {
  const activeLogs = logs.filter((l) => l.status === "Active");
  const overdueLogs = logs.filter((l) => l.isOverdue);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text">Borrowing & Lending Reports</h2>
          <p className="text-xs text-text-secondary">
            Borrowing transaction log, active borrowings, overdue items, and most frequently borrowed equipment.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-bg-subtle px-2.5 py-1 rounded border border-border text-text font-bold">Active: {activeLogs.length}</span>
          <span className="bg-status-outofservice-bg/20 text-status-outofservice-text px-2.5 py-1 rounded border border-status-outofservice-bg/30 font-bold">Overdue: {overdueLogs.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Logs Table */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-border bg-bg-subtle/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Borrowing Transaction Log</h3>
            <span className="text-xs text-text-secondary">{logs.length} Total Entries</span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-subtle border-b border-border text-text-secondary uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Borrower & Dept</th>
                  <th className="p-3">Asset Item</th>
                  <th className="p-3">Borrowed / Due</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-bg-subtle/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-text">{log.borrowerName}</div>
                      <div className="text-[10px] text-text-secondary">{log.borrowerType} • {log.department}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-text">{log.assetName}</div>
                      <div className="text-[10px] text-text-secondary font-mono">{log.assetTag}</div>
                    </td>
                    <td className="p-3 font-mono">
                      <div>Borrowed: {log.borrowedDate}</div>
                      <div className={log.isOverdue ? "text-status-outofservice-bg font-bold" : "text-text-secondary"}>
                        Due: {log.dueDate}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          log.status === "Returned"
                            ? "bg-status-active-bg/20 text-status-active-text"
                            : log.status === "Overdue"
                            ? "bg-status-outofservice-bg/20 text-status-outofservice-text border border-status-outofservice-bg/40 animate-pulse"
                            : "bg-bg-subtle text-text"
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

        {/* Most Borrowed Equipment Card */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <TrendingUp className="h-5 w-5 text-accent" />
            <div>
              <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Most Frequently Borrowed</h3>
              <p className="text-[11px] text-text-secondary">Circulation volume ranking</p>
            </div>
          </div>

          <div className="space-y-3">
            {frequent.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-bg-subtle border border-border space-y-1">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-text">{item.assetName}</span>
                  <span className="font-mono text-accent">{item.borrowCount}x</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                  <span>{item.category}</span>
                  <span>Primary: {item.primaryDepartment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
