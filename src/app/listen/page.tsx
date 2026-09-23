"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const { settings, fetchChapter, lang, t, user } = useStore();

  const [book, setBook] = useState(params.get("book") || "genesis");
  const [chapter, setChapter] = useState(Number(params.get("chapter")) || 1);
  const translation = params.get("translation") || settings.translation;
  const tr = getTranslation(translation);

  const [verses, setVerses] = useState<VerseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(0.95);
  const [supported, setSupported] = useState(true);
  const [audioError, setAudioError] = useState("");
  const [voiceLabel, setVoiceLabel] = useState("");

  const versesRef = useRef<VerseData[]>([]);
  const rateRef = useRef(rate);
  const tokenRef = useRef(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveRef = useRef<number | null>(null);
  const primedRef = useRef(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [supported]);

  useEffect(() => {
    if (primedRef.current) return;
    const qBook = params.get("book");
    const qChapter = params.get("chapter");
    if (qBook) {
      setBook(qBook);
      if (qChapter) setChapter(Number(qChapter) || 1);
      primedRef.current = true;
      return;
    }
    if (user.lastRead) {
      setBook(user.lastRead.book);
      setChapter(user.lastRead.chapter);
      primedRef.current = true;
    }
  }, [params, user.lastRead]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current != null) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const startKeepAlive = useCallback(() => {
    clearKeepAlive();
    keepAliveRef.current = window.setInterval(() => {
      const synth = window.speechSynthesis;
      if (!synth.speaking) return;
      if (synth.paused) {
        synth.resume();
        return;
      }
      // Chrome stops TTS around 15s; pause/resume keeps the audio pipeline alive
      // without the silent "resume-only" state.
      try {
        synth.pause();
        synth.resume();
      } catch {
        /* ignore */
      }
    }, 12000);
  }, [clearKeepAlive]);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    clearKeepAlive();
    utteranceRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setCurrent(-1);
  }, [clearKeepAlive]);

  useEffect(() => {
    let on = true;
    stop();
    setLoading(true);
    setAudioError("");
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
    const local = voices.filter((v) => v.localService);
    const pool = local.length ? local : voices;
    return (
      pool.find((v) => v.lang.toLowerCase() === want) ||
      pool.find((v) => v.lang.toLowerCase().startsWith(base + "-") || v.lang.toLowerCase() === base) ||
      voices.find((v) => v.lang.toLowerCase() === want) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(base)) ||
      pool.find((v) => v.lang.toLowerCase().startsWith("en")) ||
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
      pool[0] ||
      voices[0] ||
      null
    );
  }, [tr.ttsLang]);

  const unlockAudio = useCallback(() => {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
      void ctx.resume();
    } catch {
      /* ignore */
    }
  }, []);

  const speakFrom = useCallback(
    (index: number, token: number) => {
      const list = versesRef.current;
      if (token !== tokenRef.current) return;
      if (index < 0 || index >= list.length) {
        setPlaying(false);
        setCurrent(-1);
        clearKeepAlive();
        return;
      }
      const text = (list[index].text || "").trim();
      if (!text) {
        speakFrom(index + 1, token);
        return;
      }
      const u = new SpeechSynthesisUtterance(text);
      utteranceRef.current = u;
      u.volume = 1;
      u.pitch = 1;
      u.rate = rateRef.current;
      const voice = pickVoice();
      // Matching lang to the actual voice avoids the common "playing but silent"
      // bug when the requested language (Lingala, Tshiluba, Swahili) has no TTS engine.
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
        const requested = tr.ttsLang.split("-")[0].toLowerCase();
        const used = voice.lang.split("-")[0].toLowerCase();
        setVoiceLabel(
          used === requested
            ? voice.name
            : `${voice.name} · this device has no ${tr.language} voice`,
        );
      } else {
        const base = tr.ttsLang.split("-")[0];
        u.lang = base === "fr" ? "fr-FR" : "en-US";
        setVoiceLabel("System voice");
      }
      u.onstart = () => {
        if (token !== tokenRef.current) return;
        setCurrent(index);
        setPlaying(true);
        setAudioError("");
      };
      u.onerror = (e) => {
        if (token !== tokenRef.current) return;
        if (e.error === "interrupted" || e.error === "canceled") return;
        setAudioError("Could not play audio on this device.");
        setPlaying(false);
      };
      u.onend = () => {
        if (token !== tokenRef.current) return;
        speakFrom(index + 1, token);
      };
      try {
        window.speechSynthesis.speak(u);
      } catch {
        setAudioError("Could not play audio on this device.");
        setPlaying(false);
      }
    },
    [clearKeepAlive, pickVoice, tr.language, tr.ttsLang],
  );

  const play = useCallback(
    (from?: number) => {
      if (!supported) {
        setAudioError("Audio playback isn't supported on this device's browser.");
        return;
      }
      if (!versesRef.current.length) return;
      const token = tokenRef.current + 1;
      tokenRef.current = token;
      unlockAudio();
      const start = from ?? (current >= 0 ? current : 0);
      setPlaying(true);
      setAudioError("");
      startKeepAlive();
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      // iOS requires speak() inside the user-gesture turn. Chrome needs a brief
      // gap after cancel() or the next utterance starts silent.
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
      if (isiOS) {
        speakFrom(start, token);
      } else {
        window.setTimeout(() => {
          if (token !== tokenRef.current) return;
          speakFrom(start, token);
        }, 60);
      }
    },
    [supported, speakFrom, current, startKeepAlive, unlockAudio],
  );

  const pause = useCallback(() => {
    if (!supported) return;
    if (playing && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setPlaying(false);
      if (!window.speechSynthesis.paused) {
        // Some browsers ignore pause — keep the current verse ready to replay.
        tokenRef.current += 1;
        window.speechSynthesis.cancel();
      }
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      return;
    }
    play(current >= 0 ? current : 0);
  }, [supported, playing, play, current]);

  const next = useCallback(() => {
    const n = Math.min(Math.max(current, 0) + 1, versesRef.current.length - 1);
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

      <div className="mt-4 flex gap-2">
        <select
          value={book}
          onChange={(e) => {
            setBook(e.target.value);
            setChapter(1);
          }}
          className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-soft outline-none"
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
          className="w-28 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-soft outline-none"
        >
          {Array.from({ length: chapterCount }, (_, i) => i + 1).map((c) => (
            <option key={c} value={c}>
              {t.chapter} {c}
            </option>
          ))}
        </select>
      </div>

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
              {voiceLabel ? ` · ${voiceLabel}` : ""}
            </p>
          </div>
        </div>

        {(!supported || audioError) && (
          <p className="mt-4 rounded-xl bg-surface-2 p-3 text-center text-[13px] text-muted">
            {audioError || "Audio playback isn't supported on this device's browser."}
          </p>
        )}

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
              onClick={() => play(current >= 0 ? current : 0)}
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
              Try English
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
