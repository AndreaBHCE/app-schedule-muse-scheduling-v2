import crypto from "crypto";
import { d1Query } from "@/lib/cloudflare";

interface WebhookRow {
  id: string;
  user_id: string;
  url: string;
  events: string; // JSON array e.g. '["meeting.created"]'
  secret: string;
  active: number;
  failure_count: number;
}

/** Maximum consecutive failures before auto-deactivation. */
const MAX_FAILURES = 5;

/** Timeout for each webhook delivery attempt (ms). */
const DELIVERY_TIMEOUT_MS = 10_000;

/**
 * Dispatch webhook events to all matching active endpoints for a user.
 *
 * Called via waitUntil() so delivery runs after the response is sent,
 * without blocking the API response or risking serverless termination.
 *
 * For each matching webhook:
 *  1. HMAC-SHA256 signs the JSON payload with the webhook's secret
 *  2. POSTs to the URL with signature headers
 *  3. Updates last_triggered_at and last_status_code
 *  4. Tracks consecutive failures; auto-deactivates after MAX_FAILURES
 */
export async function dispatchWebhooks(
  userId: string,
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    // Find all active webhooks for this user that subscribe to this event
    const result = await d1Query<WebhookRow>(
      `SELECT id, url, events, secret, failure_count
       FROM webhooks
       WHERE user_id = ? AND active = 1`,
      [userId],
    );

    const matching = result.results.filter((row) => {
      try {
        const events: string[] = JSON.parse(row.events);
        return events.includes(event);
      } catch (err) {
        console.warn(`Webhook ${row.id} has malformed events JSON:`, err);
        return false;
      }
    });

    if (matching.length === 0) return;

    // Build the delivery body once — shared across all endpoints
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    // Deliver to each endpoint concurrently
    await Promise.allSettled(
      matching.map((hook) => deliverToEndpoint(hook, body)),
    );
  } catch (err) {
    // Never let webhook dispatch crash the caller
    console.error(`[webhooks] dispatch error for event "${event}":`, err);
  }
}

/**
 * Deliver a signed payload to a single webhook endpoint.
 */
async function deliverToEndpoint(hook: WebhookRow, body: string): Promise<void> {
  const signature = crypto
    .createHmac("sha256", hook.secret)
    .update(body)
    .digest("hex");

  let statusCode: number;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    const response = await fetch(hook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-event": body.includes('"event"') ? JSON.parse(body).event : "",
        "x-webhook-signature": `sha256=${signature}`,
        "x-webhook-timestamp": new Date().toISOString(),
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;
  } catch (err) {
    // Network error, timeout, DNS failure, etc.
    console.error(`[webhooks] delivery failed for ${hook.url}:`, err);
    statusCode = 0; // 0 = could not connect
  }

  const success = statusCode >= 200 && statusCode < 300;
  const newFailureCount = success ? 0 : hook.failure_count + 1;

  // Auto-deactivate after MAX_FAILURES consecutive failures
  if (newFailureCount >= MAX_FAILURES) {
    await d1Query(
      `UPDATE webhooks
       SET last_triggered_at = datetime('now'),
           last_status_code = ?,
           failure_count = ?,
           active = 0,
           updated_at = datetime('now')
       WHERE id = ?`,
      [statusCode, newFailureCount, hook.id],
    ).catch((e) => console.error("[webhooks] failed to deactivate:", e));

    console.warn(
      `[webhooks] deactivated ${hook.url} after ${MAX_FAILURES} consecutive failures`,
    );
    return;
  }

  // Update status (reset failure_count on success)
  await d1Query(
    `UPDATE webhooks
     SET last_triggered_at = datetime('now'),
         last_status_code = ?,
         failure_count = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [statusCode, newFailureCount, hook.id],
  ).catch((e) => console.error("[webhooks] failed to update status:", e));
}
