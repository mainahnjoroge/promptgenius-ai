import type { NextRequest } from "next/server";
import type { GeneratedPrompt } from "@promptgenius/core";
import { getCurrentUser } from "@/lib/user";
import { listSavedPrompts, savePrompt } from "@/lib/prompts";
import { db } from "@/lib/db";
import { persistenceEnabled } from "@/lib/env.server";
import { demoCountPrompts } from "@/lib/demo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PROMPT_TEXT = 50_000;
const MAX_PROMPTS_PER_USER = 500;

// Valid values mirror the enums in @promptgenius/core.
const VALID_SKILL_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_OUTPUT_TYPES = ["simple", "advanced", "workflow"];
const VALID_PLATFORMS = ["claude", "chatgpt", "gemini", "midjourney", "generic"];

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favoritesOnly = req.nextUrl.searchParams.get("favorites") === "true";
  const prompts = await listSavedPrompts(user.id, { favoritesOnly });
  return Response.json({ prompts });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as GeneratedPrompt | null;

  // Structural check
  if (!body || typeof body.prompt !== "string" || !body.meta) {
    return Response.json({ error: "invalid prompt payload" }, { status: 400 });
  }

  // Field allowlist validation
  if (
    !VALID_SKILL_LEVELS.includes(body.meta.skillLevel) ||
    !VALID_OUTPUT_TYPES.includes(body.meta.outputType) ||
    !VALID_PLATFORMS.includes(body.meta.platform)
  ) {
    return Response.json({ error: "invalid prompt metadata" }, { status: 400 });
  }

  // Size limits
  if (body.prompt.length > MAX_PROMPT_TEXT) {
    return Response.json({ error: "prompt text too large" }, { status: 400 });
  }

  // Per-user count cap to prevent storage abuse
  try {
    const count = persistenceEnabled
      ? await db.savedPrompt.count({ where: { userId: user.id } })
      : demoCountPrompts(user.id);
    if (count >= MAX_PROMPTS_PER_USER) {
      return Response.json(
        { error: "saved prompt limit reached", limit: MAX_PROMPTS_PER_USER },
        { status: 429 },
      );
    }
  } catch {
    // DB unavailable — let savePrompt attempt and fail naturally
  }

  const saved = await savePrompt(user.id, body);
  return Response.json({ prompt: saved }, { status: 201 });
}
