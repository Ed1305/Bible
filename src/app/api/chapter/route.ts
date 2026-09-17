import { db } from "@/db";
import { verses } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { fetchRemoteChapter } from "@/lib/bible/remote";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const translation = searchParams.get("translation") ?? "ESV";
  const book = searchParams.get("book") ?? "";
  const chapter = Number(searchParams.get("chapter") ?? "1");

  if (!book || Number.isNaN(chapter)) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    // 1. Look in database first
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
      return Response.json(
        {
          translation,
          book,
          chapter,
          verses: rows.map((r) => ({
            verse: r.verse,
            heading: r.heading,
            text: r.text,
          })),
        },
        {
          headers: {
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        },
      );
    }

    // 2. Fall back to on-demand remote fetch & cache to database
    const remote = await fetchRemoteChapter(translation, book, chapter);

    if (remote.length > 0) {
      // Async insert so subsequent reads are instant and offline-ready
      try {
        for (const v of remote) {
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
        // non-blocking
      }

      return Response.json(
        {
          translation,
          book,
          chapter,
          verses: remote,
        },
        {
          headers: {
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        },
      );
    }

    // 3. Fall back to ESV if different translation is not available
    if (translation !== "ESV") {
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
        return Response.json({
          translation: "ESV",
          requestedTranslation: translation,
          book,
          chapter,
          fallback: true,
          verses: fallbackRows.map((r) => ({
            verse: r.verse,
            heading: r.heading,
            text: r.text,
          })),
        });
      }

      const remoteEsv = await fetchRemoteChapter("ESV", book, chapter);
      if (remoteEsv.length > 0) {
        try {
          for (const v of remoteEsv) {
            await db
              .insert(verses)
              .values({
                translation: "ESV",
                bookSlug: book,
                chapter,
                verse: v.verse,
                heading: v.heading,
                text: v.text,
              })
              .onConflictDoNothing();
          }
        } catch {
          // non-blocking
        }

        return Response.json({
          translation: "ESV",
          requestedTranslation: translation,
          book,
          chapter,
          fallback: true,
          verses: remoteEsv,
        });
      }
    }

    return Response.json({
      translation,
      book,
      chapter,
      verses: [],
    });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
