import { db } from "@/db";
import { plans } from "@/db/schema";
import { asc } from "drizzle-orm";
import seedContent from "@/lib/bible/seed-content.json";

export const dynamic = "force-dynamic";

export async function GET() {
  // 1. Database.
  try {
    const rows = await db.select().from(plans).orderBy(asc(plans.id));
    if (rows.length > 0) {
      return Response.json({ plans: rows });
    }
  } catch {
    // database unavailable — fall through to the bundled plans
  }

  // 2. Bundled plans (same shape as the DB rows).
  return Response.json({ plans: seedContent.plans });
}
