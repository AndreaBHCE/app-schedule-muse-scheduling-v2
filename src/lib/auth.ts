import { auth, currentUser } from "@clerk/nextjs/server";
import { d1Query } from "@/lib/cloudflare";
import { validateApiKey, type ApiScope } from "@/lib/apikey";

export interface ResolvedAuth {
  userId: string;
  /** null = Clerk session (full access). Array = API key (scoped access). */
  scopes: ApiScope[] | null;
}

/**
 * Get the authenticated user's ID from Clerk.
 * Throws 401 if not signed in.
 * Also ensures the user exists in the D1 `users` table with up-to-date info.
 */
export async function getAuthUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Not authenticated", 401);
  }

  await ensureUserRow(userId);

  return userId;
}

/**
 * Resolve authentication from either a Clerk session or an API key.
 * Clerk session takes priority. Falls back to API key in the request headers.
 * Returns { userId, scopes } — scopes is null for Clerk sessions (full access).
 */
export async function resolveAuth(request: Request): Promise<ResolvedAuth> {
  // 1. Try Clerk session first
  try {
    const { userId } = await auth();
    if (userId) {
      await ensureUserRow(userId);
      return { userId, scopes: null };
    }
  } catch {
    // Clerk auth() may throw in non-browser contexts — fall through to API key
  }

  // 2. Try API key
  const apiKeyAuth = await validateApiKey(request);
  if (apiKeyAuth) {
    return { userId: apiKeyAuth.userId, scopes: apiKeyAuth.scopes };
  }

  throw new AuthError("Not authenticated", 401);
}

/**
 * Ensure a user row exists in D1 with current Clerk profile data.
 * INSERT OR IGNORE creates the row on first call.
 * Then UPDATE syncs email + display_name from Clerk (cheap no-op if unchanged).
 */
async function ensureUserRow(userId: string): Promise<void> {
  // 1. Ensure the row exists
  await d1Query(
    `INSERT OR IGNORE INTO users (id, email, display_name, timezone)
     VALUES (?, '', '', 'America/New_York')`,
    [userId],
  );

  // 2. Fetch real profile from Clerk and sync
  try {
    const user = await currentUser();
    if (user) {
      const email = user.emailAddresses?.[0]?.emailAddress || "";
      const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
      await d1Query(
        `UPDATE users SET email = ?, display_name = ?, updated_at = datetime('now')
         WHERE id = ? AND (email != ? OR display_name != ?)`,
        [email, displayName, userId, email, displayName],
      );
    }
  } catch (err) {
    // Don't block auth if Clerk profile fetch fails
    console.error("Failed to sync user profile from Clerk:", err);
  }
}

/**
 * Require the current user to be an admin.
 * Reads CLERK_ADMIN_USER_IDS env var (comma-separated Clerk user IDs).
 * Throws if CLERK_ADMIN_USER_IDS is not set (fail-fast).
 * Throws 403 if the authenticated user is not in the list.
 */
export async function requireAdmin(): Promise<string> {
  const userId = await getAuthUserId();

  const raw = process.env.CLERK_ADMIN_USER_IDS;
  if (!raw) {
    throw new Error("Missing CLERK_ADMIN_USER_IDS — set in environment");
  }

  const adminIds = raw.split(",").map((id) => id.trim()).filter(Boolean);
  if (!adminIds.includes(userId)) {
    throw new AuthError("Forbidden — admin access required", 403);
  }

  return userId;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
