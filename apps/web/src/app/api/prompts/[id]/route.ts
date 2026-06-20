import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { deletePrompt, setFavorite } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { favorite?: boolean };
  if (typeof body.favorite !== "boolean") {
    return Response.json({ error: "favorite (boolean) required" }, { status: 400 });
  }
  const ok = await setFavorite(user.id, id, body.favorite);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true, favorite: body.favorite });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deletePrompt(user.id, id);
  if (!ok) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ ok: true });
}
