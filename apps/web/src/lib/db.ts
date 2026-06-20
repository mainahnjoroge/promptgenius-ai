import { PrismaClient } from "@prisma/client";

// Guard against accidentally deploying with SQLite on serverless (read-only FS).
if (
  process.env.NODE_ENV === "production" &&
  process.env.DATABASE_URL?.startsWith("file:")
) {
  throw new Error(
    "SQLite cannot be used in production. Set DATABASE_URL to a PostgreSQL connection string.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
