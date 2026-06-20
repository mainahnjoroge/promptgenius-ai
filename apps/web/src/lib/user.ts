import "server-only";
import type { TierId } from "@promptgenius/core";
import { db } from "./db";
import { getUserEmail, getUserId } from "./auth";

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30-day usage window

export type AppUser = {
  id: string;
  email: string | null;
  tier: TierId;
  billingInterval: "monthly" | "annual";
  usageCount: number;
  usagePeriodStart: Date;
  stripeCustomerId: string | null;
};

/** Get the current user, creating one on first sight and resetting the monthly window. */
export async function getCurrentUser(): Promise<AppUser> {
  const id = await getUserId();
  const email = await getUserEmail();

  try {
    let user = await db.user.findUnique({ where: { id } });
    if (!user) {
      user = await db.user.create({ data: { id, email: email ?? null } });
    }

    // Roll the usage window if a full period has elapsed.
    if (Date.now() - new Date(user.usagePeriodStart).getTime() > PERIOD_MS) {
      user = await db.user.update({
        where: { id },
        data: { usageCount: 0, usagePeriodStart: new Date() },
      });
    }

    return {
      id: user.id,
      email: user.email,
      tier: user.tier as TierId,
      billingInterval: user.billingInterval as "monthly" | "annual",
      usageCount: user.usageCount,
      usagePeriodStart: user.usagePeriodStart,
      stripeCustomerId: user.stripeCustomerId,
    };
  } catch {
    // DB unavailable (no DATABASE_URL / SQLite not writable on serverless) — demo user fallback.
    return {
      id,
      email: email ?? null,
      tier: "professional" as TierId,
      billingInterval: "monthly",
      usageCount: 2,
      usagePeriodStart: new Date(),
      stripeCustomerId: null,
    };
  }
}

export async function incrementUsage(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { usageCount: { increment: 1 } },
  });
}

export async function setUserTier(
  userId: string,
  tier: TierId,
  billingInterval: "monthly" | "annual" = "monthly",
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { tier, billingInterval },
  });
}
