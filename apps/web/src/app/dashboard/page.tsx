import { getTier, quotaStatus } from "@promptgenius/core";
import { getCurrentUser } from "@/lib/user";
import { listSavedPrompts } from "@/lib/prompts";
import { aiEnabled } from "@/lib/env.server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const { upgraded } = await searchParams;
  const user = await getCurrentUser();
  const prompts = await listSavedPrompts(user.id);
  const tier = getTier(user.tier);
  const quota = quotaStatus(user.tier, user.usageCount);

  return (
    <DashboardClient
      initialPrompts={prompts}
      tier={user.tier}
      tierName={tier.name}
      allowedOutputTypes={tier.allowedOutputTypes}
      quota={quota}
      aiEnabled={aiEnabled}
      upgradedTo={upgraded ?? null}
    />
  );
}
