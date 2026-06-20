import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  Filter,
  Layers,
  LineChart,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroDemo } from "@/components/hero-demo";
import { PricingCards } from "@/components/pricing-cards";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Any industry, instantly",
    body: "Marketing, healthcare, legal, finance, e-commerce and more — outputs use the right frameworks (AIDA, SOAP, SWOT) and terminology.",
  },
  {
    icon: Layers,
    title: "Structured 6-part output",
    body: "Every prompt ships with a title, use case, copy-paste prompt, variables, an example output, and optimization tips.",
  },
  {
    icon: Workflow,
    title: "Multi-step workflows",
    body: "Go beyond single prompts — generate chained, multi-step systems where each step's output feeds the next.",
  },
  {
    icon: Boxes,
    title: "Monetizable bundles",
    body: "Package prompts into Starter, Professional, and Enterprise bundles with audiences and value props, ready to sell.",
  },
  {
    icon: Filter,
    title: "Smart filter system",
    body: "Dial in industry, use case, skill level, and output complexity. The engine adapts depth and tone to match.",
  },
  {
    icon: Zap,
    title: "API-ready & live AI",
    body: "Powered by Claude with streaming output and JSON-ready structure — drop it into your automation stack.",
  },
];

const STEPS = [
  {
    icon: Filter,
    title: "Choose your filters",
    body: "Pick an industry, use case, skill level, and output type.",
  },
  {
    icon: Sparkles,
    title: "Generate live",
    body: "Watch a structured, copy-paste-ready prompt stream in real time.",
  },
  {
    icon: LineChart,
    title: "Save, bundle & monetize",
    body: "Favorite the best, package them into tiers, and ship a product.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-px relative grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-brand-soft">
              <Sparkles className="h-3.5 w-3.5" /> The commercial prompt engine
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Generate prompts that <span className="gradient-text">sell themselves.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              PromptGenius AI turns any industry + use case into high-performance,
              structured prompts — then helps you bundle, price, and ship them as a
              product.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button size="lg">
                  Start generating free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="secondary">
                  See pricing
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">
              No credit card needed · Works instantly in sample mode
            </p>
          </div>

          <Reveal className="flex justify-center md:justify-end">
            <HeroDemo />
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container-px py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything you need to ship a prompt product
            </h2>
            <p className="mt-3 text-muted">
              Not just a generator — a full, monetization-ready system.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="card h-full p-6 transition hover:border-brand/40">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand-soft">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-50">{f.title}</h3>
                <p className="mt-2 text-sm text-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border/60 bg-surface/40 py-20">
        <div className="container-px">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
              <p className="mt-3 text-muted">From idea to monetizable prompt in three steps.</p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="card h-full p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-fg font-bold">
                      {i + 1}
                    </span>
                    <s.icon className="h-5 w-5 text-brand-soft" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-50">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container-px py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Simple, scalable pricing</h2>
            <p className="mt-3 text-muted">
              Start free. Upgrade when you're ready to go pro or sell at scale.
            </p>
          </div>
        </Reveal>
        <div className="mt-12">
          <PricingCards />
        </div>
      </section>

      {/* CTA */}
      <section className="container-px pb-24">
        <div className="card glow relative overflow-hidden p-10 text-center">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
          <div className="relative">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Build your prompt business today
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Generate, save, bundle, and price prompts in minutes — on web and mobile.
            </p>
            <Link href="/dashboard" className="mt-7 inline-block">
              <Button size="lg">
                Open the dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
