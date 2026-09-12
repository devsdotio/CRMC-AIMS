"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { UserRole } from "@/types/users";

const STORAGE_KEY = "crmc.showSandbox";

type SandboxVisibilityContextValue = {
  /** True only when the signed-in user is superadmin AND the toggle is on. */
  includeSandbox: boolean;
  /** Raw preference (may be true even for non-superadmin; ignored until role matches). */
  preference: boolean;
  canToggle: boolean;
  setShowSandbox: (next: boolean) => void;
};

const SandboxVisibilityContext =
  createContext<SandboxVisibilityContextValue | null>(null);

export function SandboxVisibilityProvider({
  children,
  role,
}: {
  children: ReactNode;
  /** Current actor role from the private shell (preferred over another /api/me fetch). */
  role?: UserRole | null;
}) {
  // Default ON so superadmin keeps seeing sandbox rows after flagging them.
  // localStorage "0" is the only explicit hide.
  const [preference, setPreference] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "0") setPreference(false);
      else if (stored === "1") setPreference(true);
    } catch {
      // keep default true
    }
  }, []);

  const canToggle = role === "superadmin";
  const includeSandbox = canToggle && preference;

  const setShowSandbox = useCallback(
    (next: boolean) => {
      setPreference(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore quota / private mode
      }
      void queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const value = useMemo(
    () => ({
      includeSandbox,
      preference,
      canToggle,
      setShowSandbox,
    }),
    [includeSandbox, preference, canToggle, setShowSandbox]
  );

  return (
    <SandboxVisibilityContext.Provider value={value}>
      {children}
    </SandboxVisibilityContext.Provider>
  );
}

export function useSandboxVisibility(): SandboxVisibilityContextValue {
  const ctx = useContext(SandboxVisibilityContext);
  if (!ctx) {
    return {
      includeSandbox: false,
      preference: false,
      canToggle: false,
      setShowSandbox: () => undefined,
    };
  }
  return ctx;
}

/** Append includeSandbox=true when the superadmin toggle is on. */
export function appendIncludeSandbox(
  sp: URLSearchParams,
  includeSandbox: boolean | undefined
) {
  if (includeSandbox) sp.set("includeSandbox", "true");
}
