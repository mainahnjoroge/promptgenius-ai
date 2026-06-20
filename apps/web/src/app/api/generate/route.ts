import type { NextRequest } from "next/server";
import { evaluateGeneration } from "@promptgenius/core";
import { getCurrentUser, incrementUsage } from "@/lib/user";
import { streamGenerationMarkdown } from "@/lib/engine.server";
import { parseGenerationInput } from "@/lib/validate";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 20 generation requests per user per minute.
  const rl = checkRateLimit(`gen:${user.id}`, 20, 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const input = parseGenerationInput(await req.json().catch(() => null));
  if (!input) {
    return Response.json(
      { error: "industry and useCase are required." },
      { status: 400 },
    );
  }

  const gate = evaluateGeneration(user.tier, input.outputType, user.usageCount);
  if (!gate.allowed) {
    return Response.json({ error: "upgrade_required", gate }, { status: 402 });
  }

  await incrementUsage(user.id);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamGenerationMarkdown(input)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        console.error("generation error", err);
        controller.enqueue(
          encoder.encode("\n\n> ⚠️ Generation failed. Please try again."),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
    },
  });
}
