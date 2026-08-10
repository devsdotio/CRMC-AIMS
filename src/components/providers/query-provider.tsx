"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Pass height so layouts can own scoped scroll (`h-full` + `overflow-y-auto`).
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </QueryClientProvider>
  );
}
