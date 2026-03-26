import nodemailer from "nodemailer";
import { d1Query } from "./cloudflare";
import { encryptToken, decryptToken } from "./crypto";

/**
 * SMTP integration — subscriber-provided SMTP credentials.
 *
 * Subscribers who don't use Gmail or Outlook connect their own
 * mail server. We store their credentials encrypted and send
 * booking emails through their server on their behalf.
 *
 * Storage pattern (matches Gmail/Zoom):
 *   access_token  → encrypted SMTP password
 *   metadata      → JSON { host, port, username, from_email, encryption }
 */

/* ── Types ───────────────────────────────────────────────── */

export interface SmtpCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  encryption: "tls" | "starttls" | "none";
}

/* ── Validation ──────────────────────────────────────────── */

/**
 * Validate SMTP credentials by opening a real connection to the server.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export async function validateSmtpCredentials(
  creds: SmtpCredentials,
): Promise<{ valid: boolean; error?: string }> {
  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.encryption === "tls",
    auth: {
      user: creds.username,
      pass: creds.password,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });

  try {
    await transporter.verify();
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return { valid: false, error: message };
  } finally {
    transporter.close();
  }
}

/* ── Credential retrieval ────────────────────────────────── */

/** Read and decrypt SMTP credentials from the integrations table. */
export async function getSmtpCredentials(userId: string): Promise<SmtpCredentials | null> {
  const result = await d1Query(
    `SELECT access_token, metadata FROM integrations
     WHERE user_id = ? AND provider = 'smtp' AND status = 'connected'`,
    [userId],
  );

  if (!result.results || result.results.length === 0) return null;

  const row = result.results[0];
  const password = row.access_token ? decryptToken(String(row.access_token)) : "";

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(String(row.metadata) || "{}");
  } catch {
    return null;
  }

  if (!meta.host || !meta.port || !meta.username || !meta.from_email) return null;

  return {
    host: String(meta.host),
    port: Number(meta.port),
    username: String(meta.username),
    password,
    from_email: String(meta.from_email),
    encryption: (meta.encryption as SmtpCredentials["encryption"]) || "tls",
  };
}

/* ── Send email ──────────────────────────────────────────── */

/**
 * Send an email through the subscriber's SMTP server.
 * Mirrors sendGmailEmail signature for consistency.
 */
export async function sendSmtpEmail(
  userId: string,
  to: string,
  subject: string,
  htmlBody: string,
  fromName?: string,
): Promise<{ sent: boolean; error?: string }> {
  const creds = await getSmtpCredentials(userId);
  if (!creds) {
    return { sent: false, error: "No SMTP credentials found for user" };
  }

  const transporter = nodemailer.createTransport({
    host: creds.host,
    port: creds.port,
    secure: creds.encryption === "tls",
    auth: {
      user: creds.username,
      pass: creds.password,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
  });

  const from = fromName
    ? `"${fromName}" <${creds.from_email}>`
    : creds.from_email;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html: htmlBody,
    });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP send failed";
    console.error("SMTP send error:", message);
    return { sent: false, error: message };
  } finally {
    transporter.close();
  }
}
