"use client";

import React from "react";
import { FieldLabel, Input } from "@/components/ui/form-primitives";
import type { TabProps } from "../types";

export default function EmbedDesignerTab({ config, update }: TabProps) {
  const bookingUrl = `https://app.schedulemuseai.com/${config.pageSlug}`;

  const snippet =
    config.embedMode === "inline"
      ? `<div id="schedulemuse-embed"></div>\n<script src="https://app.schedulemuseai.com/embed.js"\n  data-slug="${config.pageSlug}"\n  data-mode="inline"></script>`
      : config.embedMode === "lightbox"
        ? `<script src="https://app.schedulemuseai.com/embed.js"\n  data-slug="${config.pageSlug}"\n  data-mode="lightbox"\n  data-button-text="${config.embedButtonText}"\n  data-button-color="${config.embedButtonColor}"></script>`
        : config.embedSignatureStyle === "button"
          ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:12px">\n  <tr>\n    <td>\n      <a href="${bookingUrl}"\n         target="_blank"\n         style="display:inline-block;padding:10px 22px;background:${config.embedButtonColor};color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;"\n      >${config.embedSignatureText}</a>\n    </td>\n  </tr>\n</table>`
          : `<a href="${bookingUrl}"\n   target="_blank"\n   style="color:${config.embedButtonColor};font-family:Arial,sans-serif;font-size:13px;text-decoration:underline;"\n>${config.embedSignatureText}</a>`;

  return (
    <div className="p-5 space-y-6">
      {/* Mode */}
      <div>
        <h4
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--cal-heading)" }}
        >
          Embed mode
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              [
                "inline",
                "Inline embed",
                "Calendar loads directly inside a container on your page",
              ],
              [
                "lightbox",
                "Lightbox popup",
                "A button opens the calendar in a centered overlay",
              ],
              [
                "email-signature",
                "Email signature",
                "Add a booking link or button to your email signature",
              ],
            ] as const
          ).map(([mode, title, desc]) => (
            <label
              key={mode}
              className="flex items-start gap-3 cursor-pointer rounded-lg border p-4 transition-colors"
              style={{
                borderColor:
                  config.embedMode === mode
                    ? "var(--cal-primary)"
                    : "var(--cal-border)",
                background:
                  config.embedMode === mode ? "var(--cal-hover)" : "white",
              }}
            >
              <input
                type="radio"
                name="embedMode"
                checked={config.embedMode === mode}
                onChange={() =>
                  update(
                    "embedMode",
                    mode as "inline" | "lightbox" | "email-signature",
                  )
                }
                className="mt-0.5 accent-teal-600"
              />
              <div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--cal-heading)" }}
                >
                  {title}
                </div>
                <div className="text-xs" style={{ color: "var(--cal-mid)" }}>
                  {desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Button customization (lightbox only) */}
      {config.embedMode === "lightbox" && (
        <div>
          <h4
            className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: "var(--cal-heading)" }}
          >
            Button style
          </h4>
          <div
            className="rounded-lg border p-4 space-y-4"
            style={{ borderColor: "var(--cal-border)", background: "white" }}
          >
            <div>
              <FieldLabel>Button text</FieldLabel>
              <Input
                value={config.embedButtonText}
                onChange={(e) =>
                  update("embedButtonText", e.target.value)
                }
              />
            </div>
            <div>
              <FieldLabel>Button color</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.embedButtonColor}
                  onChange={(e) =>
                    update("embedButtonColor", e.target.value)
                  }
                  className="h-8 w-8 rounded border cursor-pointer"
                  style={{ borderColor: "var(--cal-border)" }}
                />
                <Input
                  value={config.embedButtonColor}
                  onChange={(e) =>
                    update("embedButtonColor", e.target.value)
                  }
                  style={{ maxWidth: 120 }}
                />
              </div>
            </div>
            <div className="pt-2">
              <FieldLabel>Preview</FieldLabel>
              <button
                type="button"
                className="rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-md"
                style={{ background: config.embedButtonColor }}
              >
                {config.embedButtonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email signature customization */}
      {config.embedMode === "email-signature" && (
        <div>
          <h4
            className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: "var(--cal-heading)" }}
          >
            Signature style
          </h4>
          <div
            className="rounded-lg border p-4 space-y-4"
            style={{ borderColor: "var(--cal-border)", background: "white" }}
          >
            {/* Style: link vs button */}
            <div>
              <FieldLabel>Display as</FieldLabel>
              <div className="flex items-center gap-4 mt-1">
                {(["link", "button"] as const).map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="sigStyle"
                      checked={config.embedSignatureStyle === s}
                      onChange={() => update("embedSignatureStyle", s)}
                      className="accent-teal-600"
                    />
                    <span
                      className="text-sm capitalize"
                      style={{ color: "var(--cal-heading)" }}
                    >
                      {s}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            {/* Link / button text */}
            <div>
              <FieldLabel>Link text</FieldLabel>
              <Input
                value={config.embedSignatureText}
                onChange={(e) =>
                  update("embedSignatureText", e.target.value)
                }
                placeholder="Schedule a meeting with me"
              />
            </div>
            {/* Color */}
            <div>
              <FieldLabel>
                {config.embedSignatureStyle === "button"
                  ? "Button color"
                  : "Link color"}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.embedButtonColor}
                  onChange={(e) =>
                    update("embedButtonColor", e.target.value)
                  }
                  className="h-8 w-8 rounded border cursor-pointer"
                  style={{ borderColor: "var(--cal-border)" }}
                />
                <Input
                  value={config.embedButtonColor}
                  onChange={(e) =>
                    update("embedButtonColor", e.target.value)
                  }
                  style={{ maxWidth: 120 }}
                />
              </div>
            </div>
            {/* Live preview */}
            <div
              className="pt-3"
              style={{ borderTop: "1px solid var(--cal-border)" }}
            >
              <FieldLabel>
                Preview (how it will look in your email)
              </FieldLabel>
              <div
                className="rounded-lg p-5 mt-1"
                style={{
                  background: "#f9fafb",
                  border: "1px solid var(--cal-border)",
                }}
              >
                <p
                  className="text-sm"
                  style={{
                    color: "#333",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  Best regards,
                </p>
                <p
                  className="text-sm font-semibold mt-1"
                  style={{
                    color: "#333",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {config.hostName || "Your Name"}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: "#666",
                    fontFamily: "Arial, sans-serif",
                  }}
                >
                  {config.pageCompanyName || "Your Company"}
                </p>
                <div className="mt-3">
                  {config.embedSignatureStyle === "button" ? (
                    <span
                      className="inline-block rounded-md px-5 py-2 text-sm font-semibold text-white"
                      style={{
                        background: config.embedButtonColor,
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      {config.embedSignatureText ||
                        "Schedule a meeting with me"}
                    </span>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-sm underline"
                      style={{
                        color: config.embedButtonColor,
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      {config.embedSignatureText ||
                        "Schedule a meeting with me"}
                    </a>
                  )}
                </div>
              </div>
              <p
                className="text-xs mt-2"
                style={{ color: "var(--cal-mid)" }}
              >
                Paste the HTML below into your email client&apos;s signature
                editor (Gmail, Outlook, Apple Mail, etc.)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Code snippet */}
      <div>
        <h4
          className="text-sm font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--cal-heading)" }}
        >
          {config.embedMode === "email-signature"
            ? "Signature HTML"
            : "Embed code"}
        </h4>
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: "var(--cal-border)", background: "white" }}
        >
          <pre
            className="rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono"
            style={{
              background: "var(--cal-bg-alt)",
              color: "var(--cal-heading)",
            }}
          >
            {snippet}
          </pre>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(snippet)}
            className="mt-3 rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
            style={{
              background: "var(--cal-btn)",
              color: "var(--cal-heading)",
            }}
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  );
}
