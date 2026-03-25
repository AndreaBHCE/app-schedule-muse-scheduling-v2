"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/* ── Types ──────────────────────────────────────────────── */

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  /** Show a toast notification. Auto-dismisses after `durationMs` (default 4 s). */
  toast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Hook ───────────────────────────────────────────────── */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

/* ── Provider ───────────────────────────────────────────── */

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = 4000) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, variant }]);

      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  // Clean up timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {typeof window !== "undefined" &&
        createPortal(
          <div
            aria-live="polite"
            aria-label="Notifications"
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              pointerEvents: "none",
              maxWidth: 420,
            }}
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/* ── Single toast ───────────────────────────────────────── */

const VARIANT_STYLES: Record<
  ToastVariant,
  { bg: string; border: string; text: string; icon: string }
> = {
  success: {
    bg: "#ecfdf5",
    border: "#6ee7b7",
    text: "#065f46",
    icon: "✓",
  },
  error: {
    bg: "#fef2f2",
    border: "#fca5a5",
    text: "#991b1b",
    icon: "✕",
  },
  info: {
    bg: "var(--cal-bg, #fff)",
    border: "var(--cal-border, #e5e7eb)",
    text: "var(--cal-heading, #111827)",
    icon: "ℹ",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  const s = VARIANT_STYLES[toast.variant];
  return (
    <div
      role="status"
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 10,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        fontSize: 14,
        fontWeight: 500,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        animation: "toast-slide-in 0.25s ease-out",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: s.text,
          opacity: 0.5,
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
