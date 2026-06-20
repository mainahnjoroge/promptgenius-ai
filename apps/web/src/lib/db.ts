import { PrismaClient } from "@prisma/client";

// Guard against accidentally deploying with SQLite on serverless (read-only FS).
// Only enforced at runtime — skipped during `next build` (NEXT_PHASE) so the
// build can run locally with a SQLite .env without tripping the guard.
if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  process.env.DATABASE_URL?.startsWith("file:")
) {
  throw new Error(
    "SQLite cannot be used in production. Set DATABASE_URL to a PostgreSQL connection string.",
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
