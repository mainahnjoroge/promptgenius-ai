import { quotaStatus, getTier } from "@promptgenius/core";
import { getCurrentUser } from "@/lib/user";
import { aiEnabled, authEnabledServer, billingEnabledServer } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
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
    flags: {
      ai: aiEnabled,
      auth: authEnabledServer,
      billing: billingEnabledServer,
    },
  });
}
