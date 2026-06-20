import { resolveFramework } from "./frameworks.js";
import { TIERS } from "./tiers.js";
import type { Bundle, BundleSet, GenerationInput } from "./types.js";

/**
 * Bundle generator: turns an industry + use case into 3 monetizable prompt
 * bundles (Starter / Professional / Enterprise). Uses structured outputs when
 * a live model is available; falls back to a deterministic mock otherwise.
 */

export function buildBundleSystemPrompt(): string {
  return `You are PromptGenius, a product strategist that packages prompts into monetizable bundles.

Given an industry and use case, design THREE bundles aligned to these tiers:
- "starter": 3–5 simple, broad prompts (a free lead magnet)
- "professional": 10–20 advanced, industry-specific prompts
- "enterprise": 20+ prompts including workflows, automations, and deep specialization

For each bundle provide a compelling name, a target audience, a value proposition, and a list of prompt ideas (each with a short title and one-line description). Make the prompt ideas concrete and genuinely useful for the industry.

Return ONLY structured data matching the provided schema.`;
}

export function buildBundleUserPrompt(input: GenerationInput): string {
  const fw = resolveFramework(input.industry);
  return `Industry: ${input.industry} (domain: ${fw.label})
Use case: ${input.useCase}
Relevant frameworks to reference: ${fw.frameworks.join(", ")}

Design the three bundles now.`;
}

/** JSON Schema for output_config.format (structured outputs). */
export const BUNDLE_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    bundles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          tier: { type: "string", enum: ["starter", "professional", "enterprise"] },
          name: { type: "string" },
          targetAudience: { type: "string" },
          valueProposition: { type: "string" },
          prompts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                description: { type: "string" },
              },
              required: ["title", "description"],
            },
          },
        },
        required: ["tier", "name", "targetAudience", "valueProposition", "prompts"],
      },
    },
  },
  required: ["bundles"],
} as const;

/** Coerce raw structured JSON into a typed BundleSet. */
export function toBundleSet(
  raw: { bundles: Bundle[] },
  input: GenerationInput,
): BundleSet {
  return {
    industry: input.industry,
    useCase: input.useCase,
    bundles: raw.bundles,
    mock: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Deterministic mock                                                         */
/* -------------------------------------------------------------------------- */

export function mockBundleSet(input: GenerationInput): BundleSet {
  const fw = resolveFramework(input.industry);
  const base = input.useCase.trim() || `${fw.label.toLowerCase()} work`;

  const make = (
    tier: Bundle["tier"],
    namePrefix: string,
    count: number,
  ): Bundle => ({
    tier,
    name: `${namePrefix} ${fw.label} Pack`,
    targetAudience: TIERS[tier].targetAudience,
    valueProposition: TIERS[tier].valueProposition,
    prompts: Array.from({ length: count }, (_, i) => ({
      title: `${fw.label} prompt ${i + 1}`,
      description: `Helps ${base} using ${fw.frameworks[i % fw.frameworks.length]}.`,
    })),
  });

  return {
    industry: input.industry,
    useCase: input.useCase,
    bundles: [
      make("starter", "Starter", 4),
      make("professional", "Pro", 12),
      make("enterprise", "Enterprise", 22),
    ],
    mock: true,
  };
}
