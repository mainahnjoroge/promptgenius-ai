import type {
  GenerationInput,
  OutputType,
  Platform,
  SkillLevel,
} from "@promptgenius/core";

const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced"];
const OUTPUTS: OutputType[] = ["simple", "advanced", "workflow"];
const PLATFORMS: Platform[] = ["claude", "chatgpt", "gemini", "midjourney", "generic"];

// Strip characters that enable prompt injection: newlines and backticks are the
// primary vectors when content is interpolated into a system prompt.
function sanitize(s: string, maxLen: number): string {
  return s.replace(/[\r\n`]/g, " ").trim().slice(0, maxLen);
}

/** Normalize + validate a generation request body. Returns null if invalid. */
export function parseGenerationInput(body: unknown): GenerationInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const industry = typeof b.industry === "string" ? sanitize(b.industry, 120) : "";
  const useCase = typeof b.useCase === "string" ? sanitize(b.useCase, 400) : "";
  if (!industry || !useCase) return null;

  const skillLevel = SKILLS.includes(b.skillLevel as SkillLevel)
    ? (b.skillLevel as SkillLevel)
    : "intermediate";
  const outputType = OUTPUTS.includes(b.outputType as OutputType)
    ? (b.outputType as OutputType)
    : "simple";
  const platform = PLATFORMS.includes(b.platform as Platform)
    ? (b.platform as Platform)
    : "generic";
  const tone =
    typeof b.tone === "string" ? sanitize(b.tone, 120) : undefined;

  return { industry, useCase, skillLevel, outputType, platform, tone };
}
