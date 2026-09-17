#!/usr/bin/env node
/**
 * Generates the offline Bible packs shipped with the app.
 *
 * Output (committed to git so `vercel build` needs no network access):
 *   public/bible/<CODE>/<book-slug>.json   -> { "translation", "book", "chapters": { "1": ["v1","v2",...] } }
 *   public/bible/manifest.json             -> index used by the download UI + service worker
 *
 * Sources (all public domain / openly licensed, see `sources` in the manifest):
 *   ESV slot -> eng-engwebp  World English Bible (public domain)
 *   LSG      -> fra-fraLSG   Louis Segond 1910 (public domain)
 *   SW       -> swh-swhulb   Biblia Takatifu, Unlocked Literal Bible (CC BY-SA 4.0, Door43)
 *   LIN      -> lin-lin      Salela na bonsomi / Mokanda na Bomoi (Biblica, see licence note)
 *
 * Usage:
 *   node scripts/fetch-offline-bible.mjs            # downloads what is missing, regenerates
 *   node scripts/fetch-offline-bible.mjs --refresh  # re-download everything
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/**
 * Read the app's own USFM book-code map out of src/lib/bible/usfm.ts so the
 * generated data can never drift from what the UI expects.
 */
function loadBookCodes() {
  const ts = readFileSync(join(ROOT, "src/lib/bible/usfm.ts"), "utf8");
  const body = /export const BOOK_USFM_CODES[^=]*=\s*\{([\s\S]*?)\n\};/.exec(ts);
  if (!body) throw new Error("could not find BOOK_USFM_CODES in src/lib/bible/usfm.ts");
  const map = {};
  for (const m of body[1].matchAll(/"?([a-z0-9-]+)"?\s*:\s*"([0-9][A-Z]{2}|[A-Z]{3})"/g)) {
    map[m[1]] = m[2];
  }
  if (Object.keys(map).length < 66) {
    throw new Error(`only parsed ${Object.keys(map).length} book codes, expected 66`);
  }
  return map;
}

const BOOK_USFM_CODES = loadBookCodes();

const CACHE_DIR = process.env.BIBLE_CACHE_DIR || join(ROOT, ".cache", "ebible");
const OUT_DIR = join(ROOT, "public", "bible");
const REFRESH = process.argv.includes("--refresh");

const REPO = "BibleNLP/ebible";

/** Translation code used by the app -> eBible corpus file + licence metadata. */
const PACKS = [
  {
    code: "ESV",
    label: "English — World English Bible",
    lang: "en",
    corpus: "corpus/eng-engwebp.txt",
    licence: "Public Domain",
    note: "The ESV slot serves the World English Bible, a modern public-domain English translation.",
  },
  {
    code: "LSG",
    label: "Français — Louis Segond 1910",
    lang: "fr",
    corpus: "corpus/fra-fraLSG.txt",
    licence: "Public Domain",
    note: "Louis Segond 1910, public domain.",
  },
  {
    code: "SW",
    label: "Kiswahili — Biblia Takatifu (ULB)",
    lang: "sw",
    corpus: "corpus/swh-swhulb.txt",
    licence: "CC BY-SA 4.0 (Door43 World Missions Community, 2019)",
    note: "Unlocked Literal Bible, Kiswahili. Attribution + share-alike.",
  },
  {
    code: "LIN",
    label: "Lingála — Salela na bonsomi",
    lang: "ln",
    corpus: "corpus/lin-lin.txt",
    licence: "Biblica — see eBible metadata",
    note: "Biblica® Salela na bonsomi Mokanda na Bomoi™. Verify redistribution terms before wide release.",
  },
];

// Reverse map: "GEN" -> "genesis"
const CODE_TO_SLUG = Object.fromEntries(
  Object.entries(BOOK_USFM_CODES).map(([slug, code]) => [code, slug]),
);

const PROTESTANT_66 = Object.keys(BOOK_USFM_CODES);

/* ------------------------------------------------------------------ *
 * Download helpers (GitHub REST API — the git blobs endpoint streams
 * files up to 100 MB, unlike /contents which caps at 1 MB).
 * ------------------------------------------------------------------ */

