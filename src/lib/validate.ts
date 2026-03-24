/**
 * Reusable input-validation helpers for API routes.
 *
 * Each function returns `null` when the value is valid,
 * or a human-readable error string when it fails.
 * Compose them with `validateFields()` for consistent 400 responses.
 */

/* ─── Limits ──────────────────────────────────────────── */

/** Default maximum string length for short text fields. */
export const MAX_SHORT = 200;

/** Default maximum string length for long text fields (notes, descriptions). */
export const MAX_LONG = 5_000;

/** Maximum length for JSON config blobs stored in a TEXT column. */
export const MAX_JSON = 50_000;

/* ─── Primitive validators ────────────────────────────── */

/**
 * Require a non-empty string after trimming.
 *
 * @param label  Human-readable field name for the error message
 * @param value  The value to check
 * @param maxLen Maximum allowed length (default: MAX_SHORT)
 */
export function requiredString(
  label: string,
  value: unknown,
  maxLen = MAX_SHORT,
): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return `${label} is required`;
  }
  if (value.trim().length > maxLen) {
    return `${label} must be ${maxLen} characters or fewer`;
  }
  return null;
}

/**
 * Validate an optional string — if present it must be within length limits.
 */
export function optionalString(
  label: string,
  value: unknown,
  maxLen = MAX_SHORT,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    return `${label} must be a string`;
  }
  if (value.trim().length > maxLen) {
    return `${label} must be ${maxLen} characters or fewer`;
  }
  return null;
}

/**
 * Basic email format check (RFC 5322 simplified).
 * Rejects obviously malformed addresses without being overly strict.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validEmail(label: string, value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return `${label} is required`;
  }
  if (value.trim().length > MAX_SHORT) {
    return `${label} must be ${MAX_SHORT} characters or fewer`;
  }
  if (!EMAIL_RE.test(value.trim())) {
    return `${label} is not a valid email address`;
  }
  return null;
}

/**
 * Basic URL format check — must be http:// or https://.
 */
export function validUrl(label: string, value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return `${label} is required`;
  }
  if (value.trim().length > 2_000) {
    return `${label} must be 2000 characters or fewer`;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return `${label} must use http or https`;
    }
  } catch {
    return `${label} is not a valid URL`;
  }
  return null;
}

/**
 * Require a positive integer.
 */
export function positiveInt(label: string, value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return `${label} must be a number`;
  }
  if (!Number.isInteger(value) || value <= 0) {
    return `${label} must be a positive integer`;
  }
  return null;
}

/**
 * Validate an ISO 8601 date-time string.
 */
export function validISODate(label: string, value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return `${label} is required`;
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return `${label} is not a valid date`;
  }
  return null;
}

/* ─── Composition helper ──────────────────────────────── */

/**
 * Run an array of validation checks and return the first error found,
 * or `null` if everything passes.
 *
 * Usage:
 * ```ts
 * const err = firstError(
 *   requiredString("title", body.title),
 *   validEmail("email", body.email),
 *   positiveInt("duration", body.duration),
 * );
 * if (err) return NextResponse.json({ error: err }, { status: 400 });
 * ```
 */
export function firstError(...checks: (string | null)[]): string | null {
  for (const check of checks) {
    if (check !== null) return check;
  }
  return null;
}
