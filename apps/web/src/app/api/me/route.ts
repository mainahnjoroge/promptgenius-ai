import { quotaStatus, getTier } from "@promptgenius/core";
import { getCurrentUser } from "@/lib/user";
import { aiEnabled, authEnabledServer, billingEnabledServer } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = getTier(user.tier);
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      tier: user.tier,
      billingInterval: user.billingInterval,
    },
    quota: quotaStatus(user.tier, user.usageCount),
    tier: {
      name: tier.name,
      allowedOutputTypes: tier.allowedOutputTypes,
    },
    // Internal config flags only returned in non-production for debugging.
    ...(process.env.NODE_ENV !== "production" && {
      flags: { ai: aiEnabled, auth: authEnabledServer, billing: billingEnabledServer },
    }),
  });
}
