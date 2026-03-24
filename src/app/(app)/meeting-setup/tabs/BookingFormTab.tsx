"use client";

import React from "react";
import {
  FieldLabel,
  Input,
  Select,
  Toggle,
} from "@/components/ui/form-primitives";
import type { FormField, TabProps } from "../types";

export default function BookingFormTab({ config, update }: TabProps) {
  function addField() {
    const id = `custom_${Date.now()}`;
    update("formFields", [
      ...config.formFields,
      { id, label: "", type: "text", required: false },
    ]);
  }

  function removeField(id: string) {
    update(
      "formFields",
      config.formFields.filter((f) => f.id !== id),
    );
  }

  function updateField(id: string, patch: Partial<FormField>) {
    update(
      "formFields",
      config.formFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }

  function moveField(id: string, direction: -1 | 1) {
    const fields = [...config.formFields];
    const idx = fields.findIndex((f) => f.id === id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= fields.length) return;
    [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
    update("formFields", fields);
  }

  return (
    <div className="p-5 space-y-6">
      {/* Form fields */}
      <div>
        <h4
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--cal-heading)" }}
        >
          Form fields
        </h4>
        <div className="space-y-3">
          {config.formFields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--cal-border)", background: "white" }}
            >
              <div className="flex items-start gap-3">
                {/* Reorder arrows (custom fields only) */}
                {!field.isDefault && (
                  <div className="flex flex-col gap-0.5 pt-5">
                    <button
                      type="button"
                      onClick={() => moveField(field.id, -1)}
                      disabled={idx === 0}
                      className="text-xs disabled:opacity-20"
                      style={{ color: "var(--cal-mid)" }}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(field.id, 1)}
                      disabled={idx === config.formFields.length - 1}
                      className="text-xs disabled:opacity-20"
                      style={{ color: "var(--cal-mid)" }}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                )}

                <div className="flex-1 grid gap-3 sm:grid-cols-[1fr,140px]">
                  <div>
                    <FieldLabel>Field label</FieldLabel>
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        updateField(field.id, { label: e.target.value })
                      }
                      placeholder="Question text"
                      disabled={field.isDefault}
                    />
                  </div>
                  <div>
                    <FieldLabel>Type of field</FieldLabel>
                    <Select
                      value={field.type}
                      onChange={(e) =>
                        updateField(field.id, {
                          type: e.target.value as FormField["type"],
                        })
                      }
                      disabled={field.isDefault}
                    >
                      <option value="text">Short text</option>
                      <option value="textarea">Long text</option>
                      <option value="single-select">Single select</option>
                      <option value="multi-select">Multi select</option>
                      <option value="phone">Phone</option>
                      <option value="file">File upload</option>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-5">
                  <Toggle
                    enabled={field.required}
                    onChange={(val) =>
                      updateField(field.id, { required: val })
                    }
                    label="Required"
                  />
                  {!field.isDefault && (
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="text-rose-500 hover:text-rose-700 text-lg font-bold px-1"
                      title="Remove field"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Options editor for select types */}
              {(field.type === "single-select" ||
                field.type === "multi-select") &&
                !field.isDefault && (
                  <div className="mt-3">
                    <FieldLabel>Options (one per line)</FieldLabel>
                    <textarea
                      value={(field.options || []).join("\n")}
                      onChange={(e) =>
                        updateField(field.id, {
                          options: e.target.value.split("\n"),
                        })
                      }
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                      style={{
                        borderColor: "var(--cal-border)",
                        color: "var(--cal-heading)",
                      }}
                      placeholder={"Option 1\nOption 2\nOption 3"}
                    />
                  </div>
                )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addField}
          className="mt-3 rounded-lg border-2 border-dashed w-full px-4 py-3 text-sm font-semibold transition-colors"
          style={{
            borderColor: "var(--cal-btn)",
            color: "var(--cal-primary)",
          }}
        >
          + Add custom question
        </button>
      </div>

      {/* After Booking */}
      <div>
        <h4
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--cal-heading)" }}
        >
          After booking
        </h4>
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: "var(--cal-border)", background: "white" }}
        >
          <FieldLabel>Redirect URL (optional)</FieldLabel>
          <Input
            value={config.afterBookingRedirect}
            onChange={(e) => update("afterBookingRedirect", e.target.value)}
            placeholder="https://yoursite.com/thank-you"
          />
          <p
            className="text-xs mt-1.5"
            style={{ color: "var(--cal-mid)" }}
          >
            Leave empty to show the default confirmation page.
          </p>
        </div>
      </div>
    </div>
  );
}
