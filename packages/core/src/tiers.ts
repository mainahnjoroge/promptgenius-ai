import type { BillingInterval, TierDefinition, TierId } from "./types.js";

/**
 * The product's monetization tiers. These are real, code-enforced definitions
 * (quotas, gated output types, pricing) — not LLM-simulated.
 */
export const TIERS: Record<TierId, TierDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Explore prompt generation, free forever.",
    targetAudience: "Curious creators, students, and first-time prompt users.",
    valueProposition:
      "Generate clean, structured prompts across any industry to see the value before you commit.",
    priceMonthly: 0,
    priceAnnualPerMonth: 0,
    annualDiscountPct: 0,
    promptQuota: 5,
    allowedOutputTypes: ["simple"],
    features: [
      { label: "5 prompt generations / month", included: true },
      { label: "Simple structured prompts", included: true },
      { label: "All industries & use cases", included: true },
      { label: "Save & favorite prompts", included: true },
      { label: "Advanced structured prompts", included: false },
      { label: "Multi-step workflows", included: false },
      { label: "Bundle & pricing generator", included: false },
      { label: "API access", included: false },
    ],
    upsellTrigger:
      "You're getting great results — unlock advanced structured prompts and 20× the quota with Professional.",
  },
  professional: {
    id: "professional",
    name: "Professional",
    tagline: "Industry-grade prompts for working professionals.",
    targetAudience: "Marketers, founders, consultants, and creators shipping daily.",
    valueProposition:
      "Advanced, framework-driven prompts plus monetizable bundles, tuned to your industry.",
    priceMonthly: 29,
    priceAnnualPerMonth: 23,
    annualDiscountPct: 20,
    promptQuota: 100,
    allowedOutputTypes: ["simple", "advanced"],
    features: [
      { label: "100 prompt generations / month", included: true },
      { label: "Advanced structured prompts", included: true },
      { label: "Industry frameworks (AIDA, SOAP, SWOT…)", included: true },
      { label: "Bundle & pricing generator", included: true },
      { label: "Save, favorite & edit prompts", included: true },
      { label: "Multi-step workflows", included: false },
      { label: "API access", included: false },
      { label: "Team seats", included: false },
    ],
    highlight: true,
    upsellTrigger:
      "Scaling up? Enterprise adds multi-step workflows, unlimited generations, and API access.",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Workflows, automation, and scale for teams.",
    targetAudience: "Agencies, product teams, and businesses operationalizing AI.",
    valueProposition:
      "Multi-step workflow systems, unlimited generation, and API-ready outputs for automation.",
    priceMonthly: 199,
    priceAnnualPerMonth: 149,
    annualDiscountPct: 25,
    promptQuota: "unlimited",
    allowedOutputTypes: ["simple", "advanced", "workflow"],
    features: [
      { label: "Unlimited generations", included: true },
      { label: "Multi-step workflow systems", included: true },
      { label: "Advanced structured prompts", included: true },
      { label: "Bundle & pricing generator", included: true },
      { label: "API access (JSON-ready outputs)", included: true },
      { label: "Priority model effort", included: true },
      { label: "Team seats & sharing", included: true },
      { label: "Custom pricing available", included: true },
    ],
  },
};

export const TIER_ORDER: TierId[] = ["starter", "professional", "enterprise"];

export function getTier(id: TierId): TierDefinition {
  return TIERS[id];
}

/** The next tier up, or null if already at the top. */
export function nextTier(id: TierId): TierId | null {
  const idx = TIER_ORDER.indexOf(id);
  return idx >= 0 && idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1]! : null;
}

export function tierRank(id: TierId): number {
  return TIER_ORDER.indexOf(id);
}

/** Display price for a tier at a given billing interval (per month). */
export function priceFor(id: TierId, interval: BillingInterval): number {
  const t = TIERS[id];
  return interval === "annual" ? t.priceAnnualPerMonth : t.priceMonthly;
}

/** Total charged today for an annual plan (12 × discounted monthly). */
export function annualTotal(id: TierId): number {
  return TIERS[id].priceAnnualPerMonth * 12;
}
