import type { NextRequest } from "next/server";
import type { BillingInterval, TierId } from "@promptgenius/core";
import { setUserTier } from "@/lib/user";
import { billingEnabledServer, serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TIERS: TierId[] = ["professional", "enterprise"];

export async function POST(req: NextRequest) {
  if (!billingEnabledServer || !serverEnv.stripeWebhookSecret || !serverEnv.stripeSecret) {
    return Response.json({ error: "billing not configured" }, { status: 400 });
  }

  const sig = req.headers.get("stripe-signature");
  const payload = await req.text();

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(serverEnv.stripeSecret);
    const event = stripe.webhooks.constructEvent(
      payload,
      sig ?? "",
      serverEnv.stripeWebhookSecret,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: { userId?: string; tier?: string; interval?: string };
      };
      const { userId, tier, interval } = session.metadata ?? {};

      // Validate tier against known values before writing to DB.
      if (userId && tier && VALID_TIERS.includes(tier as TierId)) {
        const billingInterval: BillingInterval =
          interval === "annual" ? "annual" : "monthly";
        await setUserTier(userId, tier as TierId, billingInterval);
      } else if (userId && tier) {
        console.error("Webhook received unrecognised tier", { userId, tier });
      }
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error("stripe webhook error", err);
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }
}
