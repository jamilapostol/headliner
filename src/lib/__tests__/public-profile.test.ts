import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildIcs,
  isPublishableStage,
  normalizeSlug,
  publicShows,
  safeTicketUrl,
  slugError,
  toPublicShow,
  type BookingForPublic,
} from "../public-profile";

function booking(over: Partial<BookingForPublic> = {}): BookingForPublic {
  return {
    id: "b1",
    venue: "The Fillmore",
    city: "San Francisco",
    date: new Date("2026-09-01T00:00:00Z"),
    stage: "Confirmed",
    ticketUrl: null,
    ...over,
  };
}

// --- the privacy boundary -------------------------------------------------

test("a public show carries ONLY the fields a listing needs", () => {
  // The load-bearing test. A Booking also holds the fee, the deposit, the
  // promoter's mobile and negotiation notes; if toPublicShow ever starts
  // spreading the booking, this catches it before a page does.
  const publicShow = toPublicShow(booking());
  assert.deepEqual(Object.keys(publicShow).sort(), ["city", "date", "id", "ticketUrl", "venue"]);
});

test("a private booking's extra fields cannot ride along", () => {
  const withSecrets = {
    ...booking(),
    fee: 500_000,
    deposit: 100_000,
    contactPhone: "+1 555 0100",
    notes: "they went to 6k, hold at 5",
  } as BookingForPublic;

  const serialized = JSON.stringify(toPublicShow(withSecrets));
  assert.ok(!serialized.includes("500000"), "fee must not appear");
  assert.ok(!serialized.includes("555"), "contact must not appear");
  assert.ok(!serialized.toLowerCase().includes("hold at"), "notes must not appear");
});

test("only confirmed and paid shows are publishable", () => {
  assert.equal(isPublishableStage("Confirmed"), true);
  assert.equal(isPublishableStage("Paid"), true);
  for (const stage of ["Lead", "Contacted", "Negotiating", "Offer_Sent"]) {
    assert.equal(isPublishableStage(stage), false, `${stage} is private business`);
  }
});

test("unconfirmed shows never reach a listing", () => {
  const shows = publicShows(
    [
      booking({ id: "confirmed", stage: "Confirmed" }),
      booking({ id: "lead", stage: "Lead" }),
      booking({ id: "negotiating", stage: "Negotiating" }),
    ],
    new Date("2026-08-01T00:00:00Z")
  );
  assert.deepEqual(shows.map((s) => s.id), ["confirmed"]);
});

test("past shows drop off the listing, today's stays", () => {
  const shows = publicShows(
    [
      booking({ id: "past", date: new Date("2026-07-01T00:00:00Z") }),
      booking({ id: "today", date: new Date("2026-08-01T00:00:00Z") }),
      booking({ id: "future", date: new Date("2026-09-01T00:00:00Z") }),
    ],
    new Date("2026-08-01T12:00:00Z")
  );
  assert.deepEqual(shows.map((s) => s.id), ["today", "future"], "a show today has not happened yet");
});

// --- ticket links ---------------------------------------------------------

test("only http(s) ticket links survive", () => {
  assert.equal(safeTicketUrl("https://tickets.example.com/x"), "https://tickets.example.com/x");
  assert.equal(safeTicketUrl("http://example.com"), "http://example.com/");
  // Rendered into an anchor on a public page, these run against every visitor.
  assert.equal(safeTicketUrl("javascript:alert(1)"), null);
  assert.equal(safeTicketUrl("data:text/html,<script>alert(1)</script>"), null);
  assert.equal(safeTicketUrl("not a url"), null);
  assert.equal(safeTicketUrl(""), null);
  assert.equal(safeTicketUrl(null), null);
});

// --- slugs ----------------------------------------------------------------

test("slugs normalize to something usable in a URL", () => {
  assert.equal(normalizeSlug("  Mara Voss  "), "mara-voss");
  assert.equal(normalizeSlug("Sun/Set!!"), "sun-set");
  assert.equal(normalizeSlug("--weird--"), "weird");
});

test("slug rules reject what would break or mislead", () => {
  assert.equal(slugError("mara-voss"), null);
  assert.ok(slugError("ab"), "too short");
  assert.ok(slugError("-lead"), "must not start with a hyphen");
  assert.ok(slugError("a--b"), "no double hyphens");
  assert.ok(slugError("admin"), "reserved");
  assert.ok(slugError("Mara"), "uppercase is not normalized here");
});

// --- calendar feed --------------------------------------------------------

test("the feed is a valid calendar with one event per show", () => {
  const ics = buildIcs({
    name: "Mara Voss",
    shows: publicShows([booking()], new Date("2026-08-01T00:00:00Z")),
    now: new Date("2026-08-01T10:00:00Z"),
  });

  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.trimEnd().endsWith("END:VCALENDAR"));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20260901"));
  assert.ok(ics.includes("\r\n"), "CRLF line endings are required");
});

test("an all-day event ends the day after it starts", () => {
  // iCalendar all-day DTEND is exclusive; same-day start and end renders as
  // a zero-length event that vanishes from month views in some clients.
  const ics = buildIcs({ name: "X", shows: publicShows([booking()], new Date("2026-08-01T00:00:00Z")) });
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20260901"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20260902"));
});

test("commas and semicolons in a venue name are escaped, not left to break the feed", () => {
  const ics = buildIcs({
    name: "X",
    shows: publicShows([booking({ venue: "Bob's Bar, Grill; Etc" })], new Date("2026-08-01T00:00:00Z")),
  });
  assert.ok(ics.includes("Bob's Bar\\, Grill\; Etc"), "raw punctuation would terminate the property early");
});

test("long lines are folded to the 75-octet limit", () => {
  const ics = buildIcs({
    name: "X",
    shows: publicShows([booking({ venue: "The " + "Very ".repeat(30) + "Long Room" })], new Date("2026-08-01T00:00:00Z")),
  });
  for (const line of ics.split("\r\n")) {
    assert.ok(line.length <= 75, `line over the limit: ${line.length}`);
  }
});
