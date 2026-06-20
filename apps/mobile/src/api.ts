import {
  mockBundleSet,
  mockGeneratedPrompt,
  parseGeneratedMarkdown,
  type BundleSet,
  type GateResult,
  type GeneratedPrompt,
  type GenerationInput,
  type QuotaStatus,
  type TierId,
} from "@promptgenius/core";

/**
 * Thin client over the web app's API. Falls back to the local @promptgenius/core
 * engine (mock) whenever the backend is unreachable, so the app always works.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export interface MeResponse {
  user: { id: string; email: string | null; tier: TierId; billingInterval: string };
  quota: QuotaStatus;
  tier: { name: string; allowedOutputTypes: string[] };
  flags: { ai: boolean; auth: boolean; billing: boolean };
}

async function jsonOrNull<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getMe(): Promise<MeResponse | null> {
  return jsonOrNull<MeResponse>("/api/me");
}

export interface GenerateResult {
  prompt: GeneratedPrompt;
  source: "live" | "mock";
  gate?: GateResult;
}

export async function generate(input: GenerationInput): Promise<GenerateResult> {
  try {
    const res = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 402) {
      const data = (await res.json()) as { gate: GateResult };
      // Surface the gate, but still give the user a local sample to look at.
      return { prompt: mockGeneratedPrompt(input), source: "mock", gate: data.gate };
    }
    if (res.ok) {
      const text = await res.text();
      const live = res.headers.get("X-Mock-Mode") !== "true";
      return {
        prompt: parseGeneratedMarkdown(text, input, live ? "claude-opus-4-8" : "mock"),
        source: live ? "live" : "mock",
      };
    }
  } catch {
    /* fall through to local mock */
  }
  return { prompt: mockGeneratedPrompt(input), source: "mock" };
}

export async function generateBundles(input: GenerationInput): Promise<BundleSet> {
  const remote = await (async () => {
    try {
      const res = await fetch(`${API_URL}/api/bundles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) return (await res.json()) as BundleSet;
    } catch {
      /* ignore */
    }
    return null;
  })();
  return remote ?? mockBundleSet(input);
}

export interface SavedPromptDTO {
  id: string;
  title: string;
  useCase: string;
  prompt: string;
  industry: string;
  outputType: string;
  favorite: boolean;
  createdAt: string;
}

export async function listPrompts(): Promise<SavedPromptDTO[]> {
  const data = await jsonOrNull<{ prompts: SavedPromptDTO[] }>("/api/prompts");
  return data?.prompts ?? [];
}

export async function savePrompt(prompt: GeneratedPrompt): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/prompts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prompt),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkout(
  tier: TierId,
  interval: "monthly" | "annual",
): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, interval }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
