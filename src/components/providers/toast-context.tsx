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
import { CheckCircle, XCircle, AlertTriangle, Info, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  duration?: number;
  action?: ToastAction;
}

interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  action?: ToastAction;
  duration?: number;
}

export interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

const DEFAULT_DURATION = 4_000;
const ACTION_DURATION = 8_000;

const variantStyles: Record<
  ToastVariant,
  {
    wrapper: string;
    icon: string;
    textColor: string;
    IconComponent: typeof CheckCircle;
  }
> = {
  success: {
    wrapper: "bg-[#2ECC71] border border-[#27ae60] shadow-xl",
    icon: "text-white",
    textColor: "text-white",
    IconComponent: CheckCircle,
  },
  warning: {
    wrapper: "bg-red-600 border border-red-500 shadow-xl",
    icon: "text-white",
    textColor: "text-white",
    IconComponent: AlertTriangle,
  },
  error: {
    wrapper: "bg-red-600 border border-red-500 shadow-xl",
    icon: "text-white",
    textColor: "text-white",
    IconComponent: XCircle,
  },
  info: {
    wrapper: "bg-white border border-blue-300 shadow-xl",
    icon: "text-blue-600",
    textColor: "text-zinc-900",
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

  function dismiss() {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  }

  // Auto-dismiss: give users longer if there is an actionable button
  useEffect(() => {
    const timeoutMs =
      toast.duration ?? (toast.action ? ACTION_DURATION : DEFAULT_DURATION);
    timerRef.current = setTimeout(() => dismiss(), timeoutMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.duration, toast.action]);

  const { wrapper, icon, textColor, IconComponent } =
    variantStyles[toast.variant];

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        transition: "opacity 300ms ease, transform 300ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(1rem)",
      }}
      className={`flex items-start gap-3 w-84 sm:w-96 rounded-xl px-4 py-3.5 ${wrapper}`}
    >
      <IconComponent className={`h-4 w-4 mt-0.5 shrink-0 ${icon}`} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={`text-sm font-semibold leading-snug ${textColor}`}>
          {toast.message}
        </p>
        {toast.action && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                dismiss();
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-xs",
                toast.variant === "info"
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                  : toast.variant === "success"
                    ? "bg-white/25 text-white hover:bg-white/35"
                    : "bg-white text-red-600 hover:bg-white/90 active:bg-white/80 font-bold"
              )}
            >
              <RefreshCw className="h-3 w-3" />
              {toast.action.label}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className={cn(
          "shrink-0 transition-colors cursor-pointer p-0.5 rounded-md",
          toast.variant === "info"
            ? "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
            : "text-white/80 hover:text-white hover:bg-white/15"
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [
        ...prev,
        {
          id,
          variant,
          message,
          action: options?.action,
          duration: options?.duration,
        },
      ]);
    },
    []
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value: ToastContextValue = {
    success: (msg, opts) => add("success", msg, opts),
    error: (msg, opts) => add("error", msg, opts),
    warning: (msg, opts) => add("warning", msg, opts),
    info: (msg, opts) => add("info", msg, opts),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Portal — fixed bottom-right, above all modals */}
      <div
        aria-label="Notifications"
        data-theme="light"
        className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2 pointer-events-none"
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
