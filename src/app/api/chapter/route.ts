import { db } from "@/db";
import { verses } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { fetchRemoteChapter } from "@/lib/bible/remote";
import { getPackChapter } from "@/lib/bible/packs.server";

export const dynamic = "force-dynamic";

const IMMUTABLE = { headers: { "Cache-Control": "public, max-age=31536000, immutable" } };

function chapterResponse(
  translation: string,
  book: string,
  chapter: number,
  verseRows: { verse: number; heading: string | null; text: string }[],
  extra?: Record<string, unknown>,
) {
  return Response.json({ translation, book, chapter, verses: verseRows, ...extra }, IMMUTABLE);
}

async function insertVerses(
  translation: string,
  book: string,
  chapter: number,
  rows: { verse: number; heading: string | null; text: string }[],
) {
  try {
    for (const v of rows) {
      await db
        .insert(verses)
        .values({
          translation,
          bookSlug: book,
          chapter,
          verse: v.verse,
          heading: v.heading,
          text: v.text,
        })
        .onConflictDoNothing();
    }
  } catch {
    // non-blocking — the bundled offline packs still serve the content
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const translation = searchParams.get("translation") ?? "ESV";
  const book = searchParams.get("book") ?? "";
  const chapter = Number(searchParams.get("chapter") ?? "1");

  if (!book || Number.isNaN(chapter)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // 1. Database first (curated/seeded content, then anything cached upstream).
  try {
    const rows = await db
      .select()
      .from(verses)
      .where(
        and(
          eq(verses.translation, translation),
          eq(verses.bookSlug, book),
          eq(verses.chapter, chapter),
        ),
      )
      .orderBy(asc(verses.verse));

    if (rows.length > 0) {
      return chapterResponse(translation, book, chapter, rows);
    }
  } catch {
    // database unavailable — continue to the other sources
  }

  // 2. Bundled offline pack (ships with the repo, needs no network).
  const fromPack = getPackChapter(translation, book, chapter);
  if (fromPack) {
    await insertVerses(translation, book, chapter, fromPack);
    return chapterResponse(translation, book, chapter, fromPack);
  }

  // 3. On-demand fetch from upstream Bible sources, cached to the database.
  const remote = await fetchRemoteChapter(translation, book, chapter);
  if (remote.length > 0) {
    await insertVerses(translation, book, chapter, remote);
    return chapterResponse(translation, book, chapter, remote);
  }

  // 4. Fall back to English if the requested translation is unavailable.
  if (translation !== "ESV") {
    try {
      const fallbackRows = await db
        .select()
        .from(verses)
        .where(
          and(
            eq(verses.translation, "ESV"),
            eq(verses.bookSlug, book),
            eq(verses.chapter, chapter),
          ),
        )
        .orderBy(asc(verses.verse));

      if (fallbackRows.length > 0) {
        return chapterResponse("ESV", book, chapter, fallbackRows, {
          requestedTranslation: translation,
          fallback: true,
        });
      }
    } catch {
      // fall through
    }

    const packEsv = getPackChapter("ESV", book, chapter);
    if (packEsv) {
      await insertVerses("ESV", book, chapter, packEsv);
      return chapterResponse("ESV", book, chapter, packEsv, {
        requestedTranslation: translation,
        fallback: true,
      });
    }

    const remoteEsv = await fetchRemoteChapter("ESV", book, chapter);
    if (remoteEsv.length > 0) {
      await insertVerses("ESV", book, chapter, remoteEsv);
      return chapterResponse("ESV", book, chapter, remoteEsv, {
        requestedTranslation: translation,
        fallback: true,
      });
    }
  }

  return Response.json({ translation, book, chapter, verses: [] });
}
