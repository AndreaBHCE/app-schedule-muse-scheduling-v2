
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// Only these routes are accessible without signing in
const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy",
  "/terms-of-use",
  "/support",
  "/docs",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/integrations/callback",
  "/api/integrations/deauthorize",
]);

// API routes that need rate limiting (not pages, not static assets)
const isApiRoute = createRouteMatcher(["/api(.*)"]);

// Admin routes get a stricter limit
const isAdminRoute = createRouteMatcher(["/api/admin(.*)"]);

// Limits per 60-second window
const LIMITS = {
  admin: 5,
  authenticated: 60,
  public: 10,
} as const;

export default clerkMiddleware(async (auth, request) => {
  // ── Auth gate (unchanged) ──
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // ── Rate limiting (API routes only) ──
  if (isApiRoute(request)) {
    let key: string;
    let limit: number;

    const { userId } = await auth();

    if (userId) {
      // Authenticated request (Clerk session or resolved via API key in route)
      limit = isAdminRoute(request) ? LIMITS.admin : LIMITS.authenticated;
      key = `user:${userId}`;
    } else {
      // Public API route (OAuth callbacks, etc.)
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
      limit = LIMITS.public;
      key = `ip:${ip}`;
    }

    try {
      const result = await checkRateLimit(key, limit);

      if (!result.allowed) {
        return NextResponse.json(
          { error: "Too many requests" },
          {
            status: 429,
            headers: {
              "Retry-After": String(result.retryAfter),
              "X-RateLimit-Limit": String(result.limit),
              "X-RateLimit-Remaining": "0",
            },
          },
        );
      }
    } catch {
      // Rate limiter failure must not block requests (fail-open).
      // If D1 is down, the route handler will fail on its own queries anyway.
      console.error("[rate-limit] check failed — failing open");
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
