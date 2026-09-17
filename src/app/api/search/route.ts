import { db } from "@/db";
import { verses } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { searchPacks } from "@/lib/bible/packs.server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const translation = searchParams.get("translation") ?? "ESV";

  if (q.length < 2) {
    return Response.json({ results: [], query: q });
  }

  // 1. Database (indexed, fastest when available).
  try {
    const rows = await db
      .select()
      .from(verses)
      .where(
        and(
          eq(verses.translation, translation),
          ilike(verses.text, `%${q}%`),
        ),
      )
      .limit(60);

    return Response.json({
      query: q,
      translation,
      results: rows.map((r) => ({
        book: r.bookSlug,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
      })),
    });
  } catch {
    // database unavailable — fall through to the bundled packs
  }

  // 2. Bundled offline packs (full scan, accent-insensitive).
  const results = searchPacks(translation, q, 60);
  return Response.json({ query: q, translation, results });
}
