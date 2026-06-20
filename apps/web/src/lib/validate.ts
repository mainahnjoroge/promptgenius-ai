import type {
  GenerationInput,
  OutputType,
  Platform,
  SkillLevel,
} from "@promptgenius/core";

const SKILLS: SkillLevel[] = ["beginner", "intermediate", "advanced"];
const OUTPUTS: OutputType[] = ["simple", "advanced", "workflow"];
const PLATFORMS: Platform[] = ["claude", "chatgpt", "gemini", "midjourney", "generic"];

/** Normalize + validate a generation request body. Returns null if invalid. */
export function parseGenerationInput(body: unknown): GenerationInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const industry = typeof b.industry === "string" ? b.industry.trim() : "";
  const useCase = typeof b.useCase === "string" ? b.useCase.trim() : "";
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
  const tone = typeof b.tone === "string" ? b.tone.slice(0, 120) : undefined;

  return {
    industry: industry.slice(0, 120),
    useCase: useCase.slice(0, 400),
    skillLevel,
    outputType,
    platform,
    tone,
  };
}
