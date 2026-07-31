// Fixed category lists per transaction kind — keeps "Revenue by source" and
// the P&L expense breakdown meaningful instead of fragmenting into typo
// variants ("Tour expenses" vs "tour expense" vs "Gas"). CSV import stays
// freeform (bulk external data shouldn't be rejected wholesale), but the
// manual entry forms are locked to this list.
export const INCOME_CATEGORIES = [
  "Performance fees",
  "Merchandise",
  "Streaming royalties",
  "Teaching / workshops",
  "Sync licensing",
  "Other income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Tour expenses",
  "Fees & software",
  "Merch COGS",
  "Other expense",
] as const;

export function categoriesFor(kind: string): readonly string[] {
  return kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}
