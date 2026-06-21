import { PrismaClient } from "@prisma/client";

// In production, a DATABASE_URL that is set but NOT postgres is a
// misconfiguration (e.g. a leftover SQLite `file:` URL). Surface it loudly
// rather than silently falling into demo mode. An unset DATABASE_URL is allowed
// — that is intentional demo mode. Skipped during `next build` (NEXT_PHASE).
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  process.env.DATABASE_URL &&
  !/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL)
) {
  throw new Error(
    "In production, DATABASE_URL must be a PostgreSQL connection string (or unset to run in demo mode).",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

/**
 * Lazily-constructed Prisma client. The client is only instantiated on first
 * actual property access, so demo mode (no DATABASE_URL configured) never
 * constructs Prisma and never hits a missing-env error on serverless. Code
 * paths that run in demo mode short-circuit before touching `db` (see
 * persistenceEnabled in env.server.ts).
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client as object, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
