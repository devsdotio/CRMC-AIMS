"use client";

import { MyRequestsTab } from "../../../../components/borrower-db/my-requests-tab";

export default function RequestsPage() {
  return (
    <section id="tabpanel-requests" role="tabpanel" aria-labelledby="tab-requests">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">My Requests</h1>
        <p className="text-sm text-text-secondary mt-1">Track the status of your borrow requests.</p>
      </div>
      <MyRequestsTab />
    </section>
  );
}
