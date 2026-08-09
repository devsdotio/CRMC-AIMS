import { BorrowerPortalProvider } from "@/components/borrower-db/context";
import { RouteGuard } from "@/components/guards/RouteGuard";
import { ReactNode } from "react";

export default function BorrowerDbLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard config={{ allowedRoles: ['borrower'] }}>
      <BorrowerPortalProvider>
        {children}
      </BorrowerPortalProvider>
    </RouteGuard>
  );
}
