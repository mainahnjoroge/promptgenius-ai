import type { NextRequest } from "next/server";
import type { BillingInterval, TierId } from "@promptgenius/core";
import { getCurrentUser, setUserTier } from "@/lib/user";
import { billingEnabledServer, serverEnv } from "@/lib/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_TIERS: TierId[] = ["professional", "enterprise"];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    tier?: TierId;
    interval?: BillingInterval;
  };
  const tier = body.tier;
  const interval: BillingInterval = body.interval === "annual" ? "annual" : "monthly";

  if (!tier || !PAID_TIERS.includes(tier)) {
    return Response.json({ error: "valid paid tier required" }, { status: 400 });
  }

  const user = await getCurrentUser();

  // --- Mock billing: no Stripe key → flip the tier immediately. ---
  if (!billingEnabledServer) {
    await setUserTier(user.id, tier, interval);
    return Response.json({
      mock: true,
      url: `/dashboard?upgraded=${tier}`,
    });
  }

  // --- Real Stripe Checkout ---
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(serverEnv.stripeSecret!);
    const price =
      tier === "professional"
        ? serverEnv.stripePrices.professional[interval]
        : serverEnv.stripePrices.enterprise[interval];

    if (!price) {
      return Response.json(
        { error: `Missing Stripe price id for ${tier}/${interval}.` },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: user.email ?? undefined,
      success_url: `${serverEnv.appUrl}/dashboard?upgraded=${tier}`,
      cancel_url: `${serverEnv.appUrl}/pricing`,
      metadata: { userId: user.id, tier, interval },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("stripe checkout error", err);
    return Response.json({ error: "checkout failed" }, { status: 500 });
  }
}
