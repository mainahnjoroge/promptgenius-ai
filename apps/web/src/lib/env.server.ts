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
 * True only when a real PostgreSQL database is configured (Neon in production,
 * a Neon dev branch or local Postgres in development). When it is NOT — i.e. no
 * DATABASE_URL, or a non-postgres URL — the app runs in the in-memory demo mode
 * (zero external accounts) instead of touching Prisma. This keeps local dev and
 * the public demo working with no setup, gives dev/prod parity (Postgres only,
 * no SQLite), and means a misconfigured URL degrades to a visible demo rather
 * than crashing. When a real DB IS configured but a query fails, getCurrentUser
 * still fails closed (see user.ts) rather than silently degrading.
 */
const dbUrl = process.env.DATABASE_URL;
export const persistenceEnabled = !!dbUrl && /^postgres(ql)?:\/\//i.test(dbUrl);
