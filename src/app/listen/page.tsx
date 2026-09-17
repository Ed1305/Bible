"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useStore, type VerseData } from "@/lib/store";
import { BOOKS, BOOKS_BY_SLUG, bookName } from "@/lib/bible/books";
import { getTranslation } from "@/lib/bible/translations";
import {
  HeadphonesIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  NextIcon,
  PrevIcon,
  BookIcon,
} from "@/components/icons";

function ListenInner() {
  const params = useSearchParams();
  const { settings, fetchChapter, lang, t } = useStore();

  const [book, setBook] = useState(params.get("book") || "psalms");
  const [chapter, setChapter] = useState(Number(params.get("chapter")) || 23);
  const translation = params.get("translation") || settings.translation;
  const tr = getTranslation(translation);

  const [verses, setVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [supported, setSupported] = useState(true);
  const versesRef = useRef<VerseData[]>([]);
  const rateRef = useRef(rate);
  const activeRef = useRef(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setCurrent(-1);
  }, []);

  // load chapter
  useEffect(() => {
    let on = true;
    stop();
    setLoading(true);
    fetchChapter(translation, book, chapter).then((d) => {
      if (!on) return;
      setVerses(d.verses);
      versesRef.current = d.verses;
      setLoading(false);
    });
    return () => {
      on = false;
    };
  }, [translation, book, chapter, fetchChapter, stop]);

  useEffect(() => () => stop(), [stop]);

  const pickVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    const want = tr.ttsLang.toLowerCase();
    const base = want.split("-")[0];
    return (
      voices.find((v) => v.lang.toLowerCase() === want) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(base)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
      null
    );
  }, [tr.ttsLang]);

  const speakFrom = useCallback(
    (index: number) => {
      const list = versesRef.current;
      if (index < 0 || index >= list.length) {
        setPlaying(false);
        setCurrent(-1);
        activeRef.current = false;
        return;
      }
      const u = new SpeechSynthesisUtterance(list[index].text);
      u.lang = tr.ttsLang;
      u.rate = rateRef.current;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onstart = () => setCurrent(index);
      u.onend = () => {
        if (!activeRef.current) return;
        speakFrom(index + 1);
      };
      window.speechSynthesis.speak(u);
    },
    [pickVoice, tr.ttsLang],
  );

  const play = useCallback(
    (from?: number) => {
      if (!supported || !versesRef.current.length) return;
      window.speechSynthesis.cancel();
      activeRef.current = true;
      setPlaying(true);
      speakFrom(from ?? (current >= 0 ? current : 0));
    },
    [supported, speakFrom, current],
  );

  const pause = useCallback(() => {
    if (playing) {
      window.speechSynthesis.pause();
      setPlaying(false);
    } else {
      window.speechSynthesis.resume();
      setPlaying(true);
    }
  }, [playing]);

  const next = useCallback(() => {
    const n = Math.min(current + 1, versesRef.current.length - 1);
    play(n);
  }, [current, play]);
  const prev = useCallback(() => {
    const p = Math.max(current - 1, 0);
    play(p);
  }, [current, play]);

  const meta = BOOKS_BY_SLUG[book];
  const chapterCount = meta?.chapters ?? 1;

  return (
    <div className="px-4 pt-2">
      <header className="flex items-center gap-3 pt-1">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
          <HeadphonesIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-semibold leading-none text-ink">
            {t.audioBible}
          </h1>
          <p className="mt-1 text-[13px] text-muted">{t.audioSubtitle}</p>
        </div>
      </header>

      {/* Selectors */}
      <div className="mt-4 flex gap-2">
        <select
          value={book}
          onChange={(e) => {
            setBook(e.target.value);
            setChapter(1);
          }}
          className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium shadow-soft outline-none"
        >
          {BOOKS.map((b) => (
            <option key={b.slug} value={b.slug}>
              {bookName(b.slug, lang)}
            </option>
          ))}
        </select>
        <select
          value={chapter}
          onChange={(e) => setChapter(Number(e.target.value))}
          className="w-28 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium shadow-soft outline-none"
        >
          {Array.from({ length: chapterCount }, (_, i) => i + 1).map((c) => (
            <option key={c} value={c}>
              {t.chapter} {c}
            </option>
          ))}
        </select>
      </div>

      {/* Now playing card */}
      <div className="mt-4 rounded-[22px] border border-line bg-surface p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-accent to-[#41618f] text-white">
            <BookIcon className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {t.nowPlaying}
            </p>
            <p className="truncate font-serif text-xl font-semibold text-ink">
              {bookName(book, lang)} {chapter}
            </p>
            <p className="text-[13px] text-muted">
              {tr.name} · {verses.length} {t.chapter.toLowerCase()}s
            </p>
          </div>
        </div>

        {!supported && (
          <p className="mt-4 rounded-xl bg-surface-2 p-3 text-center text-[13px] text-muted">
            Audio playback isn&apos;t supported on this device&apos;s browser.
          </p>
        )}

        {/* Controls */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={prev}
            disabled={!verses.length}
            className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink disabled:opacity-40"
            aria-label="Previous"
          >
            <PrevIcon className="h-5 w-5" />
          </button>
          {playing ? (
            <button
              onClick={pause}
              className="grid h-16 w-16 place-items-center rounded-full bg-accent text-white shadow-float"
              aria-label={t.pause}
            >
              <PauseIcon className="h-7 w-7" />
            </button>
          ) : (
            <button
              onClick={() => (current >= 0 ? play(current) : play(0))}
              disabled={!verses.length || !supported}
              className="grid h-16 w-16 place-items-center rounded-full bg-accent text-white shadow-float disabled:opacity-40"
              aria-label={t.play}
            >
              <PlayIcon className="h-7 w-7 pl-0.5" />
            </button>
          )}
          <button
            onClick={next}
            disabled={!verses.length}
            className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink disabled:opacity-40"
            aria-label="Next"
          >
            <NextIcon className="h-5 w-5" />
          </button>
          <button
            onClick={stop}
            className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink"
            aria-label={t.stop}
          >
            <StopIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Speed */}
        <div className="mt-5 flex items-center gap-3">
          <span className="text-[12px] font-medium text-muted">Speed</span>
          <input
            type="range"
            min={0.6}
            max={1.4}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="w-10 text-right text-[12px] font-semibold text-muted">
            {rate.toFixed(2)}x
          </span>
        </div>
      </div>

      {/* Verse list, follows along */}
      <div className="mt-4 rounded-[22px] border border-line bg-surface p-5 shadow-soft">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-surface-2" />
            ))}
          </div>
        ) : verses.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            Not available in {tr.abbr}.{" "}
            <Link href={`/listen?translation=ESV&book=${book}&chapter=${chapter}`} className="text-accent">
              Try ESV
            </Link>
          </p>
        ) : (
          <div className="scripture text-[16px]">
            {verses.map((v, i) => (
              <p
                key={v.verse}
                onClick={() => play(i)}
                className={
                  "verse-row cursor-pointer transition-colors " +
                  (i === current ? "is-active" : "")
                }
              >
                <span className="verse-text">{v.text}</span>
                <span className="verse-num">{v.verse}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="h-6" />
    </div>
  );
}

export default function ListenPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-6 text-muted">Loading…</div>}>
      <ListenInner />
    </Suspense>
  );
}
