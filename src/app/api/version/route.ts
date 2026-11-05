export const dynamic = "force-dynamic";

/** The deployment the server is running, so open tabs can tell they're out of date. */
export function GET() {
  return Response.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
