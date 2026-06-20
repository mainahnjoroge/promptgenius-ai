"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Check,
  Loader2,
  Lock,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import {
  parseGeneratedMarkdown,
  type GateResult,
  type GeneratedPrompt,
  type GenerationInput,
  type OutputType,
  type Platform,
  type QuotaStatus,
  type SkillLevel,
  type TierId,
} from "@promptgenius/core";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { PromptView } from "@/components/prompt-view";
import { dtoToGeneratedPrompt, type SavedPromptDTO } from "@/lib/dto";
import { cn } from "@/lib/utils";
import { LibraryPanel } from "./library-panel";
import { BundlesPanel } from "./bundles-panel";
import { UpgradeDialog } from "./upgrade-dialog";

const INDUSTRIES = [
  "Marketing", "Sales", "Healthcare", "Finance", "Legal", "Education",
  "E-commerce", "Engineering", "Human Resources", "Real Estate", "Design",
  "Consulting", "Hospitality", "Nonprofit",
];

const SKILLS: { id: SkillLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const OUTPUTS: { id: OutputType; label: string }[] = [
  { id: "simple", label: "Simple" },
  { id: "advanced", label: "Advanced" },
  { id: "workflow", label: "Workflow" },
];

const PLATFORMS: Platform[] = ["claude", "chatgpt", "gemini", "midjourney", "generic"];

export function DashboardClient({
  initialPrompts,
  tier,
  tierName,
  allowedOutputTypes,
  quota: initialQuota,
  aiEnabled,
  upgradedTo,
}: {
  initialPrompts: SavedPromptDTO[];
  tier: TierId;
  tierName: string;
  allowedOutputTypes: OutputType[];
  quota: QuotaStatus;
  aiEnabled: boolean;
  upgradedTo?: string | null;
}) {
  const [filters, setFilters] = useState<GenerationInput>({
    industry: "Marketing",
    useCase: "",
    skillLevel: "intermediate",
    outputType: "advanced",
    tone: "",
    platform: "claude",
  });
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<GeneratedPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<SavedPromptDTO[]>(initialPrompts);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [quota, setQuota] = useState<QuotaStatus>(initialQuota);
  const [gate, setGate] = useState<GateResult | null>(null);
  const [tab, setTab] = useState<"generate" | "bundles">("generate");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const update = <K extends keyof GenerationInput>(k: K, v: GenerationInput[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  const refreshQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) setQuota((await res.json()).quota);
    } catch {
      /* ignore */
    }
  }, []);

  async function generate() {
    if (!filters.industry || !filters.useCase.trim()) return;
    setLoading(true);
    setRaw("");
    setParsed(null);
    setActiveId(undefined);
    setSavedId(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      if (res.status === 402) {
        setGate((await res.json()).gate);
        return;
      }
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setRaw(acc);
      }
      setParsed(parseGeneratedMarkdown(acc, filters, aiEnabled ? "claude-opus-4-8" : "mock"));
      void refreshQuota();
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!parsed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        const { prompt } = (await res.json()) as { prompt: SavedPromptDTO };
        setPrompts((p) => [prompt, ...p]);
        setActiveId(prompt.id);
        setSavedId(prompt.id);
        setTimeout(() => setSavedId(null), 1800);
      }
    } finally {
      setSaving(false);
    }
  }

  function selectSaved(dto: SavedPromptDTO) {
    setParsed(dtoToGeneratedPrompt(dto));
    setRaw("");
    setActiveId(dto.id);
    setTab("generate");
  }

  async function toggleFavorite(id: string, favorite: boolean) {
    setPrompts((p) => p.map((x) => (x.id === id ? { ...x, favorite } : x)));
    await fetch(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite }),
    }).catch(() => {});
  }

  async function remove(id: string) {
    setPrompts((p) => p.filter((x) => x.id !== id));
    if (activeId === id) {
      setActiveId(undefined);
      setParsed(null);
    }
    await fetch(`/api/prompts/${id}`, { method: "DELETE" }).catch(() => {});
  }

  function chooseOutput(o: OutputType) {
    if (!allowedOutputTypes.includes(o)) {
      setGate({
        allowed: false,
        reason: "output_type",
        message: `${o === "workflow" ? "Multi-step workflows" : "Advanced structured prompts"} are available on a higher plan. Upgrade to unlock them.`,
      });
      return;
    }
    update("outputType", o);
  }

  const quotaPct =
    quota.limit === "unlimited"
      ? 0
      : Math.min(100, Math.round((quota.used / (quota.limit || 1)) * 100));
  const quotaExceeded = quota.exceeded;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur">
        <div className="container-px flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-brand-soft sm:inline">
              {tierName} plan
            </span>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full",
                    quotaExceeded ? "bg-red-500" : "bg-brand",
                  )}
                  style={{ width: `${quota.limit === "unlimited" ? 12 : quotaPct}%` }}
                />
              </div>
              <span className="text-xs text-muted">
                {quota.limit === "unlimited"
                  ? "Unlimited"
                  : `${quota.used}/${quota.limit}`}
              </span>
            </div>
            <Link href="/pricing">
              <Button variant="secondary" size="sm">
                Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {upgradedTo && (
        <div className="container-px pt-4">
          <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent">
            <Check className="h-4 w-4" /> You're now on the {upgradedTo} plan. Enjoy your new features!
          </div>
        </div>
      )}

      {!aiEnabled && (
        <div className="container-px pt-4">
          <div className="rounded-xl border border-border bg-surface-2/60 px-4 py-2 text-xs text-muted">
            Running in <span className="text-brand-soft">sample mode</span> — set{" "}
            <code>ANTHROPIC_API_KEY</code> to generate with live Claude AI.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="container-px pt-6">
        <div className="inline-flex rounded-xl border border-border bg-surface-2 p-1">
          {(["generate", "bundles"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition",
                tab === t ? "bg-brand text-brand-fg" : "text-muted hover:text-slate-100",
              )}
            >
              {t === "generate" ? <Wand2 className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="container-px py-6">
        {tab === "generate" ? (
          <div className="grid gap-6 lg:grid-cols-[20rem_1fr_18rem]">
            {/* Filters */}
            <section className="card h-fit p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Sparkles className="h-4 w-4 text-brand-soft" /> Generator
              </h2>

              <label className="label">Industry</label>
              <input
                className="input"
                list="industries"
                value={filters.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="e.g. Marketing"
              />
              <datalist id="industries">
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>

              <label className="label mt-4">Use case</label>
              <textarea
                className="input min-h-[72px] resize-y"
                value={filters.useCase}
                onChange={(e) => update("useCase", e.target.value)}
                placeholder="e.g. write a high-converting launch email"
              />

              <label className="label mt-4">Skill level</label>
              <div className="grid grid-cols-3 gap-1.5">
                {SKILLS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => update("skillLevel", s.id)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-xs transition",
                      filters.skillLevel === s.id
                        ? "border-brand/60 bg-brand/15 text-brand-soft"
                        : "border-border text-muted hover:text-slate-100",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <label className="label mt-4">Output complexity</label>
              <div className="grid grid-cols-3 gap-1.5">
                {OUTPUTS.map((o) => {
                  const locked = !allowedOutputTypes.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => chooseOutput(o.id)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs transition",
                        filters.outputType === o.id
                          ? "border-brand/60 bg-brand/15 text-brand-soft"
                          : "border-border text-muted hover:text-slate-100",
                      )}
                    >
                      {locked && <Lock className="h-3 w-3" />}
                      {o.label}
                    </button>
                  );
                })}
              </div>

              <label className="label mt-4">Tone (optional)</label>
              <input
                className="input"
                value={filters.tone}
                onChange={(e) => update("tone", e.target.value)}
                placeholder="e.g. punchy and confident"
              />

              <label className="label mt-4">Platform</label>
              <select
                className="input capitalize"
                value={filters.platform}
                onChange={(e) => update("platform", e.target.value as Platform)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>

              <Button
                className="mt-5 w-full"
                onClick={generate}
                disabled={loading || quotaExceeded || !filters.useCase.trim()}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {loading ? "Generating…" : "Generate prompt"}
              </Button>
              {quotaExceeded && (
                <p className="mt-2 text-center text-xs text-red-400">
                  Monthly limit reached.{" "}
                  <Link href="/pricing" className="underline">
                    Upgrade
                  </Link>
                </p>
              )}
            </section>

            {/* Output */}
            <section className="card min-h-[24rem] p-6">
              {!parsed && !loading && (
                <div className="grid h-full place-items-center text-center text-muted">
                  <div>
                    <Wand2 className="mx-auto mb-3 h-8 w-8 text-brand-soft" />
                    <p className="text-sm">
                      Fill in the filters and generate your first prompt.
                    </p>
                  </div>
                </div>
              )}

              {loading && !parsed && (
                <div>
                  <div className="mb-4 flex items-center gap-2 text-sm text-brand-soft">
                    <Loader2 className="h-4 w-4 animate-spin" /> Streaming…
                  </div>
                  <pre className="scroll-thin max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm text-slate-300">
                    {raw || " "}
                  </pre>
                </div>
              )}

              {parsed && (
                <div>
                  <div className="mb-4 flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={save}
                      disabled={saving || !!savedId}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : savedId ? (
                        <Check className="h-4 w-4 text-accent" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {savedId ? "Saved" : "Save"}
                    </Button>
                  </div>
                  <PromptView prompt={parsed} />
                </div>
              )}
            </section>

            {/* Library */}
            <aside className="lg:h-[calc(100vh-12rem)]">
              <LibraryPanel
                prompts={prompts}
                activeId={activeId}
                onSelect={selectSaved}
                onToggleFavorite={toggleFavorite}
                onDelete={remove}
              />
            </aside>
          </div>
        ) : (
          <BundlesPanel input={filters} tier={tier} onGate={setGate} />
        )}
      </main>

      <UpgradeDialog gate={gate} onClose={() => setGate(null)} />
    </div>
  );
}
