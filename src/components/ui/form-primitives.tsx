"use client";

import React from "react";

/* ================================================================
   SHARED UI PRIMITIVES
   Re-usable across the meeting-setup builder and anywhere else
   that needs consistent form elements.
   ================================================================ */

export function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      style={{ color: "var(--cal-mid)" }}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function InfoIcon({ tip }: { tip: string }) {
  return (
    <span className="hint-icon" data-tip={tip} aria-label="Info">
      ?
    </span>
  );
}

export function Section({
  label,
  summary,
  tooltip,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  summary: string;
  tooltip?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--cal-border)" }}>
      <button
        type="button"
        onClick={onToggle}
        className="setup-section-btn w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        style={{ background: expanded ? "var(--cal-hover)" : undefined }}
      >
        <div className="flex items-center gap-2">
          <div
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--cal-mid)" }}
          >
            {label}
          </div>
          {tooltip && <InfoIcon tip={tooltip} />}
        </div>
        <div className="flex-1 min-w-0">
          {!expanded && (
            <div className="text-sm mt-0.5 truncate" style={{ color: "var(--cal-heading)" }}>
              {summary}
            </div>
          )}
        </div>
        <ChevronDown open={expanded} />
      </button>
      {expanded && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

export function Input({
  className = "",
  style,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${className}`}
      style={
        {
          borderColor: "var(--cal-border)",
          color: "var(--cal-heading)",
          background: "white",
          "--tw-ring-color": "rgba(106, 142, 142, 0.2)",
          ...style,
        } as React.CSSProperties
      }
    />
  );
}

export function Select({
  className = "",
  style,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...rest}
      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${className}`}
      style={{
        borderColor: "var(--cal-border)",
        color: "var(--cal-heading)",
        background: "white",
        ...style,
      }}
    >
      {children}
    </select>
  );
}

export function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}) {
  return (
    <button type="button" onClick={() => onChange(!enabled)} className="flex items-center gap-2">
      <div
        className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
        style={{ background: enabled ? "var(--cal-primary)" : "var(--cal-border)" }}
      >
        <span
          className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: enabled ? "translateX(18px)" : "translateX(3px)" }}
        />
      </div>
      {label && (
        <span className="text-sm" style={{ color: "var(--cal-text)" }}>
          {label}
        </span>
      )}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: "var(--cal-mid)" }}
    >
      {children}
    </label>
  );
}
