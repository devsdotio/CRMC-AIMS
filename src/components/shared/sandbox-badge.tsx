import { cn } from "@/lib/utils";

/** Small badge for sandbox/testing catalog rows (superadmin view). */
export function SandboxBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25",
        className
      )}
    >
      Sandbox
    </span>
  );
}
