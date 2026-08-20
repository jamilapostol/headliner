// Each area owns one accent — BRAND.md §3.2's feature-area mapping. The
// glyph carries it in the rail, which is what stops the app reading as one
// long gold column and makes a section recognisable before you read its
// label.
export const NAV_ITEMS: Array<{ href: string; label: string; glyph: string; tint: string; soon?: boolean }> = [
  { href: "/app", label: "Dashboard", glyph: "◈", tint: "text-text/70" },
  { href: "/app/bookings", label: "Bookings", glyph: "▤", tint: "text-accent" },
  { href: "/app/calendar", label: "Calendar", glyph: "▦", tint: "text-accent" },
  { href: "/app/tour", label: "Tour", glyph: "➤", tint: "text-accent" },
  { href: "/app/contacts", label: "Contacts", glyph: "◉", tint: "text-green" },
  { href: "/app/merch", label: "Merch", glyph: "▣", tint: "text-orange" },
  { href: "/app/fans", label: "Fans", glyph: "♥", tint: "text-green" },
  { href: "/app/finance", label: "Finance", glyph: "$", tint: "text-blue" },
  { href: "/app/settlement", label: "Settlement", glyph: "⊞", tint: "text-blue" },
  { href: "/app/campaigns", label: "Campaigns", glyph: "✉", tint: "text-magenta" },
  { href: "/app/contracts", label: "Contracts", glyph: "§", tint: "text-purple" },
  { href: "/app/analytics", label: "Analytics", glyph: "∿", tint: "text-pink" },
];
