import { BorrowerDashboard } from "../../../../components/borrower-db/borrower-dashboard";
import {
  SUMMARY_STATS,
  MY_BORROW_HISTORY,
  INITIAL_MY_REQUESTS,
} from "../../../../components/borrower-db/mock-data";

export const metadata = {
  title: "My Dashboard | AIMS Borrower Portal",
  description: "Overview of your active borrowings, pending requests, and borrowing history.",
};

export default function BorrowerDashboardPage() {
  const activeItems = MY_BORROW_HISTORY.filter(
    (r) => r.status === "active" || r.status === "overdue"
  );

  return (
    <section id="borrower-dashboard" aria-label="Borrower Dashboard">
      <BorrowerDashboard
        stats={SUMMARY_STATS}
        activeItems={activeItems}
        recentRequests={INITIAL_MY_REQUESTS}
      />
    </section>
  );
}
