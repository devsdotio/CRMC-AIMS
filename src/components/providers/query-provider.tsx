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

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        retryDelay: 800,
        // Custodians and borrowers act on the same records from different tabs,
        // so returning to a tab resyncs anything older than the stale window.
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();

  const [queryClient] = useState(createQueryClient);

  // Subscribe to query/mutation errors in effect to keep render pure
  useEffect(() => {
    let lastError = { message: "", timestamp: 0 };

    const unsubscribeQuery = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.action.error;
        const friendly = formatFriendlyNetworkError(
          error,
          "Failed to load data. Please check your connection."
        );
        const now = Date.now();
        if (lastError.message === friendly && now - lastError.timestamp < 2500) {
          return;
        }
        lastError = { message: friendly, timestamp: now };
        toast.error(friendly);
      }
    });

    const unsubscribeMutation = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.action.error;
        const friendly = formatFriendlyNetworkError(
          error,
          "Operation could not be completed. Please try again."
        );
        const now = Date.now();
        if (lastError.message === friendly && now - lastError.timestamp < 2500) {
          return;
        }
        lastError = { message: friendly, timestamp: now };
        toast.error(friendly);
      }
    });

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
    };
  }, [toast, queryClient]);

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
