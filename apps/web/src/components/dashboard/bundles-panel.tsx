"use client";

import { useState } from "react";
import { Boxes, Loader2, Lock } from "lucide-react";
import {
  canUseBundleGenerator,
  type BundleSet,
  type GateResult,
  type GenerationInput,
  type TierId,
} from "@promptgenius/core";
import { Button } from "@/components/ui/button";

const TIER_LABEL: Record<string, string> = {
  starter: "Starter (Free)",
  professional: "Professional ($)",
  enterprise: "Enterprise ($$$)",
};

export function BundlesPanel({
  input,
  tier,
  onGate,
}: {
  input: GenerationInput;
  tier: TierId;
  onGate: (gate: GateResult) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [bundles, setBundles] = useState<BundleSet | null>(null);
  const allowed = canUseBundleGenerator(tier);

  async function generate() {
    if (!allowed) {
      onGate({
        allowed: false,
        reason: "bundles",
        upgradeTo: "professional",
        message:
          "The bundle & pricing generator is a Professional feature. Upgrade to package your prompts for sale.",
      });
      return;
    }
    if (!input.industry || !input.useCase) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.status === 402) {
        const data = await res.json();
        onGate(data.gate);
        return;
      }
      if (res.ok) setBundles(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-slate-50">
              <Boxes className="h-4 w-4 text-brand-soft" /> Bundle &amp; pricing generator
            </h3>
            <p className="mt-1 text-sm text-muted">
              Package this industry + use case into 3 monetizable tiers.
            </p>
          </div>
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !allowed ? (
              <Lock className="h-4 w-4" />
            ) : null}
            Generate bundles
          </Button>
        </div>
      </div>

      {bundles && (
        <div className="grid gap-5 lg:grid-cols-3">
          {bundles.bundles.map((b) => (
            <div key={b.tier} className="card p-5">
              <p className="text-xs uppercase tracking-wide text-brand-soft">
                {TIER_LABEL[b.tier] ?? b.tier}
              </p>
              <h4 className="mt-1 font-bold text-slate-50">{b.name}</h4>
              <p className="mt-2 text-xs text-muted">
                <span className="font-medium text-slate-300">Audience:</span>{" "}
                {b.targetAudience}
              </p>
              <p className="mt-1 text-xs text-muted">
                <span className="font-medium text-slate-300">Value:</span>{" "}
                {b.valueProposition}
              </p>
              <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                {b.prompts.slice(0, 8).map((p, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-slate-200">{p.title}</span>
                    <span className="text-muted"> — {p.description}</span>
                  </li>
                ))}
                {b.prompts.length > 8 && (
                  <li className="text-xs text-muted">
                    + {b.prompts.length - 8} more prompts
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
