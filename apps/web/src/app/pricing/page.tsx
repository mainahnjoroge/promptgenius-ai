import type { TierId } from "@promptgenius/core";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingCards } from "@/components/pricing-cards";
import { getCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

const FAQ = [
  {
    q: "Can I really start for free?",
    a: "Yes. The Starter plan is free forever and includes 5 generations a month across every industry — no card required.",
  },
  {
    q: "How does annual billing save money?",
    a: "Annual plans are discounted up to 25% versus monthly. You're billed once for the year at the lower effective rate.",
  },
  {
    q: "What unlocks at each tier?",
    a: "Starter covers simple prompts. Professional adds advanced structured prompts, industry frameworks, and the bundle generator. Enterprise adds multi-step workflows, unlimited generations, and API access.",
  },
  {
    q: "Can I sell the prompts I generate?",
    a: "That's the point. Professional and Enterprise include the bundle & pricing generator so you can package prompts into tiers and monetize them.",
  },
];

export default async function PricingPage() {
  let currentTier: TierId | undefined;
  try {
    const user = await getCurrentUser();
    currentTier = user.tier;
  } catch {
    currentTier = undefined;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container-px py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Pricing that scales with your <span className="gradient-text">prompt business</span>
          </h1>
          <p className="mt-4 text-muted">
            Free to start. Upgrade to unlock advanced prompts, bundles, workflows, and API access.
          </p>
        </div>

        <div className="mt-14">
          <PricingCards currentTier={currentTier} />
        </div>

        {/* Pricing model engine highlights */}
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          <div className="card p-6">
            <h3 className="font-semibold text-slate-50">Annual discount strategy</h3>
            <p className="mt-2 text-sm text-muted">
              Up to 25% off when billed yearly — locks in commitment and lowers churn while
              improving cash flow.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-slate-50">Upsell triggers</h3>
            <p className="mt-2 text-sm text-muted">
              Hit a quota or a gated feature and you'll see a contextual upgrade prompt — the right
              offer at the moment of intent.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-slate-50">Feature gating</h3>
            <p className="mt-2 text-sm text-muted">
              Output complexity, generation quota, bundles, and API access are enforced per tier —
              server-side, not just hidden in the UI.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-center text-2xl font-bold">Frequently asked</h2>
          <div className="mt-8 grid gap-4">
            {FAQ.map((f) => (
              <div key={f.q} className="card p-5">
                <h3 className="font-semibold text-slate-100">{f.q}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
