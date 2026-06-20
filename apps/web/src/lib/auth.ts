import "server-only";
import { authEnabledServer } from "./env.server";
import { DEMO_USER_ID } from "./flags";

/**
 * Resolve the current user id. Uses Clerk when configured; otherwise returns a
 * fixed demo user so the whole product works with zero accounts (mock mode).
 * Clerk server helpers are imported dynamically so they never load in mock mode.
 */
export async function getUserId(): Promise<string> {
  if (!authEnabledServer) return DEMO_USER_ID;
  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}

export async function getUserEmail(): Promise<string | undefined> {
  if (!authEnabledServer) return "demo@promptgenius.ai";
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const u = await currentUser();
    return u?.primaryEmailAddress?.emailAddress ?? undefined;
  } catch {
    return undefined;
  }
}
