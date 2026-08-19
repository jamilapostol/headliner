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
      // Calendar clients poll this on their own schedule; an hour keeps a
      // newly announced date from taking a day to appear without inviting
      // a poll every few minutes.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
