
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  // --- Rate limiting ---
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const isApi = isApiRoute(request);

  if (isApi) {
    // Use a tighter limit for write methods
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    const limit = isWrite ? RATE_LIMITS.write : RATE_LIMITS.api;

    // Key by IP + route to prevent one noisy endpoint from exhausting the budget
    const key = `${ip}:${new URL(request.url).pathname}`;
    const result = rateLimit(key, limit);

    if (!result.allowed) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.resetAt - Math.floor(Date.now() / 1000)),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      });
    }
  }

  // --- Auth protection ---
  if (!isPublicRoute(request)) {
    await auth.protect();
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
