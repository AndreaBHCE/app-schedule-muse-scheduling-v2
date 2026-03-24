"use client";

import React from "react";
import { FieldLabel, InfoIcon, Input } from "@/components/ui/form-primitives";
import { applyContactMergeTags } from "@/lib/utils";
import type { BookingConfig, DesignerTabProps, SampleContact } from "../types";

/* ── Local prop interface extends DesignerTabProps with preview data ── */
interface PageDesignerTabProps extends DesignerTabProps {
  sampleContact: SampleContact;
}

export default function PageDesignerTab({
  config,
  update,
  handleFileUpload,
  handleSave,
  sampleContact,
}: PageDesignerTabProps) {
  /* ---- helpers for the preview ---- */
  const infoBgRgba = `rgba(255,255,255,${config.pageInfoBgOpacity / 100})`;
  const schedBgRgba = `rgba(255,255,255,${config.pageSchedulingBgOpacity / 100})`;

  /* Build preview time slots from actual availability + slot interval */
  const previewSlots: string[] = (() => {
    const WEEK_DAYS_ORDER: (keyof BookingConfig["availability"])[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const firstEnabled = WEEK_DAYS_ORDER.find(
      (d) => config.availability[d].enabled,
    );
    const dayConf = firstEnabled
      ? config.availability[firstEnabled]
      : { start: "09:00", end: "17:00" };
    const [sh, sm] = dayConf.start.split(":").map(Number);
    const [eh, em] = dayConf.end.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const interval = config.slotIntervalMinutes || 30;
    const slots: string[] = [];
    for (
      let m = startMin;
      m + (config.defaultDuration || 30) <= endMin && slots.length < 8;
      m += interval
    ) {
      const h = Math.floor(m / 60);
      const mm = m % 60;
      const suffix = h >= 12 ? "PM" : "AM";
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      slots.push(`${h12}:${mm.toString().padStart(2, "0")} ${suffix}`);
    }
    return slots.length > 0 ? slots : ["9:00 AM"];
  })();

  const MOCK_DAYS = [
    [null, null, null, null, 1, 2, 3],
    [4, 5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15, 16, 17],
    [18, 19, 20, 21, 22, 23, 24],
    [25, 26, 27, 28, 29, 30, null],
  ];
  const highlightDay = 6;

  return (
    <div className="pd-root">
      {/* ============================================================
          LEFT — BROWSER PREVIEW
          ============================================================ */}
      <div className="pd-preview-col">
        {/* Desktop / Mobile toggle (decorative) */}
        <div className="flex items-center gap-2 mb-3 justify-center">
          <button
            className="pd-device-btn pd-device-btn--active"
            title="Desktop"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 5a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v4h8V6zM5 16a1 1 0 100-2h10a1 1 0 100 2H5z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button className="pd-device-btn" title="Mobile">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Browser chrome */}
        <div className="pd-browser">
          <div className="pd-browser__bar">
            <span className="pd-dot pd-dot--red" />
            <span className="pd-dot pd-dot--yellow" />
            <span className="pd-dot pd-dot--green" />
          </div>

          {/* Page body */}
          <div
            className="pd-browser__body"
            style={{
              background:
                config.pageBackgroundType === "image" &&
                config.pageBackgroundImage
                  ? `url(${config.pageBackgroundImage}) center/cover no-repeat`
                  : config.pageBackgroundType === "gradient"
                    ? `linear-gradient(135deg, ${config.pageBackground}, ${config.pageAccentColor})`
                    : config.pageBackground,
              position: "relative",
            }}
          >
            {/* Video background */}
            {config.pageBackgroundType === "video" &&
              config.pageBackgroundImage && (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="pd-video-bg"
                  src={config.pageBackgroundImage}
                />
              )}
            <div
              className="pd-page-layout"
              style={{ position: "relative", zIndex: 1 }}
            >
              {/* ---- Information pane ---- */}
              <div
                className="pd-info-pane"
                style={{
                  background: infoBgRgba,
                  color: config.pageInfoTextColor,
                }}
              >
                {config.pageProfileImage && (
                  <img
                    src={config.pageProfileImage}
                    alt="Profile"
                    className="pd-info-profile"
                  />
                )}
                <h3 className="pd-info-heading">
                  {config.pageHeading || "Schedule a Meeting"}
                </h3>
                {config.pageSubheading && (
                  <p className="pd-info-sub">{config.pageSubheading}</p>
                )}
                {config.pageWelcomeMessage && (
                  <p className="pd-info-welcome">
                    {applyContactMergeTags(
                      config.pageWelcomeMessage,
                      sampleContact,
                    )}
                  </p>
                )}
                {(config.pageHostName ||
                  config.pageHostTitle ||
                  config.pageCompanyName) && (
                  <div className="pd-info-host">
                    {config.pageHostName && (
                      <div className="pd-info-host-name">
                        {config.pageHostName}
                      </div>
                    )}
                    {config.pageHostTitle && (
                      <div className="pd-info-host-title">
                        {config.pageHostTitle}
                      </div>
                    )}
                    {config.pageCompanyName && (
                      <div className="pd-info-host-company">
                        {config.pageCompanyName}
                      </div>
                    )}
                  </div>
                )}
                {config.pageLogo && (
                  <img
                    src={config.pageLogo}
                    alt="Logo"
                    className="pd-info-logo"
                    style={{ marginTop: "12px" }}
                  />
                )}
              </div>

              {/* ---- Interaction pane ---- */}
              <div
                className="pd-interaction-pane"
                style={{ background: schedBgRgba }}
              >
                {/* Mini calendar */}
                <div className="pd-mini-cal">
                  <div className="pd-mini-cal__header">
                    <div
                      className="text-[10px] font-semibold tracking-wide"
                      style={{ color: "#666" }}
                    >
                      {"S  M  T  W  T  F  S".split("  ").map((d, i) => (
                        <span key={i} className="pd-mini-cal__dow">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                  {MOCK_DAYS.map((week, wi) => (
                    <div key={wi} className="pd-mini-cal__week">
                      {week.map((day, di) => (
                        <span
                          key={di}
                          className={`pd-mini-cal__day ${day === highlightDay ? "pd-mini-cal__day--active" : ""} ${day && day >= 12 && day <= 17 ? "pd-mini-cal__day--highlight" : ""}`}
                          style={
                            day === highlightDay
                              ? {
                                  background: config.pageButtonColor,
                                  color: "#fff",
                                }
                              : day && day >= 12 && day <= 17
                                ? {
                                    color: config.pageButtonColor,
                                    fontWeight: 700,
                                  }
                                : undefined
                          }
                        >
                          {day ?? ""}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                <div className="pd-time-slots">
                  {previewSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className="pd-time-slot"
                      style={{
                        borderColor: config.pageButtonColor,
                        color: config.pageButtonColor,
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer inside preview */}
            {config.pageFooter && (
              <div
                className="pd-page-footer"
                style={{
                  color: config.pageInfoTextColor,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {config.pageFooter}
              </div>
            )}
          </div>
        </div>

        <p
          className="text-center text-xs mt-3"
          style={{ color: "var(--cal-mid)" }}
        >
          This is a limited preview of your page.
        </p>
      </div>

      {/* ============================================================
          RIGHT — SETTINGS PANEL
          ============================================================ */}
      <div className="pd-settings-col">
        {/* ---- Page URL ---- */}
        <div className="pd-settings-section">
          <div className="flex items-center justify-between mb-2">
            <span className="pd-settings-label">Page URL</span>
            <span
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{
                color: config.pagePublished ? "#16a34a" : "var(--cal-mid)",
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: config.pagePublished
                    ? "#16a34a"
                    : "var(--cal-mid)",
                }}
              />
              {config.pagePublished ? "Published" : "Draft"}
            </span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <span
              className="text-xs shrink-0"
              style={{ color: "var(--cal-mid)" }}
            >
              https://app.schedulemuseai.com/
            </span>
            <Input
              value={config.pageSlug}
              onChange={(e) =>
                update(
                  "pageSlug",
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                )
              }
            />
          </div>
          <button
            type="button"
            className="text-xs font-medium"
            style={{ color: "var(--cal-primary)" }}
          >
            Customize URL
          </button>
        </div>

        {/* ---- Page Background ---- */}
        <div className="pd-settings-section">
          <span className="pd-settings-label">Page Background</span>
          <div className="grid grid-cols-4 gap-2 mt-2 mb-3">
            {(
              [
                ["solid", "Solid color", "⬛"],
                ["gradient", "Dynamic gradient", "🌐"],
                ["image", "Image", "🖼️"],
                ["video", "Video", "▶️"],
              ] as const
            ).map(([type, label, icon]) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  update(
                    "pageBackgroundType",
                    type as "solid" | "gradient" | "image" | "video",
                  )
                }
                className={`pd-bg-option ${config.pageBackgroundType === type ? "pd-bg-option--active" : ""}`}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] leading-tight">{label}</span>
                {type === "video" && (
                  <span className="pd-new-badge">New</span>
                )}
              </button>
            ))}
          </div>
          {/* Tooltips for image & video limits */}
          <div className="flex items-center gap-3 mb-3">
            <InfoIcon tip="Supported formats: JPG, PNG, WebP. Max file size: 5 MB. Recommended resolution: 1920×1080px or higher." />
            <span className="text-xs" style={{ color: "var(--cal-mid)" }}>
              Image limits
            </span>
            <InfoIcon tip="Supported formats: MP4, WebM. Max file size: 30 MB. Max duration: 60 seconds. Resolution: 1920×1080px recommended. Video will auto-loop and play muted." />
            <span className="text-xs" style={{ color: "var(--cal-mid)" }}>
              Video limits
            </span>
          </div>
          {config.pageBackgroundType === "solid" && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.pageBackground}
                onChange={(e) => update("pageBackground", e.target.value)}
                className="h-8 w-8 rounded border cursor-pointer"
                style={{ borderColor: "var(--cal-border)" }}
              />
              <Input
                value={config.pageBackground}
                onChange={(e) => update("pageBackground", e.target.value)}
                style={{ maxWidth: 120 }}
              />
            </div>
          )}
          {config.pageBackgroundType === "gradient" && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.pageBackground}
                onChange={(e) => update("pageBackground", e.target.value)}
                className="h-8 w-8 rounded border cursor-pointer"
                style={{ borderColor: "var(--cal-border)" }}
              />
              <Input
                value={config.pageBackground}
                onChange={(e) => update("pageBackground", e.target.value)}
                style={{ maxWidth: 120 }}
              />
            </div>
          )}
          {config.pageBackgroundType === "image" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Background Image</FieldLabel>
                <label className="pd-choose-btn cursor-pointer">
                  Upload image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, "pageBackgroundImage", 5)
                    }
                  />
                </label>
              </div>
              <Input
                value={config.pageBackgroundImage}
                onChange={(e) =>
                  update("pageBackgroundImage", e.target.value)
                }
                placeholder="Or paste image URL (JPG, PNG, WebP)"
              />
              {config.pageBackgroundImage && (
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{
                    borderColor: "var(--cal-border)",
                    maxHeight: 120,
                  }}
                >
                  <img
                    src={config.pageBackgroundImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                    style={{ maxHeight: 120 }}
                  />
                </div>
              )}
            </div>
          )}
          {config.pageBackgroundType === "video" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel>Background Video</FieldLabel>
                <label className="pd-choose-btn cursor-pointer">
                  Upload video
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, "pageBackgroundImage", 30)
                    }
                  />
                </label>
              </div>
              <Input
                value={config.pageBackgroundImage}
                onChange={(e) =>
                  update("pageBackgroundImage", e.target.value)
                }
                placeholder="Or paste video URL (MP4, WebM)"
              />
              {config.pageBackgroundImage && (
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{
                    borderColor: "var(--cal-border)",
                    maxHeight: 120,
                  }}
                >
                  <video
                    src={config.pageBackgroundImage}
                    className="w-full"
                    style={{ maxHeight: 120 }}
                    muted
                    autoPlay
                    loop
                    playsInline
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Information Pane ---- */}
        <div className="pd-settings-section">
          <span className="pd-settings-label">Information Pane</span>

          {/* Logo */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--cal-heading)" }}
                >
                  Logo
                </span>
                <span
                  className="text-xs cursor-pointer"
                  style={{ color: "var(--cal-primary)" }}
                >
                  (Reset)
                </span>
                <InfoIcon tip="Upload your company or brand logo. Recommended size: 200×60px." />
              </div>
              <label className="pd-choose-btn cursor-pointer">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "pageLogo", 5)}
                />
              </label>
            </div>
            {config.pageLogo && (
              <div
                className="mt-2 w-16 h-16 rounded border flex items-center justify-center overflow-hidden"
                style={{
                  borderColor: "var(--cal-border)",
                  background: "#f9fafb",
                }}
              >
                <img
                  src={config.pageLogo}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <Input
              className="mt-2"
              value={config.pageLogo}
              onChange={(e) => update("pageLogo", e.target.value)}
              placeholder="Logo image URL"
            />
          </div>

          {/* Profile Image */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--cal-heading)" }}
                >
                  Profile Image
                </span>
                <span
                  className="text-xs cursor-pointer"
                  style={{ color: "var(--cal-primary)" }}
                >
                  (Reset)
                </span>
                <InfoIcon tip="Upload a profile photo. Recommended size: 150×150px." />
              </div>
              <label className="pd-choose-btn cursor-pointer">
                Choose image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleFileUpload(e, "pageProfileImage", 5)
                  }
                />
              </label>
            </div>
            {config.pageProfileImage && (
              <div
                className="mt-2 w-16 h-16 rounded-full border overflow-hidden"
                style={{ borderColor: "var(--cal-border)" }}
              >
                <img
                  src={config.pageProfileImage}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Input
              className="mt-2"
              value={config.pageProfileImage}
              onChange={(e) => update("pageProfileImage", e.target.value)}
              placeholder="Profile image URL"
            />
          </div>

          {/* Heading */}
          <div className="mt-4">
            <FieldLabel>Heading</FieldLabel>
            <Input
              value={config.pageHeading}
              onChange={(e) => update("pageHeading", e.target.value)}
            />
          </div>

          {/* Subheading */}
          <div className="mt-4">
            <FieldLabel>Subheading</FieldLabel>
            <Input
              value={config.pageSubheading}
              onChange={(e) => update("pageSubheading", e.target.value)}
            />
          </div>

          {/* Welcome Message */}
          <div className="mt-4">
            <FieldLabel>Welcome Message</FieldLabel>
            <textarea
              value={config.pageWelcomeMessage}
              onChange={(e) =>
                update("pageWelcomeMessage", e.target.value)
              }
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                borderColor: "var(--cal-border)",
                color: "var(--cal-heading)",
              }}
            />
            <div className="flex items-center gap-2 mt-1.5">
              <button type="button" className="pd-fmt-btn" title="Bold">
                <strong>B</strong>
              </button>
              <button type="button" className="pd-fmt-btn" title="Italic">
                <em>I</em>
              </button>
              <button type="button" className="pd-fmt-btn" title="Link">
                🔗
              </button>
            </div>
            <p
              className="text-xs mt-2"
              style={{ color: "var(--cal-mid)" }}
            >
              Supports merge tags:{" "}
              <code>{"{{contact.first_name}}"}</code>,{" "}
              <code>{"{{contact.last_name}}"}</code>,{" "}
              <code>{"{{contact.email}}"}</code>,{" "}
              <code>{"{{contact.name}}"}</code>.
            </p>
          </div>

          {/* Host details */}
          <div className="mt-4">
            <FieldLabel>Host Name</FieldLabel>
            <Input
              value={config.pageHostName}
              onChange={(e) => update("pageHostName", e.target.value)}
              placeholder="e.g. Andrea Petralia"
            />
          </div>
          <div className="mt-3">
            <FieldLabel>Host Title</FieldLabel>
            <Input
              value={config.pageHostTitle}
              onChange={(e) => update("pageHostTitle", e.target.value)}
              placeholder="e.g. Director of Operations"
            />
          </div>
          <div className="mt-3">
            <FieldLabel>Company Name</FieldLabel>
            <Input
              value={config.pageCompanyName}
              onChange={(e) => update("pageCompanyName", e.target.value)}
              placeholder="e.g. ScheduleMuseAI"
            />
          </div>

          {/* Social Links */}
          <div className="mt-4">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: "var(--cal-primary)" }}
            >
              <span className="text-lg">⊕</span> Add social links
            </button>
          </div>

          {/* Information Text Color */}
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--cal-heading)" }}
              >
                Information Text Color
              </span>
              <span
                className="text-xs cursor-pointer"
                style={{ color: "var(--cal-primary)" }}
              >
                (Reset)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.pageInfoTextColor}
                onChange={(e) =>
                  update("pageInfoTextColor", e.target.value)
                }
                className="h-8 w-8 rounded border cursor-pointer"
                style={{ borderColor: "var(--cal-border)" }}
              />
              <Input
                value={config.pageInfoTextColor}
                onChange={(e) =>
                  update("pageInfoTextColor", e.target.value)
                }
                style={{ maxWidth: 120 }}
              />
            </div>
          </div>

          {/* Information Background Opacity */}
          <div className="mt-4">
            <FieldLabel>Information Background Opacity</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={25}
                max={100}
                value={config.pageInfoBgOpacity}
                onChange={(e) =>
                  update("pageInfoBgOpacity", Number(e.target.value))
                }
                className="flex-1 accent-teal-600"
              />
              <span
                className="text-sm font-semibold w-10 text-right"
                style={{ color: "var(--cal-heading)" }}
              >
                {config.pageInfoBgOpacity}%
              </span>
            </div>
          </div>
        </div>

        {/* ---- Interaction Pane ---- */}
        <div className="pd-settings-section">
          <span className="pd-settings-label">Interaction Pane</span>

          {/* Button Color */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--cal-heading)" }}
              >
                Button Color
              </span>
              <span
                className="text-xs cursor-pointer"
                style={{ color: "var(--cal-primary)" }}
              >
                (Reset)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.pageButtonColor}
                onChange={(e) =>
                  update("pageButtonColor", e.target.value)
                }
                className="h-8 w-8 rounded border cursor-pointer"
                style={{ borderColor: "var(--cal-border)" }}
              />
              <Input
                value={config.pageButtonColor}
                onChange={(e) =>
                  update("pageButtonColor", e.target.value)
                }
                style={{ maxWidth: 120 }}
              />
            </div>
          </div>

          {/* Scheduling Background Opacity */}
          <div className="mt-4">
            <FieldLabel>Scheduling Background Opacity</FieldLabel>
            <div className="grid grid-cols-4 gap-x-4 gap-y-1 mt-1">
              {[50, 65, 85, 100, 55, 70, 90, null, 60, 80, 95, null].map(
                (val, i) =>
                  val !== null ? (
                    <label
                      key={val}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="schedBgOpacity"
                        checked={config.pageSchedulingBgOpacity === val}
                        onChange={() =>
                          update("pageSchedulingBgOpacity", val)
                        }
                        className="accent-teal-600"
                      />
                      <span
                        className="text-sm"
                        style={{ color: "var(--cal-heading)" }}
                      >
                        {val}%
                      </span>
                    </label>
                  ) : (
                    <span key={`empty-${i}`} />
                  ),
              )}
            </div>
          </div>
        </div>

        {/* ---- Page Footer ---- */}
        <div className="pd-settings-section">
          <span className="pd-settings-label">Page Footer</span>
          <textarea
            value={config.pageFooter}
            onChange={(e) => update("pageFooter", e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none mt-2"
            style={{
              borderColor: "var(--cal-border)",
              color: "var(--cal-heading)",
            }}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button type="button" className="pd-fmt-btn" title="Bold">
              <strong>B</strong>
            </button>
            <button type="button" className="pd-fmt-btn" title="Link">
              🔗
            </button>
          </div>
        </div>

        {/* ---- Bottom actions ---- */}
        <div className="pd-settings-actions">
          <button
            type="button"
            onClick={handleSave}
            className="pd-save-btn"
          >
            Save
          </button>
          <button type="button" className="pd-discard-btn">
            Discard
          </button>
          <button type="button" className="pd-share-btn">
            Share your page
          </button>
        </div>
      </div>
    </div>
  );
}
