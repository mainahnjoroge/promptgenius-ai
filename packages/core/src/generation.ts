import { resolveFramework } from "./frameworks.js";
import { BASE_SYSTEM_PROMPT } from "./system-prompt.js";
import type {
  CustomizationVariable,
  GeneratedPrompt,
  GenerationInput,
  Platform,
  SkillLevel,
  WorkflowStep,
} from "./types.js";

const SKILL_GUIDANCE: Record<SkillLevel, string> = {
  beginner:
    "The user is a BEGINNER. Keep the prompt approachable, explain variables in plain language, and avoid jargon. Bias toward a single, well-explained instruction.",
  intermediate:
    "The user is INTERMEDIATE. Use industry terminology naturally and include structure (role, context, constraints, format) without over-explaining.",
  advanced:
    "The user is ADVANCED. Produce a sophisticated, highly-structured prompt with explicit role, constraints, reasoning guidance, and output schema. Assume fluency with prompt engineering.",
};

const OUTPUT_GUIDANCE: Record<GenerationInput["outputType"], string> = {
  simple:
    "Produce a SIMPLE PROMPT: one focused, copy-paste prompt with a few variables. No multi-step system.",
  advanced:
    "Produce an ADVANCED STRUCTURED PROMPT: include role, context, constraints, step-by-step reasoning guidance, and a defined output format.",
  workflow:
    "Produce a WORKFLOW / MULTI-STEP SYSTEM: a chained sequence of prompts where each step's output feeds the next. Include a '## Workflow' section listing each step (number, title, the step prompt, and what it outputs).",
};

function platformLabel(p: Platform | undefined): string {
  switch (p) {
    case "chatgpt":
      return "ChatGPT (GPT-class models)";
    case "gemini":
      return "Google Gemini";
    case "midjourney":
      return "Midjourney (image generation)";
    case "claude":
      return "Claude";
    default:
      return "any general-purpose LLM";
  }
}

/** Build the full system prompt for a generation request. */
export function buildGenerationSystemPrompt(input: GenerationInput): string {
  const fw = resolveFramework(input.industry);
  const includeWorkflow = input.outputType === "workflow";

  return `${BASE_SYSTEM_PROMPT}

INDUSTRY CONTEXT
- Industry: <user_industry>${input.industry}</user_industry> (domain: ${fw.label})
- Apply relevant frameworks where useful: ${fw.frameworks.join(", ")}
- Use correct terminology, e.g.: ${fw.terminology.join(", ")}

CALIBRATION
- ${SKILL_GUIDANCE[input.skillLevel]}
- ${OUTPUT_GUIDANCE[input.outputType]}
- Tone/style: <user_tone>${input.tone?.trim() || "professional and confident"}</user_tone>
- Target platform: ${platformLabel(input.platform)}

OUTPUT FORMAT — respond with these markdown sections in this exact order:

## Title
A short, compelling name for the prompt.

## Use Case
1–2 sentences describing exactly what this prompt is for and who benefits.

## Prompt
The complete, copy-paste-ready prompt, wrapped in a fenced code block. Use {{DOUBLE_CURLY}} tokens for every customizable value.
${
  includeWorkflow
    ? `
## Workflow
A numbered list of steps. For EACH step use this shape:
- **Step N — <title>**: <the prompt for this step> → Outputs: <what it produces and how it feeds the next step>
`
    : ""
}
## Variables
A bullet for each customization variable, formatted exactly as:
- \`{{VARIABLE_NAME}}\` — what it controls (e.g., a concrete example)

## Example Output
A realistic example of what the prompt produces when filled in.

## Optimization Tips
3–5 bullet points on how to get the best results.

Do not include any text before "## Title" or after the last tip.`;
}

export function buildGenerationUserPrompt(input: GenerationInput): string {
  return `Create a prompt for this request:
- Industry: <user_industry>${input.industry}</user_industry>
- Use case: <user_usecase>${input.useCase}</user_usecase>
- Skill level: ${input.skillLevel}
- Output type: ${input.outputType}
- Tone: <user_tone>${input.tone?.trim() || "(use a sensible default)"}</user_tone>
- Platform: ${input.platform ?? "generic"}`;
}

