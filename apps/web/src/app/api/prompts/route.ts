import type { NextRequest } from "next/server";
import type { GeneratedPrompt } from "@promptgenius/core";
import { getCurrentUser } from "@/lib/user";
import { listSavedPrompts, savePrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const favoritesOnly =
    req.nextUrl.searchParams.get("favorites") === "true";
  const prompts = await listSavedPrompts(user.id, { favoritesOnly });
  return Response.json({ prompts });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as GeneratedPrompt | null;
  if (!body || !body.meta || !body.prompt) {
    return Response.json({ error: "invalid prompt payload" }, { status: 400 });
  }
  const user = await getCurrentUser();
  const saved = await savePrompt(user.id, body);
  return Response.json({ prompt: saved }, { status: 201 });
}
