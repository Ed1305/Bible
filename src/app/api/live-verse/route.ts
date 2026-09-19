import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Live-verse endpoint for the OBS scripture overlay.
 *
 * Built on the app's existing Postgres connection (DATABASE_URL) instead of
 * a separate service — no new env vars, no new account. The table is
 * created on first request, so there's nothing to migrate by hand either.
 *
 * /control polls GET every 2s and POSTs on Show/Clear.
 * /display polls GET every 1s and renders whatever is visible.
 */

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    await ensureTable();
    const result = await db.execute(sql`select * from live_verse where id = 1`);
    return Response.json(result.rows[0] ?? null);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body = await req.json();
    const reference = String(body.reference ?? "").trim();
    const text = String(body.body ?? "").trim();
    const translation = String(body.translation ?? "KJV").trim();
    const visible = Boolean(body.visible);

    await db.execute(sql`
      update live_verse
      set reference = ${reference},
          body = ${text},
          translation = ${translation},
          visible = ${visible},
          updated_at = now()
      where id = 1
    `);

    const result = await db.execute(sql`select * from live_verse where id = 1`);
    return Response.json(result.rows[0] ?? null);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
