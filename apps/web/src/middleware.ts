import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const authEnabled = !!process.env.CLERK_SECRET_KEY;

// Protect dashboard pages and all API routes except the Stripe webhook.
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/api/((?!webhooks).*)",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});

// In mock mode (no Clerk keys) the middleware is a no-op passthrough.
export default authEnabled ? clerkHandler : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
