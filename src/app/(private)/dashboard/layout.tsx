import { RouteGuard } from "@/components/guards/RouteGuard";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RouteGuard config={{ allowedRoles: ['admin'] }}>
      {children}
    </RouteGuard>
  );
}
