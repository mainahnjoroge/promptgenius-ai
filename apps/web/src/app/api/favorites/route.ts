import { getCurrentUser } from "@/lib/user";
import { listSavedPrompts } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const prompts = await listSavedPrompts(user.id, { favoritesOnly: true });
  return Response.json({ prompts });
}
