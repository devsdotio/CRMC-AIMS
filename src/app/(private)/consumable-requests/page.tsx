import { redirect } from "next/navigation";

export default function ConsumableRequestsRedirectPage() {
  redirect("/borrow-requests?kind=supply");
}
