"use client";

import React from "react";
import { FieldLabel, Input } from "@/components/ui/form-primitives";
import type { TabProps } from "../types";

export default function PhoneSettingsTab({ config, update }: TabProps) {
  return (
    <div className="p-5">
      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        {/* Settings */}
        <div className="space-y-4">
          <h4
            className="text-sm font-bold uppercase tracking-wider"
            style={{ color: "var(--cal-heading)" }}
          >
            Phone configuration
          </h4>
          <div
            className="rounded-lg border p-4 space-y-4"
            style={{ borderColor: "var(--cal-border)", background: "white" }}
          >
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <Input
                type="tel"
                value={config.phoneNumber}
                onChange={(e) => update("phoneNumber", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              <p
                className="text-xs mt-1.5"
                style={{ color: "var(--cal-mid)" }}
              >
                Guests will see this number on the booking confirmation.
              </p>
            </div>
            <div>
              <FieldLabel>Welcome message</FieldLabel>
              <textarea
                value={config.phoneWelcomeMessage}
                onChange={(e) =>
                  update("phoneWelcomeMessage", e.target.value)
                }
                rows={4}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--cal-border)",
                  color: "var(--cal-heading)",
                }}
                placeholder="Thanks for calling! Please book a meeting at your convenience."
              />
            </div>
          </div>
        </div>

        {/* Phone mockup preview */}
        <div>
          <h4
            className="text-sm font-bold uppercase tracking-wider mb-3"
            style={{ color: "var(--cal-heading)" }}
          >
            Preview
          </h4>
          <div className="relative mx-auto" style={{ width: 240 }}>
            {/* Your iPhone image IS the phone */}
            <img
              src="/iphone-icon-sunset-transparent-overlay.png"
              alt="Phone preview"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {/* Text overlay */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
              style={{ paddingTop: "45%" }}
            >
              <div className="text-sm font-bold mb-1 text-white">
                {config.phoneNumber || "+1 (555) 000-0000"}
              </div>
              <div className="text-xs px-4 leading-relaxed text-white/90">
                {config.phoneWelcomeMessage ||
                  "Welcome message will appear here."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