function api(path) {
  return {
    url: `https://api.github.com/repos/${REPO}/${path}`,
    headers: {
      "user-agent": "lumina-bible-data-generator",
      accept: "application/vnd.github+json",
      ...(process.env.GITHUB_TOKEN
        ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
    },
  };
}

/**
 * Sandboxes / corporate proxies often MITM TLS with a root CA that lives in the
 * system store but not in Node's bundled one. `NODE_EXTRA_CA_CERTS` only works
 * when set before Node boots, so point it at the system bundle and re-exec once.
 */
function reexecWithSystemCerts() {
  const systemBundle = "/etc/ssl/certs/ca-certificates.crt";
  if (process.env.LUMINA_CERTS_TRIED) return;
  if (process.env.NODE_EXTRA_CA_CERTS) return;
  if (!existsSync(systemBundle)) return;
  const { spawnSync } = require_node_child_process();
  console.log(`  · re-executing with NODE_EXTRA_CA_CERTS=${systemBundle}`);
  const res = spawnSync(process.execPath, process.argv.slice(1), {
    stdio: "inherit",
    env: { ...process.env, NODE_EXTRA_CA_CERTS: systemBundle, LUMINA_CERTS_TRIED: "1" },
  });
  process.exit(res.status ?? 1);
}

function require_node_child_process() {
  // Lazy import so the top of the file stays ESM-clean.
  return nodeRequire("node:child_process");
}

let nodeRequire;
{
  const { createRequire } = await import("node:module");
  nodeRequire = createRequire(import.meta.url);
}

async function fetchJson(path) {
  const res = await fetch(api(path).url, { headers: api(path).headers });
  if (!res.ok) {
    throw new Error(`GET ${path} -> ${res.status} ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

async function downloadBlob(repoPath, destFile) {
  const meta = await fetchJson(`contents/${repoPath}`);
  const blob = await fetchJson(`git/blobs/${meta.sha}`);
  if (!blob.content) throw new Error(`blob ${repoPath} returned no content`);
  const buf = Buffer.from(blob.content, "base64");
  if (buf.length !== meta.size) {
    console.warn(`  ! size mismatch for ${repoPath}: ${buf.length} vs ${meta.size}`);
  }
  writeFileSync(destFile, buf);
  return buf;
}

async function ensureCorpus(pack) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const name = pack.corpus.split("/").pop();
  const file = join(CACHE_DIR, name);
  if (existsSync(file) && !REFRESH && statSync(file).size > 1000) {
    console.log(`  · cached ${name} (${(statSync(file).size / 1024 / 1024).toFixed(1)} MB)`);
    return readFileSync(file, "utf8");
  }
  console.log(`  ↓ downloading ${pack.corpus} …`);
  const buf = await downloadBlob(pack.corpus, file);
  console.log(`    ${(buf.length / 1024 / 1024).toFixed(1)} MB -> ${file}`);
  return buf.toString("utf8");
}

async function ensureVref() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = join(CACHE_DIR, "vref.txt");
  if (existsSync(file) && !REFRESH) return readFileSync(file, "utf8").split(/\r?\n/);
  console.log("  ↓ downloading metadata/vref.txt …");
  const buf = await downloadBlob("metadata/vref.txt", file);
  return buf.toString("utf8").split(/\r?\n/);
}

/* ------------------------------------------------------------------ *
 * Parsing
 * ------------------------------------------------------------------ */

/** "GEN 1:1" -> { code, chapter, verse } | null */
function parseRef(ref) {
  if (!ref) return null;
  const m = /^(\S+) (\d+):(\d+)$/.exec(ref.trim());
  if (!m) return null;
  return { code: m[1], chapter: Number(m[2]), verse: Number(m[3]) };
}

/**
 * Zip the verse-reference file with the translation corpus (line N of the
 * corpus is the text for vref line N) into { bookSlug: { chapter: string[] } }.
 * Only the 66 Protestant books the app knows about are kept; deuterocanonical
 * material is dropped.
 */
function buildPack(vrefLines, text) {
  const corpus = text.split(/\r?\n/);
  if (corpus.length !== vrefLines.length) {
    console.warn(
      `  ! line count mismatch: corpus ${corpus.length} vs vref ${vrefLines.length}`,
    );
  }
  const out = {};
  let kept = 0;
  let dropped = 0;
  const max = Math.min(corpus.length, vrefLines.length);
  for (let i = 0; i < max; i += 1) {
    const ref = parseRef(vrefLines[i]);
    if (!ref) continue;
    const slug = CODE_TO_SLUG[ref.code];
    if (!slug) {
      dropped += 1;
      continue;
    }
    out[slug] ??= {};
    out[slug][ref.chapter] ??= [];
    const arr = out[slug][ref.chapter];
    // Index by verse number so `verses[n]` is always the (n+1)-th verse.
    arr[ref.verse - 1] = (corpus[i] || "").trim();
    kept += 1;
  }
  // Fill any holes so indexing stays stable.
  for (const slug of Object.keys(out)) {
    for (const ch of Object.keys(out[slug])) {
      out[slug][ch] = out[slug][ch].map((v) => v ?? "");
    }
  }
  return { out, kept, dropped };
}

function dirSize(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).reduce((n, f) => n + statSync(join(dir, f)).size, 0);
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
  reexecWithSystemCerts();

  console.log("Lumina Bible — offline data generator");
  console.log(`  cache: ${CACHE_DIR}`);
  console.log(`  out:   ${OUT_DIR}\n`);

  const vref = await ensureVref();
  console.log(`  vref.txt: ${vref.filter(Boolean).length} verse references\n`);

  // Expected chapter counts per book, derived from vref so we can sanity-check.
  const expectedChapters = {};
  for (const ref of vref) {
    if (!ref) continue;
    const m = /^(\S+) (\d+):/.exec(ref);
    if (!m) continue;
    const slug = CODE_TO_SLUG[m[1]];
    if (!slug) continue;
    expectedChapters[slug] = Math.max(expectedChapters[slug] ?? 0, Number(m[2]));
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = { generatedAt: new Date().toISOString(), packs: [] };
  let totalBytes = 0;

  for (const pack of PACKS) {
    console.log(`\n== ${pack.code}: ${pack.label}`);
    const text = await ensureCorpus(pack);
    const { out, kept, dropped } = buildPack(vref, text);

    const packDir = join(OUT_DIR, pack.code);
    mkdirSync(packDir, { recursive: true });
    for (const stale of readdirSync(packDir)) {
      // remove files for books no longer present (keeps the pack honest)
      if (stale.endsWith(".json") && !out[stale.replace(/\.json$/, "")]) {
        unlinkSync(join(packDir, stale));
      }
    }

    const books = [];
    for (const slug of PROTESTANT_66) {
      const chapters = out[slug];
      if (!chapters) continue;
      const chapterNums = Object.keys(chapters).map(Number).sort((a, b) => a - b);
      const verseCount = chapterNums.reduce((n, c) => n + chapters[c].length, 0);
      const payload = { translation: pack.code, book: slug, chapters };
      const file = join(packDir, `${slug}.json`);
      writeFileSync(file, JSON.stringify(payload));
      books.push({
        book: slug,
        chapters: chapterNums.length,
        verses: verseCount,
        bytes: statSync(file).size,
      });
    }

    const missing = PROTESTANT_66.filter((s) => !out[s]);
    const wrongChapters = books.filter(
      (b) => expectedChapters[b.book] && b.chapters !== expectedChapters[b.book],
    );

    const bytes = dirSize(packDir);
    totalBytes += bytes;
    manifest.packs.push({
      code: pack.code,
      label: pack.label,
      lang: pack.lang,
      licence: pack.licence,
      note: pack.note,
      source: `${REPO}/${pack.corpus}`,
      books: books.length,
      chapters: books.reduce((n, b) => n + b.chapters, 0),
      verses: books.reduce((n, b) => n + b.verses, 0),
      bytes,
      files: books.map((b) => b.book),
    });

    console.log(
      `  ${books.length} books, ${manifest.packs.at(-1).chapters} chapters, ` +
        `${manifest.packs.at(-1).verses} verses, ${(bytes / 1024 / 1024).toFixed(1)} MB ` +
        `(${kept} verses kept, ${dropped} non-66 lines dropped)`,
    );
    if (missing.length) console.warn(`  ! missing books: ${missing.join(", ")}`);
    if (wrongChapters.length) {
      console.warn(
        `  ! chapter count differs from vref: ` +
          wrongChapters.map((b) => `${b.book}(${b.chapters}/${expectedChapters[b.book]})`).join(", "),
      );
    }
  }

  manifest.totalBytes = totalBytes;
  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `\nDone. ${manifest.packs.length} packs, ${(totalBytes / 1024 / 1024).toFixed(1)} MB total -> ${OUT_DIR}`,
  );
  console.log("manifest.json written");
}

main().catch((err) => {
  console.error("\nFAILED:", err.message);
  process.exit(1);
});
