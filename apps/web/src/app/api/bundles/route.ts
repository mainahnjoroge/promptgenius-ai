import type { NextRequest } from "next/server";
import { canUseBundleGenerator } from "@promptgenius/core";
import { getCurrentUser } from "@/lib/user";
import { generateBundles } from "@/lib/engine.server";
import { parseGenerationInput } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = parseGenerationInput(await req.json().catch(() => null));
  if (!input) {
    return Response.json(
      { error: "industry and useCase are required." },
      { status: 400 },
    );
  }

  if (!canUseBundleGenerator(user.tier)) {
    return Response.json(
      {
        error: "upgrade_required",
        gate: {
          allowed: false,
          reason: "bundles",
          upgradeTo: "professional",
          message:
            "The bundle & pricing generator is a Professional feature. Upgrade to package your prompts for sale.",
        },
      },
      { status: 402 },
    );
  }

  const bundles = await generateBundles(input);
  return Response.json(bundles);
}