/* -------------------------------------------------------------------------- */
/* Parsing model output → GeneratedPrompt                                     */
/* -------------------------------------------------------------------------- */

const HEADING_ALIASES: Record<string, string> = {
  title: "title",
  "use case": "useCase",
  "use case description": "useCase",
  prompt: "prompt",
  "copy-paste prompt": "prompt",
  "copy-paste ready prompt": "prompt",
  variables: "variables",
  "customization variables": "variables",
  workflow: "workflow",
  "example output": "exampleOutput",
  example: "exampleOutput",
  "optimization tips": "optimizationTips",
  tips: "optimizationTips",
};

function splitSections(markdown: string): Record<string, string> {
  const lines = markdown.split(/\r?\n/);
  const out: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current) out[current] = (out[current] ? out[current] + "\n" : "") + buffer.join("\n").trim();
    buffer = [];
  };

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.*?)\s*$/);
    if (heading) {
      const label = heading[1]!.replace(/[:#*]/g, "").trim().toLowerCase();
      const key = HEADING_ALIASES[label];
      if (key) {
        flush();
        current = key;
        continue;
      }
    }
    if (current) buffer.push(line);
  }
  flush();
  return out;
}

function stripFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return (fenced ? fenced[1]! : trimmed).trim();
}

function parseVariables(block: string | undefined): CustomizationVariable[] {
  if (!block) return [];
  const vars: CustomizationVariable[] = [];
  for (const raw of block.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const nameMatch = line.match(/\{\{\s*([A-Za-z0-9_ -]+?)\s*\}\}/);
    if (!nameMatch) continue;
    const name = `{{${nameMatch[1]!.trim()}}}`;
    const rest = line
      .replace(/^[-*]\s*/, "")
      .replace(/`?\{\{[^}]+\}\}`?/, "")
      .replace(/^\s*[—\-:]\s*/, "")
      .trim();
    const exampleMatch = rest.match(/\(e\.g\.?,?\s*([^)]+)\)/i);
    const description = rest.replace(/\(e\.g\.?[^)]*\)/i, "").trim() || "Customizable value.";
    vars.push({
      name,
      description,
      example: exampleMatch?.[1]?.trim(),
    });
  }
  return vars;
}

function parseBullets(block: string | undefined): string[] {
  if (!block) return [];
  return block
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
    .filter((l) => l.length > 0);
}

function parseWorkflow(block: string | undefined): WorkflowStep[] | undefined {
  if (!block) return undefined;
  const steps: WorkflowStep[] = [];
  const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let n = 0;
  for (const line of lines) {
    const m = line.match(/step\s*(\d+)\s*[—:\-]?\s*(.*)/i);
    if (!m) continue;
    n = parseInt(m[1]!, 10) || n + 1;
    const body = m[2]!.replace(/^\*+|\*+$/g, "").trim();
    const [promptPart, outputPart] = body.split(/→\s*Outputs?:/i);
    steps.push({
      step: n,
      title: (promptPart ?? body).split(":")[0]!.replace(/\*\*/g, "").trim() || `Step ${n}`,
      prompt: (promptPart ?? body).replace(/\*\*/g, "").trim(),
      output: (outputPart ?? "").trim(),
    });
  }
  return steps.length ? steps : undefined;
}

