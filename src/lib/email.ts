/**
 * Email service — Resend-backed.
 *
 * Throws at call time if RESEND_API_KEY is not set.
 * A missing key is a configuration failure, not a graceful-skip scenario.
 *
 * Config:
 *   RESEND_API_KEY      – Resend API key (re_...) (required)
 *   RESEND_FROM_EMAIL   – Sender address (required)
 *   RESEND_FROM_NAME    – Brand name in emails (required)
 */

import { Resend } from "resend";

/* ── Config ──────────────────────────────────────────────── */

const API_KEY = process.env.RESEND_API_KEY;

function requireEmailEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing ${name} — set in environment`);
  return val;
}

let resend: Resend | null = null;

function requireResend(): Resend {
  if (!API_KEY) {
    throw new Error("Missing RESEND_API_KEY — set in environment");
  }
  if (!resend) resend = new Resend(API_KEY);
  return resend;
}

/* ── Types ───────────────────────────────────────────────── */

export interface MeetingEmailData {
  /** Host (organizer) info */
  hostName: string;
  hostEmail: string;

  /** Attendee info (from contacts) */
  firstName: string;
  lastName: string;
  attendeeEmail: string;

  /** Meeting details */
  meetingType: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // minutes
  location: string;
  locationDetails: string; // e.g. Zoom join URL
  notes: string;

  /** Booking page title (if created from a booking page) */
  bookingPageTitle?: string;
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Send meeting confirmation emails to both the host and the guest.
 *
 * This is fire-and-forget safe — call without await if you don't
 * need to block on delivery.
 */
export async function sendMeetingConfirmation(
  data: MeetingEmailData,
): Promise<{ sent: boolean; error?: string }> {
  const client = requireResend();

  const startDate = new Date(data.startTime);
  const endDate = new Date(data.endTime);

  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedStart = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const formattedEnd = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const timeRange = `${formattedStart} – ${formattedEnd}`;

  try {
    // Send both emails concurrently
    const [hostResult, guestResult] = await Promise.allSettled([
      client.emails.send({
        from: `${requireEmailEnv("RESEND_FROM_NAME")} <${requireEmailEnv("RESEND_FROM_EMAIL")}>`,
        to: data.hostEmail,
        subject: `Meeting confirmed: ${data.firstName} ${data.lastName} — ${formattedDate}`,
        html: buildHostEmail(data, formattedDate, timeRange),
      }),
      client.emails.send({
        from: `${requireEmailEnv("RESEND_FROM_NAME")} <${requireEmailEnv("RESEND_FROM_EMAIL")}>`,
        to: data.attendeeEmail,
        subject: `Your meeting with ${data.hostName} is confirmed — ${formattedDate}`,
        html: buildGuestEmail(data, formattedDate, timeRange),
      }),
    ]);

    const hostOk = hostResult.status === "fulfilled";
    const guestOk = guestResult.status === "fulfilled";

    if (!hostOk) {
      console.error("[email] Failed to send host confirmation:", hostResult.reason);
    }
    if (!guestOk) {
      console.error("[email] Failed to send guest confirmation:", guestResult.reason);
    }

    return { sent: hostOk || guestOk };
  } catch (err) {
    console.error("[email] Unexpected error sending confirmation:", err);
    return { sent: false, error: (err as Error).message };
  }
}

/**
 * Send a meeting cancellation email to the guest.
 */
export async function sendMeetingCancellation(data: {
  hostName: string;
  firstName: string;
  lastName: string;
  attendeeEmail: string;
  meetingType: string;
  startTime: string;
  reason?: string;
}): Promise<{ sent: boolean }> {
  const client = requireResend();

  const startDate = new Date(data.startTime);
  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    await client.emails.send({
      from: `${requireEmailEnv("RESEND_FROM_NAME")} <${requireEmailEnv("RESEND_FROM_EMAIL")}>`,
      to: data.attendeeEmail,
      subject: `Meeting canceled: ${formattedDate}`,
      html: buildCancellationEmail(data, formattedDate),
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] Failed to send cancellation:", err);
    return { sent: false };
  }
}

/* ── Email Templates ─────────────────────────────────────── */

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { margin: 0; padding: 0; background: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .wrap { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { text-align: center; margin-bottom: 24px; }
  .brand { font-size: 20px; font-weight: 700; color: #0d9488; }
  .title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 16px 0 8px; }
  .subtitle { font-size: 14px; color: #6b7280; }
  .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
  .detail-label { width: 100px; font-size: 13px; font-weight: 600; color: #6b7280; flex-shrink: 0; }
  .detail-value { font-size: 14px; color: #1a1a1a; }
  .cta { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #0d9488; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .footer { text-align: center; padding: 20px 0 0; font-size: 12px; color: #9ca3af; }
  a { color: #0d9488; }
</style>
</head>
<body><div class="wrap"><div class="card">${body}</div>
<div class="footer">Sent by ${requireEmailEnv("RESEND_FROM_NAME")}</div></div></body></html>`;
}

