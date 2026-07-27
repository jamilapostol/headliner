export const INTEGRATIONS = [
  { key: "gmail", chip: "GM", chipBg: "#e8983f", label: "Gmail", sub: "Import booking threads" },
  { key: "gcal", chip: "GC", chipBg: "#7ab8e8", label: "Google Calendar", sub: "Two-way sync" },
  { key: "stripe", chip: "ST", chipBg: "#c99df5", label: "Stripe", sub: "Payments + invoices" },
  { key: "square", chip: "SQ", chipBg: "#e9ece8", label: "Square", sub: "Merch table POS" },
  { key: "spotify", chip: "SP", chipBg: "#3fe87a", label: "Spotify for Artists", sub: "Streaming + listener data" },
  { key: "bit", chip: "BT", chipBg: "#e8e43f", label: "Bandsintown", sub: "Publish tour dates" },
] as const;

export type IntegrationKey = (typeof INTEGRATIONS)[number]["key"];
