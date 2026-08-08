"use client";

import { MyRequestsTab } from "../../../../components/borrower-db/my-requests-tab";
import { INITIAL_MY_REQUESTS } from "../../../../components/borrower-db/mock-data";
import { useState } from "react";
import type { PortalBorrowRequest } from "../../../../components/borrower-db/types";

export default function RequestsPage() {
  const [requests, setRequests] = useState<PortalBorrowRequest[]>(INITIAL_MY_REQUESTS);

  const handleCancelConfirmed = (requestId: string) => {
    // Optimistic update for cancellation
    setRequests(requests.filter((r) => r.id !== requestId));
  };

  return (
    <section id="tabpanel-requests" role="tabpanel" aria-labelledby="tab-requests">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">My Requests</h1>
        <p className="text-sm text-text-secondary mt-1">Track the status of your borrow requests.</p>
      </div>
      <MyRequestsTab
        requests={requests}
        onCancelConfirmed={handleCancelConfirmed}
      />
    </section>
  );
}
