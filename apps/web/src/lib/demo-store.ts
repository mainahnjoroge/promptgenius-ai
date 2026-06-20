import "server-only";
import type { GeneratedPrompt, TierId } from "@promptgenius/core";
import type { SavedPromptDTO } from "./dto";

/**
 * In-memory fallback used ONLY in production demo mode (no real database).
 * State lives for the lifetime of a warm serverless instance — it is not
 * durable across cold starts or instances. This exists so the full product UX
 * (dashboard, generation, save/favorite/delete) works end-to-end with zero
 * external accounts, exactly as the mock-first design promises.
 */

export type DemoUser = {
  id: string;
  email: string | null;
  tier: TierId;
  billingInterval: "monthly" | "annual";
  usageCount: number;
  usagePeriodStart: Date;
  stripeCustomerId: string | null;
};

const users = new Map<string, DemoUser>();
const prompts = new Map<string, { userId: string; seq: number; dto: SavedPromptDTO }>();
let seq = 0;

export function demoGetUser(id: string, email: string | null): DemoUser {
  let u = users.get(id);
  if (!u) {
    u = {
      id,
      email,
      tier: "starter",
      billingInterval: "monthly",
      usageCount: 0,
      usagePeriodStart: new Date(),
      stripeCustomerId: null,
    };
    users.set(id, u);
  }
  return u;
}

export function demoIncrementUsage(id: string): void {
  const u = users.get(id);
  if (u) u.usageCount += 1;
}

export function demoSetTier(
  id: string,
  tier: TierId,
  billingInterval: "monthly" | "annual",
): void {
  const u = users.get(id) ?? demoGetUser(id, null);
  u.tier = tier;
  u.billingInterval = billingInterval;
}

export function demoListPrompts(
  userId: string,
  favoritesOnly?: boolean,
): SavedPromptDTO[] {
  return [...prompts.values()]
    .filter((e) => e.userId === userId && (!favoritesOnly || e.dto.favorite))
    .sort((a, b) => b.seq - a.seq)
    .map((e) => e.dto);
}

export function demoSavePrompt(userId: string, p: GeneratedPrompt): SavedPromptDTO {
  const id = `demo-${++seq}`;
  const dto: SavedPromptDTO = {
    id,
    title: p.title || "Untitled prompt",
    useCase: p.useCase || "",
    prompt: p.prompt || "",
    exampleOutput: p.exampleOutput || "",
    industry: p.meta.industry,
    skillLevel: p.meta.skillLevel,
    outputType: p.meta.outputType,
    platform: p.meta.platform,
    framework: p.meta.framework ?? null,
    variables: p.variables ?? [],
    optimizationTips: p.optimizationTips ?? [],
    workflow: p.workflow ?? null,
    favorite: false,
    createdAt: new Date().toISOString(),
  };
  prompts.set(id, { userId, seq, dto });
  return dto;
}

export function demoSetFavorite(
  userId: string,
  id: string,
  favorite: boolean,
): boolean {
  const e = prompts.get(id);
  if (!e || e.userId !== userId) return false;
  e.dto.favorite = favorite;
  return true;
}

export function demoDeletePrompt(userId: string, id: string): boolean {
  const e = prompts.get(id);
  if (!e || e.userId !== userId) return false;
  return prompts.delete(id);
}

export function demoCountPrompts(userId: string): number {
  let n = 0;
  for (const e of prompts.values()) if (e.userId === userId) n++;
  return n;
}
