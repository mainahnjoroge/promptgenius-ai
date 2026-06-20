"use client";

import { useState } from "react";
import { Wand2 } from "lucide-react";
import {
  mockGeneratedPrompt,
  type GeneratedPrompt,
  type GenerationInput,
} from "@promptgenius/core";
import { Button } from "./ui/button";
import { PromptView } from "./prompt-view";

const PRESETS: { label: string; input: GenerationInput }[] = [
  {
    label: "Marketing — launch email",
    input: {
      industry: "Marketing",
      useCase: "write a product launch email",
      skillLevel: "intermediate",
      outputType: "advanced",
      platform: "claude",
    },
  },
  {
    label: "Healthcare — patient summary",
    input: {
      industry: "Healthcare",
      useCase: "summarize a patient visit as a SOAP note",
      skillLevel: "advanced",
      outputType: "advanced",
      platform: "claude",
    },
  },
  {
    label: "E-commerce — product copy",
    input: {
      industry: "E-commerce",
      useCase: "write a high-converting product description",
      skillLevel: "beginner",
      outputType: "simple",
      platform: "chatgpt",
    },
  },
];

export function HeroDemo() {
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<GeneratedPrompt | null>(null);

  function run(i: number) {
    setActive(i);
    setResult(mockGeneratedPrompt(PRESETS[i]!.input));
  }

  return (
    <div className="card glow w-full max-w-xl p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => run(i)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              active === i && result
                ? "border-brand/60 bg-brand/15 text-brand-soft"
                : "border-border bg-surface-2 text-muted hover:text-slate-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!result ? (
        <div className="rounded-xl border border-dashed border-border bg-bg/40 p-8 text-center">
          <Wand2 className="mx-auto mb-3 h-8 w-8 text-brand-soft" />
          <p className="text-sm text-muted">
            Pick a use case and generate a structured, copy-paste-ready prompt —
            instantly, right here.
          </p>
          <Button className="mt-4" onClick={() => run(active)}>
            Generate a sample prompt
          </Button>
        </div>
      ) : (
        <div className="scroll-thin max-h-[28rem] overflow-auto pr-1">
          <PromptView prompt={result} />
        </div>
      )}
    </div>
  );
}
