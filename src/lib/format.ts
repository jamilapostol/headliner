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

export function fmtDateUTC(d: Date, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
}
