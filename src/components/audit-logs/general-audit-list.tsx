"use client";

import { useAuditLogsQuery } from "@/features/audit-logs/client/use-audit-logs";
import { History } from "lucide-react";

export function GeneralAuditList() {
  const { data: logs = [], isLoading } = useAuditLogsQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-text-secondary animate-pulse">Loading general audit logs...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <History className="h-12 w-12 text-text-secondary mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-text">No General Logs Found</h3>
        <p className="text-sm text-text-secondary max-w-sm mt-1">
          System events and administrative actions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-bg-subtle text-text-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Entity Type</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-bg-subtle/50 transition-colors">
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(log.timestamp))}
                </td>
                <td className="px-4 py-3 font-medium text-text capitalize">
                  {log.action.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-text-secondary capitalize">
                  {log.entityType.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-text">{log.actorName}</td>
                <td className="px-4 py-3 text-text-secondary max-w-xs truncate">
                  {log.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