/** Parse the model's markdown into a structured GeneratedPrompt. Tolerant of drift. */
export function parseGeneratedMarkdown(
  markdown: string,
  input: GenerationInput,
  model: string,
): GeneratedPrompt {
  const s = splitSections(markdown);
  const fw = resolveFramework(input.industry);
  const platform: Platform = input.platform ?? "generic";

  return {
    title: (s.title || `${input.useCase} — ${fw.label} Prompt`).trim(),
    useCase: (s.useCase || input.useCase).trim(),
    prompt: stripFence(s.prompt || markdown),
    variables: parseVariables(s.variables),
    exampleOutput: (s.exampleOutput || "").trim(),
    optimizationTips: parseBullets(s.optimizationTips),
    workflow: parseWorkflow(s.workflow),
    meta: {
      industry: input.industry,
      useCase: input.useCase,
      skillLevel: input.skillLevel,
      outputType: input.outputType,
      platform,
      framework: fw.frameworks[0],
      model,
      mock: false,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Deterministic offline mock (no API key required)                           */
/* -------------------------------------------------------------------------- */

/** Produce a believable, structured prompt without calling any model. */
export function mockGeneratedPrompt(input: GenerationInput): GeneratedPrompt {
  const fw = resolveFramework(input.industry);
  const platform: Platform = input.platform ?? "generic";
  const tone = input.tone?.trim() || "professional and confident";
  const role = `an expert ${fw.label.toLowerCase()} specialist`;

  const promptBody = `You are ${role}. Your task is to ${input.useCase} for {{TARGET_AUDIENCE}}.

Context:
- Goal: {{PRIMARY_GOAL}}
- Constraints: {{CONSTRAINTS}}
- Tone: ${tone}

Apply the ${fw.frameworks[0]} framework. Think step by step, then produce the deliverable in this format: {{OUTPUT_FORMAT}}.

Be specific and actionable. Avoid generic filler.`;

  const workflow: WorkflowStep[] | undefined =
    input.outputType === "workflow"
      ? [
          {
            step: 1,
            title: "Research & frame",
            prompt: `As ${role}, gather the key context needed to ${input.useCase} for {{TARGET_AUDIENCE}}. List assumptions and unknowns.`,
            output: "A framed brief with assumptions — feeds Step 2.",
          },
          {
            step: 2,
            title: "Draft using framework",
            prompt: `Using the brief from Step 1, draft the deliverable applying ${fw.frameworks[0]}.`,
            output: "A first draft — feeds Step 3.",
          },
          {
            step: 3,
            title: "Refine & finalize",
            prompt: `Critique the Step 2 draft against {{SUCCESS_CRITERIA}}, then produce the final version in {{OUTPUT_FORMAT}}.`,
            output: "The polished final deliverable.",
          },
        ]
      : undefined;

  return {
    title: `${titleCase(input.useCase)} — ${fw.label} ${
      input.outputType === "workflow" ? "Workflow" : "Prompt"
    }`,
    useCase: `Helps you ${input.useCase} in ${input.industry}, calibrated for ${input.skillLevel} users on ${platformLabel(
      platform,
    )}.`,
    prompt: promptBody,
    variables: [
      { name: "{{TARGET_AUDIENCE}}", description: "Who the output is for", example: "B2B SaaS founders" },
      { name: "{{PRIMARY_GOAL}}", description: "The single most important outcome", example: "increase trial signups" },
      { name: "{{CONSTRAINTS}}", description: "Limits to respect", example: "under 150 words, no jargon" },
      { name: "{{OUTPUT_FORMAT}}", description: "The shape of the deliverable", example: "a 5-bullet summary" },
    ],
    exampleOutput: `A ${tone} ${fw.label.toLowerCase()} deliverable that ${input.useCase}, structured with ${fw.frameworks[0]} and ready to use.`,
    optimizationTips: [
      `Fill every {{VARIABLE}} before running — specificity drives quality.`,
      `For higher stakes, add a sentence asking the model to self-critique against {{SUCCESS_CRITERIA}}.`,
      `Swap the framework reference (${fw.frameworks[0]}) for another in ${fw.label} if the angle doesn't fit.`,
      `On ${platformLabel(platform)}, keep instructions ordered: role → context → task → format.`,
    ],
    workflow,
    meta: {
      industry: input.industry,
      useCase: input.useCase,
      skillLevel: input.skillLevel,
      outputType: input.outputType,
      platform,
      framework: fw.frameworks[0],
      model: "mock",
      mock: true,
    },
  };
}

function titleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}
