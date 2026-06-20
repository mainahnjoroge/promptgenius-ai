/**
 * Shared, isomorphic domain types for PromptGenius AI.
 * Safe to import from web (server + client) AND mobile — no native deps here.
 */

export type SkillLevel = "beginner" | "intermediate" | "advanced";

/** Output complexity the user requests. */
export type OutputType = "simple" | "advanced" | "workflow";

export type Platform =
  | "claude"
  | "chatgpt"
  | "gemini"
  | "midjourney"
  | "generic";

export type TierId = "starter" | "professional" | "enterprise";

/** Inputs that drive a single prompt generation. */
export interface GenerationInput {
  industry: string;
  useCase: string;
  skillLevel: SkillLevel;
  outputType: OutputType;
  tone?: string;
  platform?: Platform;
}

export interface CustomizationVariable {
  /** The placeholder token, e.g. "{{TARGET_AUDIENCE}}". */
  name: string;
  description: string;
  example?: string;
}

/** A single step in a multi-step workflow output. */
export interface WorkflowStep {
  step: number;
  title: string;
  prompt: string;
  /** What this step produces and how it feeds the next step. */
  output: string;
}

/** The canonical 6-part structured prompt this product generates. */
export interface GeneratedPrompt {
  title: string;
  /** Use Case Description. */
  useCase: string;
  /** Copy-paste ready prompt. */
  prompt: string;
  variables: CustomizationVariable[];
  exampleOutput: string;
  optimizationTips: string[];
  /** Present only when outputType === "workflow". */
  workflow?: WorkflowStep[];
  meta: GeneratedPromptMeta;
}

export interface GeneratedPromptMeta {
  industry: string;
  useCase: string;
  skillLevel: SkillLevel;
  outputType: OutputType;
  platform: Platform;
  framework?: string;
  model: string;
  /** True when produced by the deterministic offline mock (no API key). */
  mock: boolean;
}

/* -------------------------------------------------------------------------- */
/* Bundles                                                                    */
/* -------------------------------------------------------------------------- */

export interface BundlePrompt {
  title: string;
  description: string;
}

export interface Bundle {
  tier: TierId;
  name: string;
  targetAudience: string;
  valueProposition: string;
  prompts: BundlePrompt[];
}

export interface BundleSet {
  industry: string;
  useCase: string;
  bundles: Bundle[];
  mock: boolean;
}

/* -------------------------------------------------------------------------- */
/* Tiers / pricing                                                            */
/* -------------------------------------------------------------------------- */

export interface TierFeature {
  label: string;
  included: boolean;
}

export interface TierDefinition {
  id: TierId;
  name: string;
  tagline: string;
  targetAudience: string;
  valueProposition: string;
  /** Monthly price in USD (0 for free). */
  priceMonthly: number;
  /** Effective monthly price when billed annually. */
  priceAnnualPerMonth: number;
  annualDiscountPct: number;
  /** Generations allowed per billing period; "unlimited" for top tier. */
  promptQuota: number | "unlimited";
  allowedOutputTypes: OutputType[];
  features: TierFeature[];
  highlight?: boolean;
  /** Copy shown to nudge an upgrade from the tier below. */
  upsellTrigger?: string;
}

export type BillingInterval = "monthly" | "annual";
