import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// A single Bible verse for a given translation.
export const verses = pgTable(
  "verses",
  {
    id: serial("id").primaryKey(),
    translation: varchar("translation", { length: 16 }).notNull(),
    bookSlug: varchar("book_slug", { length: 40 }).notNull(),
    chapter: integer("chapter").notNull(),
    verse: integer("verse").notNull(),
    heading: text("heading"),
    text: text("text").notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("verses_unique_idx").on(
      t.translation,
      t.bookSlug,
      t.chapter,
      t.verse,
    ),
    lookup: index("verses_lookup_idx").on(
      t.translation,
      t.bookSlug,
      t.chapter,
    ),
  }),
);

// Bible reading / study plans.
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  subtitle: varchar("subtitle", { length: 240 }),
  description: text("description"),
  category: varchar("category", { length: 60 }),
  durationDays: integer("duration_days").notNull(),
  accent: varchar("accent", { length: 24 }),
  // Array of days: { day, title, reference, readings: [{book, chapter, verses?}] }
  days: jsonb("days").notNull(),
});

export type Verse = typeof verses.$inferSelect;
export type Plan = typeof plans.$inferSelect;
