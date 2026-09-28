"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { BOOKS, BOOKS_BY_SLUG, bookName, type Testament } from "@/lib/bible/books";
import { ReadLink } from "@/components/ReadLink";
import { Segmented } from "@/components/ui";

type Step = "book" | "chapter" | "verse";

/**
 * Book → Chapter → Verse picker. Choosing a verse opens the reader at that
 * verse, underlined in red.
 */
export function PassagePicker({
  translation,
  initialBook,
  initialChapter,
  initialStep = "chapter",
  onDone,
}: {
  translation: string;
  initialBook: string;
  initialChapter?: number;
  initialStep?: Step;
  onDone?: () => void;
}) {
  const { lang, t, fetchChapter } = useStore();
  // One-chapter books (Obadiah, Jude, …) skip straight to verses.
  const singleChapter = BOOKS_BY_SLUG[initialBook]?.chapters === 1;
  const [step, setStep] = useState<Step>(
    initialStep === "chapter" && singleChapter ? "verse" : initialStep,
  );
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState<number | null>(
    initialChapter ?? (singleChapter ? 1 : null),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const [testament, setTestament] = useState<Testament>(
    BOOKS_BY_SLUG[initialBook]?.testament ?? "OT",
  );
  const [verseCount, setVerseCount] = useState<number | null>(null);

  const meta = BOOKS_BY_SLUG[book];

  useEffect(() => {
    if (step !== "verse" || chapter === null) return;
    let active = true;
    fetchChapter(translation, book, chapter).then((d) => {
      if (!active) return;
      const last = d.verses.reduce((m, v) => Math.max(m, v.verse), 0);
      setVerseCount(last);
    });
    return () => {
      active = false;
    };
  }, [step, translation, book, chapter, fetchChapter]);

  // Each step starts at the top of the (scrollable) sheet.
  useEffect(() => {
    rootRef.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0 });
  }, [step, book]);

  const chooseBook = (slug: string) => {
    const one = BOOKS_BY_SLUG[slug]?.chapters === 1;
    setBook(slug);
    setVerseCount(null);
    setChapter(one ? 1 : null);
    setStep(one ? "verse" : "chapter");
  };

  const chooseChapter = (c: number) => {
    if (c !== chapter) setVerseCount(null);
    setChapter(c);
    setStep("verse");
  };

  const tab = (s: Step, label: string, enabled: boolean) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => setStep(s)}
      className={
        "flex-1 border-b-2 pb-2 text-[13px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 " +
        (step === s ? "border-accent text-accent" : "border-transparent text-muted")
      }
    >
      {label}
    </button>
  );

  const cell =
    "grid h-11 place-items-center rounded-xl text-[15px] font-semibold tabular-nums transition-colors md:h-12";

  return (
    <div ref={rootRef}>
      <p className="mb-3 text-center text-lg font-semibold text-ink">
        {bookName(book, lang)}
        {chapter !== null && step !== "book" && <span className="text-accent"> {chapter}</span>}
      </p>

      <div className="mb-4 flex">
        {tab("book", "Book", true)}
        {tab("chapter", t.chapter, true)}
        {tab("verse", "Verse", chapter !== null)}
      </div>

      <div key={`${step}-${book}-${chapter}`} className="animate-step">
      {step === "book" && (
        <>
          <Segmented
            value={testament}
            onChange={setTestament}
            options={[
              { value: "OT", label: t.oldTestament },
              { value: "NT", label: t.newTestament },
            ]}
          />
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {BOOKS.filter((b) => b.testament === testament).map((b) => (
              <li key={b.slug}>
                <button
                  type="button"
                  onClick={() => chooseBook(b.slug)}
                  className={
                    "w-full truncate rounded-xl px-3 py-2.5 text-left text-sm font-medium " +
                    (b.slug === book ? "bg-accent text-white" : "bg-surface-2 text-ink hover:bg-line")
                  }
                >
                  {bookName(b.slug, lang)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {step === "chapter" && meta && (
        <div className="grid grid-cols-5 gap-2 min-[400px]:grid-cols-6 sm:grid-cols-8 md:grid-cols-10">
          {Array.from({ length: meta.chapters }, (_, i) => i + 1).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => chooseChapter(c)}
              className={
                cell + " " + (c === chapter ? "bg-accent text-white" : "bg-surface-2 text-ink hover:bg-line")
              }
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {step === "verse" && chapter !== null && (
        <>
          <p className="mb-3 text-center text-[13px] text-muted">
            Tap a verse to open it
          </p>
          {verseCount === null ? (
            <div className="grid grid-cols-5 gap-2 min-[400px]:grid-cols-6 sm:grid-cols-8 md:grid-cols-10">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : verseCount === 0 ? (
            <div className="py-6 text-center text-sm text-muted">
              <p>Verses aren&rsquo;t available offline for this chapter yet.</p>
              <ReadLink
                translation={translation}
                book={book}
                chapter={chapter}
                onClick={onDone}
                className="mt-2 inline-block font-semibold text-accent"
              >
                {bookName(book, lang)} {chapter} →
              </ReadLink>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 min-[400px]:grid-cols-6 sm:grid-cols-8 md:grid-cols-10">
              {Array.from({ length: verseCount }, (_, i) => i + 1).map((v) => (
                <ReadLink
                  key={v}
                  translation={translation}
                  book={book}
                  chapter={chapter}
                  verse={v}
                  onClick={onDone}
                  className={cell + " bg-surface-2 text-ink hover:bg-accent hover:text-white"}
                >
                  {v}
                </ReadLink>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
