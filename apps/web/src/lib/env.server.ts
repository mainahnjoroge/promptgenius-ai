import "server-only";

/** Server-only environment access (secrets). Never import from client code. */
export const serverEnv = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.PROMPTGENIUS_MODEL || "claude-opus-4-8",
  effort: process.env.PROMPTGENIUS_EFFORT || "high",

  clerkSecret: process.env.CLERK_SECRET_KEY,
  clerkPublishable: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,

  stripeSecret: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePrices: {
    professional: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
    },
    enterprise: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
      annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
    },
  },

  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export const aiEnabled = !!serverEnv.anthropicApiKey;
export const authEnabledServer = !!(serverEnv.clerkSecret && serverEnv.clerkPublishable);
export const billingEnabledServer = !!serverEnv.stripeSecret;

/**
 * True when a real, writable database is configured. In dev we always persist
 * (local SQLite is fine). In production a SQLite (`file:`) URL or no URL means
 * the serverless filesystem is read-only — so we fall back to an in-memory demo
 * store instead of crashing. When a real DB IS configured but a query fails, we
 * still fail closed (see user.ts) rather than silently degrading.
 */
const dbUrl = process.env.DATABASE_URL;
export const persistenceEnabled =
  process.env.NODE_ENV !== "production" ||
  (!!dbUrl && !dbUrl.startsWith("file:"));
