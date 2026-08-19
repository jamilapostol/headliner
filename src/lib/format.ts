export function money(cents: number) {
  const sign = cents < 0 ? "-" : "";
  return sign + "$" + Math.abs(Math.round(cents / 100)).toLocaleString();
}

export function stageLabel(stage: string) {
  return stage.replace("_", " ");
}

// Booking/transaction dates are stored as date-only values (UTC midnight).
// Always read them back via UTC getters/timeZone so a display machine in a
// negative UTC offset doesn't render them a day early.
export function calendarDay(d: Date) {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * A calendar day as a stable string ("2026-08-19"), in UTC.
 *
 * Safe to hand from a server component to a client one and compare there:
 * a Date crossing that boundary gets serialized and re-parsed, whereas two
 * of these compare as plain strings. UTC to match calendarDay() and
 * fmtDateUTC(), which the rest of the app already uses for show dates.
 */
export function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whether a string names an IANA zone this runtime knows. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * The calendar day an instant falls on IN A GIVEN ZONE, as "2026-08-19".
 *
 * This is the exact form of utcDayKey. A 9pm show in Los Angeles is already
 * tomorrow in UTC, so asking "is this booking tonight" against UTC days can
 * be a full day wrong for most of the evening — precisely the hours a merch
 * table is open.
 *
 * Built from formatToParts rather than a locale that happens to print
 * ISO-ish: the parts are named, so the result cannot change shape with the
 * runtime's locale data. An unusable zone falls back to UTC rather than
 * throwing — a bad stored value should not take down a merch table
 * mid-show.
 */
export function dayKeyInZone(d: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    const key = `${get("year")}-${get("month")}-${get("day")}`;
    return key.length === 10 ? key : utcDayKey(d);
  } catch {
    return utcDayKey(d);
  }
}

/** The device's own zone — the best available guess for a venue with no
 *  stored timezone, since the phone running the merch table is standing in
 *  it. Returns null off-browser or when the runtime won't say. */
export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function fmtDateUTC(d: Date, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}
