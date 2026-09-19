import { db } from "@/db";
import { sql } from "drizzle-orm";

export type LiveVerse = {
  id: number;
  reference: string;
  body: string;
  translation: string;
  visible: boolean;
  updated_at: string;
};

const CACHE_KEY = "lumina:live-verse";
const CACHE_TTL = 60 * 60 * 24 * 7;

const empty = (): LiveVerse => ({
  id: 1,
  reference: "",
  body: "",
  translation: "KJV",
  visible: false,
  updated_at: new Date(0).toISOString(),
});

const memory = globalThis as typeof globalThis & { __luminaLiveVerse?: LiveVerse };

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function firstRow(result: unknown): LiveVerse | null {
  if (!result) return null;
  if (Array.isArray(result)) return (result[0] as LiveVerse | undefined) ?? null;
  const rows = (result as { rows?: LiveVerse[] }).rows;
  if (Array.isArray(rows)) return rows[0] ?? null;
  return null;
}

function normalize(row: Partial<LiveVerse> | null | undefined): LiveVerse {
  const base = empty();
  if (!row) return base;
  return {
    id: 1,
    reference: String(row.reference ?? ""),
    body: String(row.body ?? ""),
    translation: String(row.translation ?? "KJV"),
    visible: Boolean(row.visible),
    updated_at:
      typeof row.updated_at === "string"
        ? row.updated_at
        : row.updated_at
          ? new Date(row.updated_at as unknown as string).toISOString()
          : base.updated_at,
  };
}

async function runtimeCache() {
  try {
    const mod = await import("@vercel/functions");
    return mod.getCache({ namespace: "lumina-bible" });
  } catch {
    return null;
  }
}

async function ensureTable() {
  await db.execute(sql`
    create table if not exists live_verse (
      id integer primary key default 1,
      reference text not null default '',
      body text not null default '',
      translation text not null default 'KJV',
      visible boolean not null default false,
      updated_at timestamptz not null default now(),
      constraint live_verse_single_row check (id = 1)
    )
  `);
  await db.execute(sql`
    insert into live_verse (id) values (1) on conflict (id) do nothing
  `);
}

async function fromDatabase(): Promise<LiveVerse | null> {
  if (!hasDatabase()) return null;
  try {
    await ensureTable();
    const result = await db.execute(sql`select * from live_verse where id = 1`);
    return normalize(firstRow(result));
  } catch {
    return null;
  }
}

async function toDatabase(row: LiveVerse): Promise<boolean> {
  if (!hasDatabase()) return false;
  try {
    await ensureTable();
    await db.execute(sql`
      update live_verse
      set reference = ${row.reference},
          body = ${row.body},
          translation = ${row.translation},
          visible = ${row.visible},
          updated_at = now()
      where id = 1
    `);
    return true;
  } catch {
    return false;
  }
}

export async function getLiveVerse(): Promise<LiveVerse> {
  const cached = await runtimeCache();
  if (cached) {
    const hit = normalize((await cached.get(CACHE_KEY)) as Partial<LiveVerse> | null);
    if (hit.updated_at !== new Date(0).toISOString()) return hit;
  }

  const fromDb = await fromDatabase();
  if (fromDb) {
    if (cached) {
      await cached.set(CACHE_KEY, fromDb, { ttl: CACHE_TTL, name: "live-verse" });
    }
    memory.__luminaLiveVerse = fromDb;
    return fromDb;
  }

  return normalize(memory.__luminaLiveVerse);
}

export async function setLiveVerse(input: {
  reference: string;
  body: string;
  translation: string;
  visible: boolean;
}): Promise<LiveVerse> {
  const row: LiveVerse = {
    id: 1,
    reference: input.reference,
    body: input.body,
    translation: input.translation,
    visible: input.visible,
    updated_at: new Date().toISOString(),
  };

  memory.__luminaLiveVerse = row;

  const cached = await runtimeCache();
  if (cached) {
    await cached.set(CACHE_KEY, row, { ttl: CACHE_TTL, name: "live-verse" });
  }

  await toDatabase(row);
  return row;
}
