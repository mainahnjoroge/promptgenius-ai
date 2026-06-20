import type { NextRequest } from "next/server";
import { evaluateGeneration } from "@promptgenius/core";
import { getCurrentUser, incrementUsage } from "@/lib/user";
import { aiEnabled, streamGenerationMarkdown } from "@/lib/engine.server";
import { parseGenerationInput } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const input = parseGenerationInput(await req.json().catch(() => null));
  if (!input) {
    return Response.json(
      { error: "industry and useCase are required." },
      { status: 400 },
    );
  }

  const user = await getCurrentUser();
  const gate = evaluateGeneration(user.tier, input.outputType, user.usageCount);
  if (!gate.allowed) {
    return Response.json({ error: "upgrade_required", gate }, { status: 402 });
  }

  // Count the generation against the user's quota up front.
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
      "X-Mock-Mode": String(!aiEnabled),
    },
  });
}
