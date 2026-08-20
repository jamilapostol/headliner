export const INTEGRATIONS = [
  { key: "gmail", chip: "GM", chipBg: "#FF7A2F", label: "Gmail", sub: "Import booking threads" },
  { key: "gcal", chip: "GC", chipBg: "#38B6E8", label: "Google Calendar", sub: "Two-way sync" },
  { key: "stripe", chip: "ST", chipBg: "#8B5CF6", label: "Stripe", sub: "Payments + invoices" },
  { key: "square", chip: "SQ", chipBg: "#F7F1E6", label: "Square", sub: "Merch table POS" },
  { key: "spotify", chip: "SP", chipBg: "#3FCB86", label: "Spotify for Artists", sub: "Streaming + listener data" },
  { key: "bit", chip: "BT", chipBg: "#FFC93C", label: "Bandsintown", sub: "Publish tour dates" },
] as const;

export type IntegrationKey = (typeof INTEGRATIONS)[number]["key"];
