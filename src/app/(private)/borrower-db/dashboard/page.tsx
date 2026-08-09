import { BorrowerDashboard } from "../../../../components/borrower-db/borrower-dashboard";

export const metadata = {
  title: "My Dashboard | AIMS Borrower Portal",
  description: "Overview of your active borrowings, pending requests, and borrowing history.",
};

export default function BorrowerDashboardPage() {
  return (
    <section id="borrower-dashboard" aria-label="Borrower Dashboard">
      <BorrowerDashboard />
    </section>
  );
}
