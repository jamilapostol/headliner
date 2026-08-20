import { db } from "@/lib/db";
import { buildIcs, publicShows } from "@/lib/public-profile";

// Subscribable calendar feed. Fans add it once and their calendar picks up
// new dates on its own — which is the whole point of owning the listing
// rather than re-typing it into someone else's aggregator.

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const workspace = await db.workspace.findFirst({
    where: { publicSlug: slug, publicEnabled: true },
    select: { id: true, name: true },
  });
  if (!workspace) return new Response("Not found", { status: 404 });

  // Upcoming only, filtered in the query — same boundary as the page.
  const todayUtc = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);

  const bookings = await db.booking.findMany({
    where: { workspaceId: workspace.id, stage: { in: ["Confirmed", "Paid"] }, date: { gte: todayUtc } },
    select: { id: true, venue: true, city: true, date: true, stage: true, ticketUrl: true },
    orderBy: { date: "asc" },
  });

  const ics = buildIcs({ name: workspace.name, shows: publicShows(bookings) });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}-tour.ics"`,
      // A minute, not an hour. Nothing here can purge the CDN when an
      // artist switches their listing off, so this TTL IS the revocation
      // delay: at an hour, a page turned off kept handing out that
      // artist's dates for another hour, with nothing in the UI hinting
      // that it would. Caught by disabling a live listing and finding the
      // feed still serving it (x-vercel-cache: HIT, age 740).
      //
      // The cost runs the other way and is small — calendar clients poll
      // on their own slow schedule, so this absorbs bursts rather than
      // sustained traffic, and a minute still does that.
      "Cache-Control": "public, max-age=60, must-revalidate",
    },
  });
}
