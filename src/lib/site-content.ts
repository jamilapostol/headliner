import { db } from "@/lib/db";

export type SiteContentField = {
  key: string;
  label: string;
  section: string;
  default: string;
  multiline?: boolean;
  type?: "text" | "image";
};

// The default value for each key is the copy currently hardcoded on the
// landing page. A field with no row in SiteContent just renders its
// default, so this list can change (new keys) without a data migration.
export const SITE_CONTENT_FIELDS: SiteContentField[] = [
  { key: "hero_eyebrow", section: "Hero", label: "Eyebrow label", default: "FOR INDEPENDENT TOURING MUSICIANS" },
  {
    key: "hero_subheadline",
    section: "Hero",
    label: "Subheadline",
    default: "Bookings, tours, merch, fans and money — the operating system for artists who run their career without a label. Retire the spreadsheets.",
    multiline: true,
  },
  { key: "hero_cta_primary", section: "Hero", label: "Primary button", default: "Start free" },
  { key: "hero_cta_secondary", section: "Hero", label: "Secondary button", default: "Watch demo — 2 min" },
  { key: "hero_disclaimer", section: "Hero", label: "Fine print under buttons", default: "Free forever for your first 5 bookings. No card required." },
  { key: "hero_image", section: "Hero", label: "Background photo", default: "/hero.png", type: "image" },

  { key: "retires_label", section: "Retires strip", label: "Label", default: "RETIRES" },

  { key: "benefits_heading", section: "Benefits", label: "Heading", default: "Run your career like the pro you already are" },
  {
    key: "benefits_subheading",
    section: "Benefits",
    label: "Subheading",
    default: "This is what changes when the busywork disappears.",
  },
  { key: "benefit_1_title", section: "Benefits", label: "1 — title", default: "Tour like you've got a team behind you" },
  {
    key: "benefit_1_body",
    section: "Benefits",
    label: "1 — body",
    default: "Booking, routing, contracts and settlements in one place — so a solo artist runs their career at the same level as an act with a full crew.",
    multiline: true,
  },
  { key: "benefit_2_title", section: "Benefits", label: "2 — title", default: "Say yes to more shows" },
  {
    key: "benefit_2_body",
    section: "Benefits",
    label: "2 — body",
    default: "No more holds lost to a forgotten follow-up. Every lead stays visible until it's booked, paid, or dead — nothing slips through a group text again.",
    multiline: true,
  },
  { key: "benefit_3_title", section: "Benefits", label: "3 — title", default: "Never leave money on the table" },
  {
    key: "benefit_3_body",
    section: "Benefits",
    label: "3 — body",
    default: "Every guarantee, deposit and settlement tracked by show. Know exactly what you're owed before you load out — not after tax season.",
    multiline: true,
  },
  { key: "benefit_4_title", section: "Benefits", label: "4 — title", default: "Actually enjoy the road" },
  {
    key: "benefit_4_body",
    section: "Benefits",
    label: "4 — body",
    default: "Day sheets, hotel confirmations and merch counts synced to your phone — so tour day feels like the reward it's supposed to be, not another spreadsheet.",
    multiline: true,
  },

  { key: "break_image", section: "Photo break", label: "Full-bleed photo", default: "/drums.png", type: "image" },
  { key: "break_image_alt", section: "Photo break", label: "Alt text", default: "A drum kit on stage at a live show" },

  { key: "feature_1_title", section: "Features", label: "1 — title", default: "Booking pipeline" },
  { key: "feature_1_body", section: "Features", label: "1 — body", default: "Drag every hold from first email to fully paid. Never lose a room to a forgotten follow-up.", multiline: true },
  { key: "feature_2_title", section: "Features", label: "2 — title", default: "Tour manager" },
  { key: "feature_2_body", section: "Features", label: "2 — body", default: "Route the run, advance every show, and hand the band a day sheet that answers every question.", multiline: true },
  { key: "feature_3_title", section: "Features", label: "3 — title", default: "Music-native CRM" },
  { key: "feature_3_body", section: "Features", label: "3 — body", default: "Promoters, buyers, press, sponsors and hosts — with relationship strength, sortable lists and last-contact nudges.", multiline: true },
  { key: "feature_4_title", section: "Features", label: "4 — title", default: "Merch that counts itself" },
  { key: "feature_4_body", section: "Features", label: "4 — body", default: "Per-show inventory, margins, and restock forecasts before you run out in Denver.", multiline: true },
  { key: "feature_5_title", section: "Features", label: "5 — title", default: "Money, settled" },
  {
    key: "feature_5_body",
    section: "Features",
    label: "5 — body",
    default: "Guarantees, settlements, invoices and P&L by tour, city and venue — plus a running balance sheet and receipt photos for every expense. Tax-season ready.",
    multiline: true,
  },
  { key: "feature_6_title", section: "Features", label: "6 — title", default: "Roadie AI" },
  { key: "feature_6_body", section: "Features", label: "6 — body", default: "Drafts your follow-ups, summarizes contracts, flags radius clauses, and predicts your best cities.", multiline: true },
  { key: "feature_7_title", section: "Features", label: "7 — title", default: "Fans who keep coming back" },
  {
    key: "feature_7_body",
    section: "Features",
    label: "7 — body",
    default: "Rank supporters by lifetime spend, tag your VIPs, and know who to invite when you're back in their city.",
    multiline: true,
  },

  { key: "pricing_heading", section: "Pricing", label: "Heading", default: "Priced for how you tour" },
  { key: "pricing_subheading", section: "Pricing", label: "Subheading", default: "Monthly, cancel anytime. Two months free on annual." },

  { key: "footer_heading", section: "Footer", label: "Heading", default: "The van is packed. Is your business?" },
  { key: "footer_subheading", section: "Footer", label: "Subheading", default: "Set up your first tour in under ten minutes." },
  { key: "footer_copyright", section: "Footer", label: "Copyright line", default: "© 2026 HEADLINE.WORLD · By musicians, for musicians" },
  { key: "footer_support_email", section: "Footer", label: "Support email", default: "support@headline.world" },
];

export async function getSiteContent(): Promise<Record<string, string>> {
  const rows = await db.siteContent.findMany();
  const overrides = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(SITE_CONTENT_FIELDS.map((f) => [f.key, overrides.get(f.key) ?? f.default]));
}
