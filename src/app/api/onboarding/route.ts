import { NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare";
import { resolveAuth, AuthError } from "@/lib/auth";

interface OnboardingPayload {
  usage?: "solo" | "team" | null;
  useCases?: string[];
  role?: string | null;
  availability?: Record<string, { enabled: boolean; start: string; end: string }>;
  meetingLocation?: string | null;
  aiSummary?: boolean;
  skipped?: boolean;
}

/**
 * POST /api/onboarding — persist the data collected during onboarding.
 *
 * Stores preferences as JSON in the users.preferences column and
 * creates a default availability schedule from the submitted hours.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await resolveAuth(request);
    const data: OnboardingPayload = await request.json();

    // 1. Store preferences on user record (always mark onboarding complete)
    const preferences = {
      usage: data.usage ?? null,
      useCases: data.useCases ?? [],
      role: data.role ?? null,
      meetingLocation: data.meetingLocation ?? null,
      aiSummary: data.aiSummary ?? true,
      onboardingComplete: true,
      onboardedAt: new Date().toISOString(),
    };

    await d1Query(
      `UPDATE users
       SET preferences = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [JSON.stringify(preferences), userId],
    );

    // 2. Create (or replace) default availability schedule (skip if no data)
    if (data.availability && !data.skipped) {
      const scheduleId = `sched-default-${userId}`;
      const rules = JSON.stringify(data.availability);

      await d1Query(
        `INSERT INTO availability_schedules (id, user_id, name, timezone, rules, is_default)
         VALUES (?, ?, 'Default', ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET
           rules = excluded.rules,
           timezone = excluded.timezone,
           updated_at = datetime('now')`,
        [
          scheduleId,
          userId,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          rules,
        ],
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("POST /api/onboarding error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
