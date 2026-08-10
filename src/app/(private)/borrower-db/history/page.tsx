"use client";

import { BorrowHistoryTab } from "../../../../components/borrower-db/borrow-history-tab";

export default function HistoryPage() {
  return (
    <section id="tabpanel-history" role="tabpanel" aria-labelledby="tab-history">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text">Borrow History</h1>
        <p className="text-sm text-text-secondary mt-1">View your past borrowing log and active items.</p>
      </div>
      <BorrowHistoryTab />
    </section>
  );
}
