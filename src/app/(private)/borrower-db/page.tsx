"use client";

import { BrowseTab } from "../../../components/borrower-db/browse-tab";
import { useBorrowerPortal } from "../../../components/borrower-db/context";
import type { BrowseItem } from "../../../components/borrower-db/types";

export default function BrowsePage() {
  const { openWizard } = useBorrowerPortal();

  return (
    <section id="tabpanel-browse" role="tabpanel" aria-labelledby="tab-browse">
      <BrowseTab />
    </section>
  );
}
