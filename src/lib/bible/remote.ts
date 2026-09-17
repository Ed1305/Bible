import { BOOK_USFM_CODES } from "./usfm";

export interface RemoteVerse {
  verse: number;
  heading: string | null;
  text: string;
}

// Translations mapping to remote sources:
// ESV -> bible-api.com (World English Bible / ASV modern equivalent)
// LSG -> eBible.org corpus fra-fraLSG
// SW  -> eBible.org corpus swh-swhulb
// LIN -> eBible.org corpus lin-lin

const VREF_URL = "https://raw.githubusercontent.com/BibleNLP/ebible/main/metadata/vref.txt";
const CORPUS_URLS: Record<string, string> = {
  LSG: "https://raw.githubusercontent.com/BibleNLP/ebible/main/corpus/fra-fraLSG.txt",
  SW: "https://raw.githubusercontent.com/BibleNLP/ebible/main/corpus/swh-swhulb.txt",
  LIN: "https://raw.githubusercontent.com/BibleNLP/ebible/main/corpus/lin-lin.txt",
};

// In-memory cache for downloaded corpus data
let vrefCache: string[] | null = null;
const corpusCache: Record<string, string[]> = {};

async function getVref(): Promise<string[]> {
  if (vrefCache) return vrefCache;
  const res = await fetch(VREF_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch vref");
  const txt = await res.text();
  vrefCache = txt.split(/\r?\n/);
  return vrefCache;
}

async function getCorpus(translation: string): Promise<string[] | null> {
  if (corpusCache[translation]) return corpusCache[translation];
  const url = CORPUS_URLS[translation];
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const txt = await res.text();
    corpusCache[translation] = txt.split(/\r?\n/);
    return corpusCache[translation];
  } catch {
    return null;
  }
}

/**
 * Fetch a chapter from remote upstream Bible sources when not yet present in PostgreSQL.
 */
export async function fetchRemoteChapter(
  translation: string,
  bookSlug: string,
  chapter: number,
): Promise<RemoteVerse[]> {
  // 1. English (ESV) -> bible-api.com
  if (translation === "ESV") {
    try {
      const cleanBook = bookSlug.replace(/-/g, " ");
      const url = `https://bible-api.com/${encodeURIComponent(cleanBook)}+${chapter}?translation=web`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return [];
      const data = await res.json();
      if (!Array.isArray(data.verses)) return [];

      return data.verses.map((v: { verse: number; text: string }) => ({
        verse: v.verse,
        heading: null,
        text: (v.text || "").replace(/\s+/g, " ").trim(),
      }));
    } catch {
      return [];
    }
  }

  // 2. LSG (French), SW (Swahili), LIN (Lingala) -> BibleNLP/eBible
  const code = BOOK_USFM_CODES[bookSlug];
  if (!code) return [];

  try {
    const [vref, corpus] = await Promise.all([getVref(), getCorpus(translation)]);
    if (!vref || !corpus) return [];

    const prefix = `${code} ${chapter}:`;
    const results: RemoteVerse[] = [];

    const max = Math.min(vref.length, corpus.length);
    for (let i = 0; i < max; i++) {
      const ref = vref[i];
      if (ref.startsWith(prefix)) {
        const verseNum = Number(ref.slice(prefix.length).trim());
        const text = (corpus[i] || "").trim();
        if (text && !Number.isNaN(verseNum)) {
          results.push({
            verse: verseNum,
            heading: null,
            text,
          });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}
