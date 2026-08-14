"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

const DURATION = 4_000;

const variantStyles: Record<
  ToastVariant,
  { wrapper: string; icon: string; IconComponent: typeof CheckCircle }
> = {
  success: {
    wrapper: "bg-[#2ECC71] border border-[#27ae60] shadow-lg",
    icon: "text-white",
    IconComponent: CheckCircle,
  },
  error: {
    wrapper: "bg-white border border-red-200 shadow-lg",
    icon: "text-red-500",
    IconComponent: XCircle,
  },
  info: {
    wrapper: "bg-white border border-blue-200 shadow-lg",
    icon: "text-blue-500",
    IconComponent: Info,
  },
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Mount → slide in
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss(), DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  }

  const { wrapper, icon, IconComponent } = variantStyles[toast.variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        transition: "opacity 300ms ease, transform 300ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(1rem)",
      }}
      className={`flex items-start gap-3 w-80 rounded-xl px-4 py-3.5 ${wrapper}`}
    >
      <IconComponent className={`h-4 w-4 mt-0.5 shrink-0 ${icon}`} />
      <p className={`flex-1 text-sm font-medium leading-snug ${toast.variant === "success" ? "text-white" : "text-text"}`}>
        {toast.message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className={`shrink-0 transition-colors cursor-pointer ${toast.variant === "success" ? "text-white/70 hover:text-white" : "text-text-secondary hover:text-text"}`}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((variant: ToastVariant, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, variant, message }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    success: (msg) => add("success", msg),
    error: (msg) => add("error", msg),
    info: (msg) => add("info", msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Portal — fixed bottom-right, above all modals */}
      <div
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
