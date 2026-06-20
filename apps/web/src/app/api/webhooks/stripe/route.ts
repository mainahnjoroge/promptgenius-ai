import type { NextRequest } from "next/server";
import type { BillingInterval, TierId } from "@promptgenius/core";
import { setUserTier } from "@/lib/user";
import { billingEnabledServer, serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!billingEnabledServer || !serverEnv.stripeWebhookSecret) {
    return Response.json({ error: "billing not configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  const payload = await req.text();

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(serverEnv.stripeSecret!);
    const event = stripe.webhooks.constructEvent(
      payload,
      sig ?? "",
      serverEnv.stripeWebhookSecret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: { userId?: string; tier?: TierId; interval?: BillingInterval };
      };
      const { userId, tier, interval } = session.metadata ?? {};
      if (userId && tier) {
        await setUserTier(userId, tier, interval === "annual" ? "annual" : "monthly");
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("stripe webhook error", err);
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }
}
