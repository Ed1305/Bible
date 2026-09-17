import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Server-side access to the offline Bible packs that ship inside the repo
 * (`public/bible`). Used as a zero-dependency fallback so every route keeps
 * working even when no PostgreSQL database is configured.
 *
 * All reads are cached in process memory — the packs are immutable.
 */

export interface PackMeta {
  code: string;
  label: string;
  lang: string;
  licence: string;
  books: number;
  chapters: number;
  verses: number;
  bytes: number;
  files: string[];
}

export interface BibleManifest {
  generatedAt: string;
  totalBytes: number;
  packs: PackMeta[];
}

interface BookFile {
  translation: string;
  book: string;
  chapters: Record<string, string[]>;
}

const BIBLE_DIR = join(process.cwd(), "public", "bible");

// In-process caches (packs are immutable, so no invalidation is needed).
const bookCache = new Map<string, BookFile | null>();
let manifestCache: BibleManifest | null = null;

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export function getManifest(): BibleManifest | null {
  if (manifestCache) return manifestCache;
  const m = readJson<BibleManifest>(join(BIBLE_DIR, "manifest.json"));
  if (m) manifestCache = m;
  return m;
}

function getBook(code: string, book: string): BookFile | null {
  const key = `${code}/${book}`;
  if (bookCache.has(key)) return bookCache.get(key) ?? null;
  const file = join(BIBLE_DIR, code, `${book}.json`);
  const data = existsSync(file) ? readJson<BookFile>(file) : null;
  bookCache.set(key, data);
  return data;
}

/** Serve one chapter straight from the bundled pack files. */
export function getPackChapter(code: string, book: string, chapter: number) {
  const data = getBook(code, book);
  if (!data) return null;
  const verses = data.chapters[String(chapter)];
  if (!verses || verses.length === 0) return null;
  return verses
    .map((text, i) => ({ verse: i + 1, heading: null as string | null, text }))
    .filter((v) => v.text);
}

/** Availability map shaped like `/api/available` expects. */
export function getPackAvailability(): Record<string, Record<string, number[]>> {
  const manifest = getManifest();
  const out: Record<string, Record<string, number[]>> = {};
  if (!manifest) return out;
  for (const pack of manifest.packs) {
    out[pack.code] ??= {};
    for (const book of pack.files) {
      const data = getBook(pack.code, book);
      if (!data) continue;
      out[pack.code][book] = Object.keys(data.chapters)
        .map(Number)
        .sort((a, b) => a - b);
    }
  }
  return out;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Scan the bundled packs for search hits (used when the DB is unavailable). */
export function searchPacks(
  code: string,
  query: string,
  limit = 60,
): { book: string; chapter: number; verse: number; text: string }[] {
  const manifest = getManifest();
  const pack = manifest?.packs.find((p) => p.code === code);
  if (!pack) return [];

  const q = normalize(query.trim());
  if (q.length < 2) return [];

  const results: { book: string; chapter: number; verse: number; text: string }[] = [];
  for (const book of pack.files) {
    const data = getBook(code, book);
    if (!data) continue;
    for (const [chapter, verses] of Object.entries(data.chapters)) {
      for (let i = 0; i < verses.length; i += 1) {
        const text = verses[i];
        if (text && normalize(text).includes(q)) {
          results.push({ book, chapter: Number(chapter), verse: i + 1, text });
          if (results.length >= limit) return results;
        }
      }
    }
  }
  return results;
}
