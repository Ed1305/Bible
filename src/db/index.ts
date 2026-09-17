import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

/**
 * The database is OPTIONAL: when `DATABASE_URL` is unset (or unreachable) the
 * app transparently falls back to the bundled offline packs in `public/bible`.
 * A lazy proxy lets modules import `db` without crashing at build/startup when
 * no database is configured.
 */
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: Database;
};

function createDb(): Database {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured — falling back to bundled offline data.",
    );
  }

  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  return drizzle(pool, { schema });
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const real = globalForDb.__arenaNextJsPostgresqlDb ?? createDb();
    if (!globalForDb.__arenaNextJsPostgresqlDb) {
      globalForDb.__arenaNextJsPostgresqlDb = real;
    }
    const value = (real as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
});

export { schema };
