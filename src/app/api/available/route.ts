import { db } from "@/db";
import { verses } from "@/db/schema";
import { getPackAvailability } from "@/lib/bible/packs.server";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Database — everything actually seeded.
  try {
    const rows = await db
      .select({
        translation: verses.translation,
        book: verses.bookSlug,
        chapter: verses.chapter,
      })
      .from(verses)
      .groupBy(verses.translation, verses.bookSlug, verses.chapter)
      .orderBy(verses.translation, verses.bookSlug, verses.chapter);

    // Shape: { [translation]: { [book]: [chapters...] } }
    const map: Record<string, Record<string, number[]>> = {};
    for (const r of rows) {
      map[r.translation] ??= {};
      map[r.translation][r.book] ??= [];
      map[r.translation][r.book].push(r.chapter);
    }

    return Response.json({ available: map });
  } catch {
    // database unavailable — fall through to the bundled packs
  }

  // 2. Bundled offline packs.
  return Response.json({ available: getPackAvailability() });
}
