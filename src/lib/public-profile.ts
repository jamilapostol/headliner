// The public tour listing: what a fan (or a search engine) sees, and the
// hard line between that and everything else on a Booking.
//
// A Booking carries the fee, the deposit, the promoter's mobile number and
// free-text notes about the negotiation. None of that may ever reach a
// public page. The defence is structural rather than careful: toPublicShow
// CONSTRUCTS its output field by field and never spreads a booking, so a
// column added to the model later cannot leak by being carried along. A
// test asserts exactly that.

/** Booking stages whose existence is safe to publish. A Lead or a
 *  Negotiating row is private business — it says which rooms an artist is
 *  talking to, which is exactly what a rival or a venue would like to
 *  know, and it may never happen at all. */
const PUBLISHABLE_STAGES = new Set(["Confirmed", "Paid"]);

export function isPublishableStage(stage: string): boolean {
  return PUBLISHABLE_STAGES.has(stage);
}

export type BookingForPublic = {
  id: string;
  venue: string;
  city: string;
  date: Date;
  stage: string;
  ticketUrl: string | null;
};

export type PublicShow = {
  id: string;
  venue: string;
  city: string;
  /** ISO date only ("2026-08-19"). Booking dates are UTC-midnight calendar
   *  markers with no time of day, and inventing a doors time for a listing
   *  would be making one up. */
  date: string;
  ticketUrl: string | null;
};

/** Field-by-field on purpose — see the module note. */
export function toPublicShow(booking: BookingForPublic): PublicShow {
  return {
    id: booking.id,
    venue: booking.venue,
    city: booking.city,
    date: booking.date.toISOString().slice(0, 10),
    ticketUrl: safeTicketUrl(booking.ticketUrl),
  };
}

/**
 * Only http(s) links survive. A stored `javascript:` or `data:` URL rendered
 * into an anchor on a public page is a script-execution vector aimed at
 * every visitor, and the value comes from user input.
 */
export function safeTicketUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function publicShows(bookings: readonly BookingForPublic[], now: Date = new Date()): PublicShow[] {
  const today = now.toISOString().slice(0, 10);
  return bookings
    .filter((b) => isPublishableStage(b.stage))
    .map(toPublicShow)
    .filter((s) => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// --- slugs ---------------------------------------------------------------

/** Reserved because they read as routes or as us, not as an artist. */
const RESERVED_SLUGS = new Set(["admin", "api", "app", "new", "login", "signup", "settings", "headline", "support", "help"]);

export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function slugError(slug: string): string | null {
  if (slug.length < 3) return "At least 3 characters.";
  if (slug.length > 40) return "40 characters at most.";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)) return "Letters, numbers and hyphens; must start and end with one.";
  if (slug.includes("--")) return "No double hyphens.";
  if (RESERVED_SLUGS.has(slug)) return "That one is reserved.";
  return null;
}

// --- calendar feed -------------------------------------------------------

/** iCalendar escaping: backslash first, or it would escape the escapes. */
function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545 caps a content line at 75 octets; continuations start with one
 *  space. Long venue names are exactly what overflows it. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest) parts.push(" " + rest);
  return parts.join("\r\n");
}

/**
 * A subscribable calendar of upcoming shows.
 *
 * All-day VALUE=DATE events, because a show date here is a calendar marker
 * with no stored doors time. DTEND is the day after DTSTART: in iCalendar
 * an all-day event's end is exclusive, and omitting it makes some clients
 * render a zero-length event that disappears from month views.
 */
export function buildIcs(opts: { name: string; shows: readonly PublicShow[]; now?: Date }): string {
  const stamp = (opts.now ?? new Date()).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HEADLINE.WORLD//Tour Dates//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${icsEscape(opts.name)}`),
  ];

  for (const show of opts.shows) {
    const start = show.date.replace(/-/g, "");
    const end = new Date(`${show.date}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() + 1);

    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:${show.id}@headline.world`),
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`,
      fold(`SUMMARY:${icsEscape(`${opts.name} — ${show.city}`)}`),
      fold(`LOCATION:${icsEscape(`${show.venue}, ${show.city}`)}`)
    );
    if (show.ticketUrl) lines.push(fold(`URL:${icsEscape(show.ticketUrl)}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
