"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { BOOKS, BOOKS_BY_SLUG, bookName, type Testament } from "@/lib/bible/books";
import { ReadLink } from "@/components/ReadLink";
import { Segmented } from "@/components/ui";

type Step = "book" | "chapter" | "verse";

/**
 * Book → Chapter → Verse picker. Choosing a verse opens the reader scrolled
 * to that verse; "Open chapter" skips the verse step.
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
  const [step, setStep] = useState<Step>(initialStep);
  const [book, setBook] = useState(initialBook);
  const [chapter, setChapter] = useState<number | null>(initialChapter ?? null);
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
    "grid h-11 place-items-center rounded-xl text-sm font-medium transition-colors";

  return (
    <div>
      <p className="mb-3 text-center text-lg font-semibold text-ink">
        {bookName(book, lang)}
        {chapter !== null && step !== "book" && <span className="text-accent"> {chapter}</span>}
      </p>

      <div className="mb-4 flex">
        {tab("book", "Book", true)}
        {tab("chapter", t.chapter, true)}
        {tab("verse", "Verse", chapter !== null)}
      </div>

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
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {BOOKS.filter((b) => b.testament === testament).map((b) => (
              <li key={b.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setBook(b.slug);
                    setChapter(null);
                    setVerseCount(null);
                    setStep("chapter");
                  }}
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
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: meta.chapters }, (_, i) => i + 1).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                if (c !== chapter) setVerseCount(null);
                setChapter(c);
                setStep("verse");
              }}
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
          <ReadLink
            translation={translation}
            book={book}
            chapter={chapter}
            onClick={onDone}
            className="mb-3 block w-full rounded-xl bg-navy py-2.5 text-center text-sm font-semibold text-white"
          >
            Open {bookName(book, lang)} {chapter}
          </ReadLink>
          {verseCount === null ? (
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : verseCount === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Verses aren&rsquo;t available offline for this chapter yet.
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-2">
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
  );
}
