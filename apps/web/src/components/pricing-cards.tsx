"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Loader2 } from "lucide-react";
import {
  TIERS,
  TIER_ORDER,
  annualTotal,
  priceFor,
  type BillingInterval,
  type TierId,
} from "@promptgenius/core";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function PricingCards({ currentTier }: { currentTier?: TierId }) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [loading, setLoading] = useState<TierId | null>(null);
  const router = useRouter();

  async function upgrade(tier: TierId) {
    setLoading(tier);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (data.url) {
        if (data.mock) router.push(data.url);
        else window.location.href = data.url;
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={cn("text-sm", interval === "monthly" ? "text-slate-100" : "text-muted")}>
          Monthly
        </span>
        <button
          onClick={() => setInterval((i) => (i === "monthly" ? "annual" : "monthly"))}
          className="relative h-6 w-12 rounded-full border border-border bg-surface-2"
          aria-label="Toggle billing interval"
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-brand transition-all",
              interval === "annual" ? "left-7" : "left-0.5",
            )}
          />
        </button>
        <span className={cn("text-sm", interval === "annual" ? "text-slate-100" : "text-muted")}>
          Annual <span className="text-accent">(save up to 25%)</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {TIER_ORDER.map((id) => {
          const tier = TIERS[id];
          const price = priceFor(id, interval);
          const isCurrent = currentTier === id;
          return (
            <div
              key={id}
              className={cn(
                "card relative flex flex-col p-6",
                tier.highlight && "border-brand/60 glow",
              )}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-fg">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-slate-50">{tier.name}</h3>
              <p className="mt-1 text-sm text-muted">{tier.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-50">
                  {price === 0 ? "Free" : `$${price}`}
                </span>
                {price > 0 && <span className="text-sm text-muted">/mo</span>}
              </div>
              {price > 0 && interval === "annual" && (
                <p className="mt-1 text-xs text-accent">
                  ${annualTotal(id)} billed yearly
                </p>
              )}

              <div className="mt-5">
                {id === "starter" ? (
                  <Link href="/dashboard">
                    <Button variant="secondary" className="w-full">
                      {isCurrent ? "Current plan" : "Start free"}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full"
                    variant={tier.highlight ? "primary" : "secondary"}
                    disabled={isCurrent || loading === id}
                    onClick={() => upgrade(id)}
                  >
                    {loading === id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCurrent ? "Current plan" : `Upgrade to ${tier.name}`}
                  </Button>
                )}
              </div>

              <p className="mt-5 text-xs uppercase tracking-wide text-muted">
                {tier.targetAudience}
              </p>
              <ul className="mt-3 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2 text-sm">
                    {f.included ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-muted/50" />
                    )}
                    <span className={f.included ? "text-slate-200" : "text-muted/70"}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