function detailRow(label: string, value: string): string {
  if (!value) return "";
  return `<div class="detail-row"><div class="detail-label">${label}</div><div class="detail-value">${escapeHtml(value)}</div></div>`;
}

function linkRow(label: string, url: string, text?: string): string {
  if (!url) return "";
  return `<div class="detail-row"><div class="detail-label">${label}</div><div class="detail-value"><a href="${escapeHtml(url)}">${escapeHtml(text || url)}</a></div></div>`;
}

function buildHostEmail(
  data: MeetingEmailData,
  formattedDate: string,
  timeRange: string,
): string {
  const details = [
    detailRow("Attendee", `${data.firstName} ${data.lastName} (${data.attendeeEmail})`),
    detailRow("Date", formattedDate),
    detailRow("Time", timeRange),
    detailRow("Duration", `${data.duration} min`),
    detailRow("Type", data.meetingType),
    data.locationDetails?.startsWith("http")
      ? linkRow("Location", data.locationDetails, "Join meeting")
      : detailRow("Location", data.locationDetails || data.location),
    data.bookingPageTitle ? detailRow("Calendar", data.bookingPageTitle) : "",
    detailRow("Notes", data.notes),
  ].join("");

  return emailShell(
    `Meeting confirmed with ${data.firstName} ${data.lastName}`,
    `<div class="header">
      <div class="brand">${requireEmailEnv("RESEND_FROM_NAME")}</div>
      <div class="title">New meeting confirmed</div>
      <div class="subtitle">You have a new meeting with ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</div>
    </div>
    ${details}`,
  );
}

function buildGuestEmail(
  data: MeetingEmailData,
  formattedDate: string,
  timeRange: string,
): string {
  const details = [
    detailRow("Host", data.hostName),
    detailRow("Date", formattedDate),
    detailRow("Time", timeRange),
    detailRow("Duration", `${data.duration} min`),
    detailRow("Type", data.meetingType),
    data.locationDetails?.startsWith("http")
      ? linkRow("Join", data.locationDetails, "Join meeting")
      : detailRow("Location", data.locationDetails || data.location),
    detailRow("Notes", data.notes),
  ].join("");

  const joinButton = data.locationDetails?.startsWith("http")
    ? `<div style="text-align:center"><a class="cta" href="${escapeHtml(data.locationDetails)}">Join Meeting</a></div>`
    : "";

  return emailShell(
    `Meeting confirmed with ${data.hostName}`,
    `<div class="header">
      <div class="brand">${requireEmailEnv("RESEND_FROM_NAME")}</div>
      <div class="title">Your meeting is confirmed</div>
      <div class="subtitle">${escapeHtml(data.hostName)} has scheduled a meeting with you</div>
    </div>
    ${details}
    ${joinButton}`,
  );
}

function buildCancellationEmail(
  data: { hostName: string; firstName: string; lastName: string; meetingType: string; reason?: string },
  formattedDate: string,
): string {
  const reasonRow = data.reason
    ? detailRow("Reason", data.reason)
    : "";

  return emailShell(
    "Meeting canceled",
    `<div class="header">
      <div class="brand">${requireEmailEnv("RESEND_FROM_NAME")}</div>
      <div class="title">Meeting canceled</div>
      <div class="subtitle">${escapeHtml(data.hostName)} has canceled the meeting on ${formattedDate}</div>
    </div>
    ${detailRow("Host", data.hostName)}
    ${detailRow("Date", formattedDate)}
    ${detailRow("Type", data.meetingType)}
    ${reasonRow}
    <p style="font-size:14px;color:#6b7280;margin-top:16px;">
      If you have questions, please reply to this email or contact ${escapeHtml(data.hostName)} directly.
    </p>`,
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
