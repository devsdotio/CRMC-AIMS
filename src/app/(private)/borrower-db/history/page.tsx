"use client";

import { BorrowHistoryTab } from "../../../../components/borrower-db/borrow-history-tab";
import { MY_BORROW_HISTORY } from "../../../../components/borrower-db/mock-data";

export default function HistoryPage() {
  return (
    <section id="tabpanel-history" role="tabpanel" aria-labelledby="tab-history">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Borrow History</h1>
        <p className="text-sm text-text-secondary mt-1">View your past borrowing log and active items.</p>
      </div>
      <BorrowHistoryTab records={MY_BORROW_HISTORY} />
    </section>
  );
}
