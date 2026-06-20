/**
 * Client-safe feature flags. Only NEXT_PUBLIC_* vars are referenced here so
 * this module is safe to import from client components (values are inlined at
 * build time). We treat "publishable key present" as the signal that an
 * integration is configured (we set publishable + secret together, or neither).
 */
export const authEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const billingEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const DEMO_USER_ID = "demo-user";
