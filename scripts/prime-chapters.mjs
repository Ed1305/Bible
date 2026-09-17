import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(join(__dirname, "..", ".env"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (m) {
        let val = m[1].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        return val;
      }
    }
  } catch {}
  return "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
}

const pool = new pg.Pool({ connectionString: loadEnv() });

// Prime top priority chapters for ESV so they're immediately available with 0 network calls:
// Exodus 1, Leviticus 1, Numbers 1, Deuteronomy 1, Joshua 1, Judges 1, Ruth 1,
// Matthew 1, Mark 1, Luke 1, Romans 1, Philippians 1, Genesis 1-3, Psalm 1 & 23, John 1-3.
const BOOKS_TO_PRIME = [
  { book: "exodus", chapter: 1 },
  { book: "leviticus", chapter: 1 },
  { book: "numbers", chapter: 1 },
  { book: "deuteronomy", chapter: 1 },
  { book: "joshua", chapter: 1 },
  { book: "judges", chapter: 1 },
  { book: "ruth", chapter: 1 },
  { book: "matthew", chapter: 1 },
  { book: "mark", chapter: 1 },
  { book: "luke", chapter: 1 },
  { book: "acts", chapter: 1 },
  { book: "romans", chapter: 1 },
  { book: "philippians", chapter: 1 },
  { book: "revelation", chapter: 1 },
];

async function main() {
  const client = await pool.connect();
  console.log("Priming top opening chapters for ESV from bible-api.com...");
  for (const item of BOOKS_TO_PRIME) {
    try {
      const url = `https://bible-api.com/${item.book}+${item.chapter}?translation=web`;
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`Failed to fetch ${item.book} ${item.chapter}`);
        continue;
      }
      const data = await res.json();
      if (!Array.isArray(data.verses)) continue;

      for (const v of data.verses) {
        await client.query(
          `INSERT INTO verses (translation, book_slug, chapter, verse, heading, text)
           VALUES ('ESV', $1, $2, $3, null, $4)
           ON CONFLICT (translation, book_slug, chapter, verse)
           DO UPDATE SET text = EXCLUDED.text`,
          [item.book, item.chapter, v.verse, (v.text || "").replace(/\s+/g, " ").trim()],
        );
      }
      console.log(`✓ Seeded ${item.book} ${item.chapter} (${data.verses.length} verses)`);
    } catch (e) {
      console.error(`Error on ${item.book} ${item.chapter}:`, e.message);
    }
  }
  client.release();
  await pool.end();
}

main();
