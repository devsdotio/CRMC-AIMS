import { RouteGuard } from "@/components/guards/RouteGuard";
import { STAFF_SHELL_ROLES } from "@/server/shared/roles";
import { ReactNode } from "react";

export default function DashboardPageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RouteGuard config={{ allowedRoles: [...STAFF_SHELL_ROLES] }}>
      {children}
    </RouteGuard>
  );
}
