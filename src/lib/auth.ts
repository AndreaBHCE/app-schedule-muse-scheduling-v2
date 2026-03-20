import { auth } from "@clerk/nextjs/server";
import { d1Query } from "@/lib/cloudflare";

/**
 * Get the authenticated user's ID from Clerk.
 * Throws 401 if not signed in.
 * Also ensures the user exists in the D1 `users` table (upsert on first call).
 */
export async function getAuthUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Not authenticated", 401);
  }

  // Upsert user row into D1 (idempotent — INSERT OR IGNORE)
  await d1Query(
    `INSERT OR IGNORE INTO users (id, email, display_name, timezone)
     VALUES (?, '', '', 'America/New_York')`,
    [userId],
  );

  return userId;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
