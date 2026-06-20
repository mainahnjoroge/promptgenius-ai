import "server-only";
import type {
  CustomizationVariable,
  GeneratedPrompt,
  OutputType,
  Platform,
  SkillLevel,
  WorkflowStep,
} from "@promptgenius/core";
import { db } from "./db";
import { persistenceEnabled } from "./env.server";
import {
  demoDeletePrompt,
  demoListPrompts,
  demoSavePrompt,
  demoSetFavorite,
} from "./demo-store";
import type { SavedPromptDTO } from "./dto";

export type { SavedPromptDTO } from "./dto";

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

type Row = Awaited<ReturnType<typeof db.savedPrompt.findFirst>>;

export function rowToDTO(row: NonNullable<Row>): SavedPromptDTO {
  return {
    id: row.id,
    title: row.title,
    useCase: row.useCase,
    prompt: row.prompt,
    exampleOutput: row.exampleOutput,
    industry: row.industry,
    skillLevel: row.skillLevel as SkillLevel,
    outputType: row.outputType as OutputType,
    platform: row.platform as Platform,
    framework: row.framework,
    variables: safeParse<CustomizationVariable[]>(row.variables, []),
    optimizationTips: safeParse<string[]>(row.optimizationTips, []),
    workflow: safeParse<WorkflowStep[] | null>(row.workflow, null),
    favorite: row.favorite,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSavedPrompts(
  userId: string,
  opts?: { favoritesOnly?: boolean },
): Promise<SavedPromptDTO[]> {
  if (!persistenceEnabled) return demoListPrompts(userId, opts?.favoritesOnly);
  try {
    const rows = await db.savedPrompt.findMany({
      where: { userId, ...(opts?.favoritesOnly ? { favorite: true } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map(rowToDTO);
  } catch {
    return [];
  }
}

export async function savePrompt(
  userId: string,
  p: GeneratedPrompt,
): Promise<SavedPromptDTO> {
  if (!persistenceEnabled) return demoSavePrompt(userId, p);
  const row = await db.savedPrompt.create({
    data: {
      userId,
      title: p.title || "Untitled prompt",
      useCase: p.useCase || "",
      prompt: p.prompt || "",
      exampleOutput: p.exampleOutput || "",
      industry: p.meta.industry,
      skillLevel: p.meta.skillLevel,
      outputType: p.meta.outputType,
      platform: p.meta.platform,
      framework: p.meta.framework ?? null,
      variables: JSON.stringify(p.variables ?? []),
      optimizationTips: JSON.stringify(p.optimizationTips ?? []),
      workflow: p.workflow ? JSON.stringify(p.workflow) : null,
    },
  });
  return rowToDTO(row);
}

export async function setFavorite(
  userId: string,
  id: string,
  favorite: boolean,
): Promise<boolean> {
  if (!persistenceEnabled) return demoSetFavorite(userId, id, favorite);
  const result = await db.savedPrompt.updateMany({
    where: { id, userId },
    data: { favorite },
  });
  return result.count > 0;
}

export async function deletePrompt(userId: string, id: string): Promise<boolean> {
  if (!persistenceEnabled) return demoDeletePrompt(userId, id);
  const result = await db.savedPrompt.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
