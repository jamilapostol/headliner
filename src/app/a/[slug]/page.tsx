import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDateUTC } from "@/lib/format";
import { publicShows, type PublicShow } from "@/lib/public-profile";

export const dynamic = "force-dynamic";

// A public tour listing. This is the only page in the app served to people
// who are not signed in, so everything on it goes through publicShows() —
// confirmed dates only, and only the fields a listing needs. See
// lib/public-profile.ts for why that mapping is field-by-field.

async function load(slug: string) {
  const workspace = await db.workspace.findFirst({
    where: { publicSlug: slug, publicEnabled: true },
    select: { id: true, name: true, publicBio: true, publicSlug: true },
  });
  if (!workspace) return null;

  const bookings = await db.booking.findMany({
    where: { workspaceId: workspace.id, stage: { in: ["Confirmed", "Paid"] } },
    select: { id: true, venue: true, city: true, date: true, stage: true, ticketUrl: true },
    orderBy: { date: "asc" },
  });

  return { workspace, shows: publicShows(bookings) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) return { title: "Not found" };

  const next = data.shows[0];
  const description = next
    ? `${data.workspace.name} — next show ${fmtDateUTC(new Date(`${next.date}T00:00:00Z`), { month: "long", day: "numeric" })} at ${next.venue}, ${next.city}.`
    : `Tour dates for ${data.workspace.name}.`;

  return {
    title: `${data.workspace.name} — Tour dates`,
    description,
    openGraph: { title: `${data.workspace.name} — Tour dates`, description, type: "profile" },
    // A listing whose dates change weekly is worth recrawling, and this is
    // the page that wants to be found.
    robots: { index: true, follow: true },
  };
}

export default async function PublicTourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();

  const { workspace, shows } = data;

  // schema.org MusicEvent is how aggregators and search actually read a
  // tour listing — this is the real "syndication", not a pushed feed. Only
  // fields already on the public show go in; no doors time is emitted
  // because none is stored.
  const jsonLd = shows.map((show) => ({
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${workspace.name} at ${show.venue}`,
    startDate: show.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    performer: { "@type": "MusicGroup", name: workspace.name },
    location: { "@type": "Place", name: show.venue, address: { "@type": "PostalAddress", addressLocality: show.city } },
    ...(show.ticketUrl ? { offers: { "@type": "Offer", url: show.ticketUrl, availability: "https://schema.org/InStock" } } : {}),
  }));

  return (
    <div className="min-h-screen bg-canvas px-4 py-12 sm:px-8">
      {jsonLd.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <div className="mx-auto max-w-[640px]">
        <h1 className="mb-1.5 text-[30px] leading-[1.1] tracking-[-.02em] sm:text-[38px]">{workspace.name}</h1>
        {workspace.publicBio && (
          <p className="mb-6 max-w-[520px] text-[14px] leading-relaxed text-text/60">{workspace.publicBio}</p>
        )}

        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2.5">
          <div className="font-mono text-[11px] tracking-[.12em] text-text/40">
            {shows.length > 0 ? `${shows.length} UPCOMING SHOW${shows.length === 1 ? "" : "S"}` : "TOUR DATES"}
          </div>
          {shows.length > 0 && (
            <a href={`/a/${workspace.publicSlug}/tour.ics`} className="text-[12.5px] text-accent hover:underline">
              Add to calendar
            </a>
          )}
        </div>

        {shows.length === 0 ? (
          <div className="py-12 text-center text-[14px] text-text/45">No dates announced right now — check back.</div>
        ) : (
          <div className="flex flex-col">
            {shows.map((show) => (
              <ShowRow key={show.id} show={show} />
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-border pt-5 text-[11.5px] text-text/30">
          Dates by{" "}
          <a href="/" className="text-text/45 hover:text-text/70">
            HEADLINE.WORLD
          </a>
        </div>
      </div>
    </div>
  );
}

function ShowRow({ show }: { show: PublicShow }) {
  const date = new Date(`${show.date}T00:00:00Z`);
  return (
    <div className="flex items-center gap-4 border-b border-text/[.06] py-3.5">
      <div className="w-[62px] flex-none">
        <div className="font-mono text-[11px] tracking-[.08em] text-text/40">
          {fmtDateUTC(date, { month: "short" }).toUpperCase()}
        </div>
        <div className="font-mono text-[19px] leading-tight">{fmtDateUTC(date, { day: "numeric" })}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{show.city}</div>
        <div className="truncate text-[12.5px] text-text/50">{show.venue}</div>
      </div>
      {show.ticketUrl && (
        <a
          href={show.ticketUrl}
          target="_blank"
          // noopener/noreferrer on an artist-supplied outbound link: the
          // destination must not get a handle on this window.
          rel="noopener noreferrer nofollow"
          className="flex-none rounded-lg bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-accent/85"
        >
          Tickets
        </a>
      )}
    </div>
  );
}
