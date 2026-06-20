import { describe, expect, it } from "vitest";
import {
  evaluateGeneration,
  mockGeneratedPrompt,
  parseGeneratedMarkdown,
  quotaStatus,
  type GenerationInput,
} from "../src/index.js";

const baseInput: GenerationInput = {
  industry: "Marketing",
  useCase: "write a launch email",
  skillLevel: "intermediate",
  outputType: "advanced",
  tone: "punchy",
  platform: "claude",
};

describe("mockGeneratedPrompt", () => {
  it("produces a complete 6-part prompt with no API key", () => {
    const p = mockGeneratedPrompt(baseInput);
    expect(p.title).toBeTruthy();
    expect(p.useCase).toBeTruthy();
    expect(p.prompt).toContain("{{TARGET_AUDIENCE}}");
    expect(p.variables.length).toBeGreaterThanOrEqual(3);
    expect(p.exampleOutput).toBeTruthy();
    expect(p.optimizationTips.length).toBeGreaterThanOrEqual(3);
    expect(p.meta.mock).toBe(true);
  });

  it("includes workflow steps for workflow output type", () => {
    const p = mockGeneratedPrompt({ ...baseInput, outputType: "workflow" });
    expect(p.workflow?.length).toBe(3);
    expect(p.workflow?.[0]?.step).toBe(1);
  });

  it("selects the Marketing framework", () => {
    const p = mockGeneratedPrompt(baseInput);
    expect(p.meta.framework).toBe("AIDA");
  });
});

describe("parseGeneratedMarkdown", () => {
  it("parses the 6 sections from well-formed markdown", () => {
    const md = `## Title
Killer Launch Email

## Use Case
Drive signups for a new feature.

## Prompt
\`\`\`
You are a marketer. Write for {{AUDIENCE}}.
\`\`\`

## Variables
- \`{{AUDIENCE}}\` — who it targets (e.g., trial users)
- \`{{OFFER}}\` — the incentive (e.g., 20% off)

## Example Output
Subject: You're going to love this...

## Optimization Tips
- Personalize the subject line
- Keep it under 120 words
- Add one clear CTA`;

    const parsed = parseGeneratedMarkdown(md, baseInput, "claude-opus-4-8");
    expect(parsed.title).toBe("Killer Launch Email");
    expect(parsed.useCase).toContain("Drive signups");
    expect(parsed.prompt).toContain("{{AUDIENCE}}");
    expect(parsed.prompt).not.toContain("```");
    expect(parsed.variables.map((v) => v.name)).toEqual(["{{AUDIENCE}}", "{{OFFER}}"]);
    expect(parsed.variables[0]?.example).toBe("trial users");
    expect(parsed.optimizationTips).toHaveLength(3);
    expect(parsed.meta.mock).toBe(false);
  });

  it("is tolerant of missing sections", () => {
    const parsed = parseGeneratedMarkdown("just some text", baseInput, "claude-opus-4-8");
    expect(parsed.title).toBeTruthy();
    expect(parsed.prompt).toContain("just some text");
  });
});

describe("quota + gating", () => {
  it("computes quota status for a limited tier", () => {
    const q = quotaStatus("starter", 5);
    expect(q.exceeded).toBe(true);
    expect(q.remaining).toBe(0);
  });

  it("treats enterprise as unlimited", () => {
    const q = quotaStatus("enterprise", 9999);
    expect(q.limit).toBe("unlimited");
    expect(q.exceeded).toBe(false);
  });

  it("blocks workflow output on starter and suggests enterprise", () => {
    const res = evaluateGeneration("starter", "workflow", 0);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("output_type");
    expect(res.upgradeTo).toBe("enterprise");
  });

  it("blocks generation when quota exceeded", () => {
    const res = evaluateGeneration("starter", "simple", 5);
    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("quota");
    expect(res.upgradeTo).toBe("professional");
  });

  it("allows an in-quota simple generation on starter", () => {
    expect(evaluateGeneration("starter", "simple", 2).allowed).toBe(true);
  });
});
