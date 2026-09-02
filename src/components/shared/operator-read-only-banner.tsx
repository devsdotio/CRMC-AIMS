"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAssetOperator } from "@/hooks/use-asset-operator";

export function OperatorReadOnlyBanner() {
  const [mounted, setMounted] = useState(false);
  const { canOperate, isLoading } = useAssetOperator();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || canOperate) {
    return null;
  }

  return (
    <div className="mx-4 md:mx-6 mt-3 flex items-start gap-2 rounded-lg border border-status-repair-bg/40 bg-status-repair-bg/10 px-3 py-2 text-xs text-status-repair-text shrink-0">
      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        You have <strong>view-only</strong> access. Approve, release, restock,
        and other property custodian actions require an administrator account.
      </span>
    </div>
  );
}
