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

export function fmtDateUTC(d: Date, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}
