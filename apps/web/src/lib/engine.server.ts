import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  BUNDLE_JSON_SCHEMA,
  buildBundleSystemPrompt,
  buildBundleUserPrompt,
  buildGenerationSystemPrompt,
  buildGenerationUserPrompt,
  mockBundleSet,
  mockGeneratedPrompt,
  toBundleSet,
  type BundleSet,
  type GeneratedPrompt,
  type GenerationInput,
} from "@promptgenius/core";
import { aiEnabled, serverEnv } from "./env.server";

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: serverEnv.anthropicApiKey });
  return client;
}

export { aiEnabled };

/** Render a GeneratedPrompt back into the markdown the parser understands. */
export function renderPromptMarkdown(p: GeneratedPrompt): string {
  const parts: string[] = [];
  parts.push(`## Title\n${p.title}`);
  parts.push(`## Use Case\n${p.useCase}`);
  parts.push("## Prompt\n```\n" + p.prompt + "\n```");
  if (p.workflow?.length) {
    const steps = p.workflow
      .map(
        (s) =>
          `- **Step ${s.step} — ${s.title}**: ${s.prompt} → Outputs: ${s.output}`,
      )
      .join("\n");
    parts.push(`## Workflow\n${steps}`);
  }
  const vars = p.variables
    .map(
      (v) =>
        `- \`${v.name}\` — ${v.description}${v.example ? ` (e.g., ${v.example})` : ""}`,
    )
    .join("\n");
  parts.push(`## Variables\n${vars}`);
  parts.push(`## Example Output\n${p.exampleOutput}`);
  parts.push(
    `## Optimization Tips\n${p.optimizationTips.map((t) => `- ${t}`).join("\n")}`,
  );
  return parts.join("\n\n");
}

function* chunkString(text: string, size = 28): Generator<string> {
  for (let i = 0; i < text.length; i += size) yield text.slice(i, i + size);
}

/**
 * Stream the generated prompt as markdown chunks. Uses the live Claude API when
 * ANTHROPIC_API_KEY is set; otherwise streams a deterministic mock so the UX is
 * identical with no API key.
 */
export async function* streamGenerationMarkdown(
  input: GenerationInput,
): AsyncGenerator<string> {
  if (!aiEnabled) {
    const md = renderPromptMarkdown(mockGeneratedPrompt(input));
    for (const piece of chunkString(md)) {
      // Tiny delay to simulate token streaming.
      await new Promise((r) => setTimeout(r, 12));
      yield piece;
    }
    return;
  }

  const stream = anthropic().messages.stream({
    model: serverEnv.model,
    max_tokens: 8000,
    system: buildGenerationSystemPrompt(input),
    messages: [{ role: "user", content: buildGenerationUserPrompt(input) }],
    // Effort tunes depth/cost; thinking is left off here for snappy streaming.
    output_config: { effort: serverEnv.effort },
  } as Anthropic.MessageStreamParams);

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

/** Generate the 3-tier bundle set (structured output live, mock otherwise). */
export async function generateBundles(input: GenerationInput): Promise<BundleSet> {
  if (!aiEnabled) return mockBundleSet(input);

  const res = await anthropic().messages.create({
    model: serverEnv.model,
    max_tokens: 4000,
    system: buildBundleSystemPrompt(),
    messages: [{ role: "user", content: buildBundleUserPrompt(input) }],
    output_config: {
      format: { type: "json_schema", schema: BUNDLE_JSON_SCHEMA },
    },
  } as Anthropic.MessageCreateParamsNonStreaming);

  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return mockBundleSet(input);
  try {
    const raw = JSON.parse(text.text) as { bundles: BundleSet["bundles"] };
    return toBundleSet(raw, input);
  } catch {
    return mockBundleSet(input);
  }
}
