"use client";

import { useBorrowRequests } from "@/features/borrow-requests/client/use-borrow-requests";
import { ClipboardList } from "lucide-react";

export function BorrowRequestsList() {
  const { data: response, isLoading } = useBorrowRequests();
  const requests = response?.data || [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-text-secondary animate-pulse">Loading borrow requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <ClipboardList className="h-12 w-12 text-text-secondary mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-text">No Borrow Requests</h3>
        <p className="text-sm text-text-secondary max-w-sm mt-1">
          Historical and active borrow requests will appear here.
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
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Borrower</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((req: any) => (
              <tr key={req.id} className="hover:bg-bg-subtle/50 transition-colors">
                <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(req.createdAt))}
                </td>
                <td className="px-4 py-3 font-medium text-text">{req.borrowerName}</td>
                <td className="px-4 py-3 text-text-secondary">{req.department || "-"}</td>
                <td className="px-4 py-3 text-text">
                  {req.items.length} item{req.items.length !== 1 ? "s" : ""}
                </td>
                <td className="px-4 py-3">
                  <span className="capitalize text-xs font-semibold px-2 py-1 rounded-full bg-bg-subtle border border-border text-text">
                    {req.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
