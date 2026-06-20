import type {
  CustomizationVariable,
  GeneratedPrompt,
  OutputType,
  Platform,
  SkillLevel,
  WorkflowStep,
} from "@promptgenius/core";

/** Client-safe DTO for a saved prompt (no server-only deps). */
export interface SavedPromptDTO {
  id: string;
  title: string;
  useCase: string;
  prompt: string;
  exampleOutput: string;
  industry: string;
  skillLevel: SkillLevel;
  outputType: OutputType;
  platform: Platform;
  framework: string | null;
  variables: CustomizationVariable[];
  optimizationTips: string[];
  workflow: WorkflowStep[] | null;
  favorite: boolean;
  createdAt: string;
}

/** Map a saved DTO back into the GeneratedPrompt shape used by PromptView. */
export function dtoToGeneratedPrompt(d: SavedPromptDTO): GeneratedPrompt {
  return {
    title: d.title,
    useCase: d.useCase,
    prompt: d.prompt,
    variables: d.variables,
    exampleOutput: d.exampleOutput,
    optimizationTips: d.optimizationTips,
    workflow: d.workflow ?? undefined,
    meta: {
      industry: d.industry,
      useCase: d.useCase,
      skillLevel: d.skillLevel,
      outputType: d.outputType,
      platform: d.platform,
      framework: d.framework ?? undefined,
      model: "saved",
      mock: false,
    },
  };
}
