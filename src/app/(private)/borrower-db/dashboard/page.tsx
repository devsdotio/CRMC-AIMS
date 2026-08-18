import { BorrowerDashboard } from "../../../../components/borrower-db/borrower-dashboard";

export const metadata = {
  title: "Department portal | AIMS",
  description: "Overview of this department's requests, active borrowings, and history.",
};

export default function BorrowerDashboardPage() {
  return (
    <section id="borrower-dashboard" aria-label="Borrower Dashboard">
      <BorrowerDashboard />
    </section>
  );
}
