"use client";

import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/providers/toast-context";
import { formatFriendlyNetworkError } from "@/lib/network-error";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const lastErrorToastRef = useRef<{ message: string; timestamp: number }>({
    message: "",
    timestamp: 0,
  });

  const notifyError = (error: unknown, fallback?: string) => {
    const friendly = formatFriendlyNetworkError(error, fallback);
    const now = Date.now();
    // Throttle identical or rapid succession network error toasts (2.5 seconds debounce)
    if (
      lastErrorToastRef.current.message === friendly &&
      now - lastErrorToastRef.current.timestamp < 2500
    ) {
      return;
    }
    lastErrorToastRef.current = { message: friendly, timestamp: now };
    toast.error(friendly);
  };

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            notifyError(error, "Failed to load data. Please check your connection.");
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            notifyError(error, "Operation could not be completed. Please try again.");
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            retryDelay: 800,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Listen to browser network changes (offline/online)
  useEffect(() => {
    function handleOffline() {
      toast.error(
        "You are currently offline. Actions will be unavailable until connection is restored."
      );
    }
    function handleOnline() {
      toast.success("Connection restored. You are back online.");
      queryClient.invalidateQueries();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [toast, queryClient]);

  // Pass height so layouts can own scoped scroll (`h-full` + `overflow-y-auto`).
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </QueryClientProvider>
  );
}
