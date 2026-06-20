import { TIERS, nextTier, tierRank } from "./tiers.js";
import type { OutputType, TierId } from "./types.js";

/**
 * Feature-gating + quota logic. The web API enforces these server-side; the
 * UI uses them to decide when to show upgrade CTAs.
 */

export interface QuotaStatus {
  used: number;
  limit: number | "unlimited";
  remaining: number | "unlimited";
  exceeded: boolean;
}

export function quotaStatus(tier: TierId, used: number): QuotaStatus {
  const limit = TIERS[tier].promptQuota;
  if (limit === "unlimited") {
    return { used, limit, remaining: "unlimited", exceeded: false };
  }
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, exceeded: used >= limit };
}

export function canUseOutputType(tier: TierId, outputType: OutputType): boolean {
  return TIERS[tier].allowedOutputTypes.includes(outputType);
}

/** Bundle/pricing generator is gated to Professional and above. */
export function canUseBundleGenerator(tier: TierId): boolean {
  return tierRank(tier) >= tierRank("professional");
}

export function canUseApi(tier: TierId): boolean {
  return tier === "enterprise";
}

export type GateReason = "quota" | "output_type" | "bundles" | "api";

export interface GateResult {
  allowed: boolean;
  reason?: GateReason;
  /** Suggested upgrade target. */
  upgradeTo?: TierId | null;
  message?: string;
}

const OUTPUT_TYPE_LABEL: Record<OutputType, string> = {
  simple: "simple prompts",
  advanced: "advanced structured prompts",
  workflow: "multi-step workflow systems",
};

/** Decide whether a generation request is allowed for a tier + usage. */
export function evaluateGeneration(
  tier: TierId,
  outputType: OutputType,
  used: number,
): GateResult {
  if (!canUseOutputType(tier, outputType)) {
    const target = firstTierWithOutputType(outputType);
    return {
      allowed: false,
      reason: "output_type",
      upgradeTo: target,
      message: `${OUTPUT_TYPE_LABEL[outputType]} are available on ${
        target ? TIERS[target].name : "a higher"
      } and above. Upgrade to unlock them.`,
    };
  }
  const q = quotaStatus(tier, used);
  if (q.exceeded) {
    const target = nextTier(tier);
    return {
      allowed: false,
      reason: "quota",
      upgradeTo: target,
      message: target
        ? `You've used all ${q.limit} generations this month. Upgrade to ${TIERS[target].name} for ${
            TIERS[target].promptQuota === "unlimited"
              ? "unlimited"
              : TIERS[target].promptQuota
          } generations.`
        : "You've reached your generation limit for this period.",
    };
  }
  return { allowed: true };
}

function firstTierWithOutputType(outputType: OutputType): TierId | null {
  if (canUseOutputType("starter", outputType)) return "starter";
  if (canUseOutputType("professional", outputType)) return "professional";
  if (canUseOutputType("enterprise", outputType)) return "enterprise";
  return null;
}

/** Generic upsell copy for a locked feature. */
export function upsellMessage(currentTier: TierId): string {
  const target = nextTier(currentTier);
  if (!target) return "You're on our top tier — you have access to everything.";
  return (
    TIERS[currentTier].upsellTrigger ??
    `Unlock more with ${TIERS[target].name}.`
  );
}
