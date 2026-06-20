import "server-only";

type Entry = { count: number; reset: number };
const store = new Map<string, Entry>();

/**
 * Simple in-memory rate limiter. Works within a single serverless instance.
 * For multi-instance production use, swap store for an Upstash Redis client.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.reset - now) / 1000) };
  }
  entry.count++;
  return { ok: true };
}
