"use client";

import { AlertCircle } from "lucide-react";

/**
 * Inline fail-state for list pages so errors never look like perpetual skeleton.
 */
export function QueryErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-4 md:mx-6 mt-3 flex items-start gap-2 rounded-lg border border-status-outofservice-bg/40 bg-status-outofservice-bg/10 px-3 py-2 text-xs text-status-outofservice-text">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p>{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 font-semibold underline underline-offset-2 cursor-pointer hover:opacity-80"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
