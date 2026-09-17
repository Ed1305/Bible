import { db } from "@/db";
import { plans } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(plans).orderBy(asc(plans.id));
    return Response.json({ plans: rows });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
