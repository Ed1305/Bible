import { getLiveVerse, setLiveVerse } from "@/lib/live-verse-store";

/**
 * Live-verse endpoint for the OBS scripture overlay.
 *
 * Uses Postgres when DATABASE_URL / POSTGRES_URL is set. On Vercel without a
 * database (this project ships offline packs instead), it stores the single
 * live row in the Vercel Runtime Cache so /control and /display stay in sync.
 *
 * /control polls GET every 2s and POSTs on Show/Clear.
 * /display polls GET every 1s and renders whatever is visible.
 */

export const dynamic = "force-dynamic";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };

export async function GET() {
  try {
    return Response.json(await getLiveVerse(), NO_STORE);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const row = await setLiveVerse({
      reference: String(body.reference ?? "").trim(),
      body: String(body.body ?? "").trim(),
      translation: String(body.translation ?? "KJV").trim(),
      visible: Boolean(body.visible),
    });
    return Response.json(row, NO_STORE);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
