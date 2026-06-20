"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { GeneratedPrompt } from "@promptgenius/core";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs text-muted hover:text-slate-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-soft">
      {children}
    </h4>
  );
}

export function PromptView({
  prompt,
  className,
}: {
  prompt: GeneratedPrompt;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-slate-50">{prompt.title}</h3>
          {prompt.meta.mock && (
            <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
              sample
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{prompt.useCase}</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>Copy-paste prompt</SectionTitle>
          <CopyButton text={prompt.prompt} />
        </div>
        <pre className="scroll-thin max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-bg/60 p-4 text-sm leading-relaxed text-slate-200">
          {prompt.prompt}
        </pre>
      </div>

      {prompt.workflow && prompt.workflow.length > 0 && (
        <div>
          <SectionTitle>Workflow</SectionTitle>
          <ol className="space-y-3">
            {prompt.workflow.map((s) => (
              <li key={s.step} className="rounded-xl border border-border bg-surface-2/60 p-3">
                <div className="text-sm font-semibold text-slate-100">
                  {s.step}. {s.title}
                </div>
                <p className="mt-1 text-sm text-slate-300">{s.prompt}</p>
                {s.output && (
                  <p className="mt-1 text-xs text-muted">→ {s.output}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {prompt.variables.length > 0 && (
        <div>
          <SectionTitle>Customization variables</SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {prompt.variables.map((v) => (
              <li
                key={v.name}
                className="rounded-lg border border-border bg-surface-2/50 p-2.5 text-sm"
              >
                <code className="text-accent">{v.name}</code>
                <span className="text-slate-300"> — {v.description}</span>
                {v.example && (
                  <span className="text-muted"> (e.g., {v.example})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {prompt.exampleOutput && (
        <div>
          <SectionTitle>Example output</SectionTitle>
          <p className="whitespace-pre-wrap rounded-xl border border-border bg-surface-2/40 p-3 text-sm text-slate-300">
            {prompt.exampleOutput}
          </p>
        </div>
      )}

      {prompt.optimizationTips.length > 0 && (
        <div>
          <SectionTitle>Optimization tips</SectionTitle>
          <ul className="space-y-1.5">
            {prompt.optimizationTips.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
