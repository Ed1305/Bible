import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env if not already present.
function loadEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(join(__dirname, "..", ".env"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/);
      if (m) {
        let val = m[1].trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        return val;
      }
    }
  } catch {
    // ignore
  }
  return "postgresql://postgres:postgres@127.0.0.1:5432/app_db";
}

const connectionString = loadEnv();
const { Pool } = pg;
const pool = new Pool({ connectionString });

const data = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "lib", "bible", "seed-content.json"), "utf8"),
);

async function main() {
  const client = await pool.connect();
  try {
    console.log("Seeding verses:", data.verses.length);
    await client.query("BEGIN");

    for (const v of data.verses) {
      await client.query(
        `INSERT INTO verses (translation, book_slug, chapter, verse, heading, text)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (translation, book_slug, chapter, verse)
         DO UPDATE SET heading = EXCLUDED.heading, text = EXCLUDED.text`,
        [v.translation, v.book, v.chapter, v.verse, v.heading ?? null, v.text],
      );
    }

    console.log("Seeding plans:", data.plans.length);
    for (const p of data.plans) {
      await client.query(
        `INSERT INTO plans (slug, title, subtitle, description, category, duration_days, accent, days)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug)
         DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle,
           description = EXCLUDED.description, category = EXCLUDED.category,
           duration_days = EXCLUDED.duration_days, accent = EXCLUDED.accent, days = EXCLUDED.days`,
        [
          p.slug,
          p.title,
          p.subtitle ?? null,
          p.description ?? null,
          p.category ?? null,
          p.durationDays,
          p.accent ?? null,
          JSON.stringify(p.days),
        ],
      );
    }

    await client.query("COMMIT");
    console.log("Seed complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
