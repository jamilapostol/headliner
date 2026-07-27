import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const db = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding.");
}
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "jamil@headliner.demo";
const DEMO_PASSWORD = "password123";

async function main() {
  await db.task.deleteMany();
  await db.transaction.deleteMany();
  await db.tourStop.deleteMany();
  await db.tour.deleteMany();
  await db.merchItem.deleteMany();
  await db.contract.deleteMany();
  await db.fan.deleteMany();
  await db.campaign.deleteMany();
  await db.automation.deleteMany();
  await db.booking.deleteMany();
  await db.contact.deleteMany();
  await db.membership.deleteMany();
  await db.workspace.deleteMany();

  const userId = await createOrReuseDemoUser();

  const workspace = await db.workspace.create({
    data: {
      name: "Mara Voss",
      plan: "pro",
      billingCycle: "monthly",
      memberships: { create: { userId, role: "artist", acceptedAt: new Date() } },
    },
  });

  const contacts = await db.contact.createMany({
    data: [
      { workspaceId: workspace.id, name: "Jordan Reyes", org: "Bluebird Theater", role: "Talent buyer", category: "Venues", city: "Denver, CO", strength: 3, lastContactedAt: daysAgo(6) },
      { workspaceId: workspace.id, name: "Kim Tran", org: "Mississippi Studios", role: "Promoter", category: "Promoters", city: "Portland, OR", strength: 4, lastContactedAt: daysAgo(2) },
      { workspaceId: workspace.id, name: "Ana Whitfield", org: "Noise Pop", role: "Festival booker", category: "Festivals", city: "San Francisco, CA", strength: 5, lastContactedAt: daysAgo(1) },
      { workspaceId: workspace.id, name: "Marcus Klein", org: "Eddie's Attic", role: "Talent buyer", category: "Venues", city: "Decatur, GA", strength: 2, lastContactedAt: daysAgo(12) },
      { workspaceId: workspace.id, name: "Priya Nair", org: "Paste Magazine", role: "Music editor", category: "Media", city: "Atlanta, GA", strength: 3, lastContactedAt: daysAgo(3) },
      { workspaceId: workspace.id, name: "Sam Ortega", org: "Psyko Steve Presents", role: "Promoter", category: "Promoters", city: "Phoenix, AZ", strength: 3, lastContactedAt: daysAgo(5) },
      { workspaceId: workspace.id, name: "Devon Marsh", org: "Pappy & Harriet's", role: "Booker", category: "Venues", city: "Pioneertown, CA", strength: 4, lastContactedAt: daysAgo(8) },
      { workspaceId: workspace.id, name: "Lena Fischer", org: "Sofar Sounds", role: "City curator", category: "Promoters", city: "Chicago, IL", strength: 4, lastContactedAt: daysAgo(1) },
      { workspaceId: workspace.id, name: "Ruth Boone", org: "The Mothlight", role: "Talent buyer", category: "Venues", city: "Asheville, NC", strength: 5, lastContactedAt: daysAgo(4) },
      { workspaceId: workspace.id, name: "Cole Barrett", org: "Fender", role: "Artist relations", category: "Sponsors", city: "Los Angeles, CA", strength: 2, lastContactedAt: daysAgo(15) },
    ],
  });
  console.log(`Seeded ${contacts.count} contacts`);

  const bookings: Array<{
    venue: string; city: string; date: Date; fee: number; contactName: string; contactPhone?: string;
    stage: "Lead" | "Contacted" | "Negotiating" | "Offer_Sent" | "Confirmed" | "Paid";
  }> = [
    { venue: "The Bluebird", city: "Denver, CO", date: new Date("2026-09-12"), fee: 180000, contactName: "J. Reyes", contactPhone: "(303) 555-0142", stage: "Contacted" },
    { venue: "Mississippi Studios", city: "Portland, OR", date: new Date("2026-09-19"), fee: 220000, contactName: "K. Tran", stage: "Lead" },
    { venue: "The Chapel", city: "San Francisco, CA", date: new Date("2026-09-22"), fee: 260000, contactName: "A. Whitfield", stage: "Negotiating" },
    { venue: "Pappy & Harriet's", city: "Pioneertown, CA", date: new Date("2026-09-25"), fee: 200000, contactName: "D. Marsh", stage: "Offer_Sent" },
    { venue: "Valley Bar", city: "Phoenix, AZ", date: new Date("2026-09-27"), fee: 150000, contactName: "S. Ortega", stage: "Lead" },
    { venue: "The Mothlight", city: "Asheville, NC", date: new Date("2026-10-08"), fee: 170000, contactName: "R. Boone", contactPhone: "(828) 555-0187", stage: "Confirmed" },
    { venue: "Eddie's Attic", city: "Decatur, GA", date: new Date("2026-10-10"), fee: 190000, contactName: "M. Klein", stage: "Confirmed" },
    { venue: "Cactus Cafe", city: "Austin, TX", date: new Date("2026-10-14"), fee: 160000, contactName: "P. Nguyen", stage: "Paid" },
    { venue: "Off Broadway", city: "St. Louis, MO", date: new Date("2026-10-17"), fee: 140000, contactName: "T. Abara", stage: "Negotiating" },
  ];
  for (const b of bookings) {
    await db.booking.create({ data: { ...b, workspaceId: workspace.id } });
  }
  console.log(`Seeded ${bookings.length} bookings`);

  const transactions: Array<{ kind: "income" | "expense"; category: string; amount: number; source: string; occurredAt: Date }> = [
    { kind: "income", category: "Performance fees", amount: 1620000, source: "Fall run guarantees", occurredAt: new Date("2025-08-05") },
    { kind: "income", category: "Merchandise", amount: 540000, source: "Merch table + online", occurredAt: new Date("2025-08-20") },
    { kind: "income", category: "Performance fees", amount: 980000, source: "Regional shows", occurredAt: new Date("2025-09-10") },
    { kind: "income", category: "Merchandise", amount: 410000, source: "Merch table + online", occurredAt: new Date("2025-09-25") },
    { kind: "income", category: "Performance fees", amount: 1140000, source: "Winter dates", occurredAt: new Date("2025-11-08") },
    { kind: "income", category: "Merchandise", amount: 470000, source: "Merch table + online", occurredAt: new Date("2025-11-22") },
    { kind: "income", category: "Performance fees", amount: 760000, source: "January residency", occurredAt: new Date("2026-01-15") },
    { kind: "income", category: "Merchandise", amount: 290000, source: "Merch table + online", occurredAt: new Date("2026-01-28") },
    { kind: "income", category: "Performance fees", amount: 890000, source: "February dates", occurredAt: new Date("2026-02-12") },
    { kind: "income", category: "Merchandise", amount: 355000, source: "Merch table + online", occurredAt: new Date("2026-02-24") },
    { kind: "income", category: "Performance fees", amount: 3140000, source: "Spring tour guarantees", occurredAt: new Date("2026-03-01") },
    { kind: "income", category: "Merchandise", amount: 1285000, source: "Merch table + online", occurredAt: new Date("2026-03-15") },
    { kind: "income", category: "Streaming royalties", amount: 421000, source: "Distrokid", occurredAt: new Date("2026-04-01") },
    { kind: "income", category: "Performance fees", amount: 1050000, source: "April dates", occurredAt: new Date("2026-04-10") },
    { kind: "income", category: "Merchandise", amount: 380000, source: "Merch table + online", occurredAt: new Date("2026-04-20") },
    { kind: "income", category: "Teaching / workshops", amount: 360000, source: "Private lessons", occurredAt: new Date("2026-05-01") },
    { kind: "income", category: "Performance fees", amount: 1210000, source: "May dates", occurredAt: new Date("2026-05-14") },
    { kind: "income", category: "Merchandise", amount: 425000, source: "Merch table + online", occurredAt: new Date("2026-05-26") },
    { kind: "income", category: "Sync licensing", amount: 200000, source: "Glass Coast sync", occurredAt: new Date("2026-06-01") },
    { kind: "income", category: "Performance fees", amount: 940000, source: "June dates", occurredAt: new Date("2026-06-08") },
    { kind: "income", category: "Merchandise", amount: 315000, source: "Merch table + online", occurredAt: new Date("2026-06-18") },
    { kind: "expense", category: "Tour expenses", amount: 1834000, source: "Gas, hotels, per diem", occurredAt: new Date("2026-06-15") },
    { kind: "expense", category: "Merch COGS", amount: 492000, source: "Printing + fulfillment", occurredAt: new Date("2026-06-20") },
    { kind: "income", category: "Performance fees", amount: 610000, source: "July dates", occurredAt: new Date("2026-07-05") },
    { kind: "income", category: "Merchandise", amount: 205000, source: "Merch table + online", occurredAt: new Date("2026-07-10") },
    { kind: "expense", category: "Fees & software", amount: 118000, source: "HEADLINER + tools", occurredAt: new Date("2026-07-01") },
  ];
  for (const t of transactions) {
    await db.transaction.create({ data: { ...t, workspaceId: workspace.id } });
  }
  console.log(`Seeded ${transactions.length} transactions`);

  const tourStopsData: Array<{
    date: Date; venue: string; city: string; fee: number; driveMiles: number | null;
    hotel: string; hotelConfNo: string; merchNote: string; perDiemCents: number;
  }> = [
    { date: new Date("2026-07-24T12:00:00Z"), venue: "Fox Cabaret", city: "Vancouver, BC", fee: 160000, driveMiles: null, hotel: "The Burrard, 2 nights", hotelConfNo: "88213", merchNote: "84 units · $1.9k retail", perDiemCents: 4500 },
    { date: new Date("2026-07-26T12:00:00Z"), venue: "Tractor Tavern", city: "Seattle, WA", fee: 180000, driveMiles: 141, hotel: "Ace Hotel Seattle", hotelConfNo: "40217", merchNote: "78 units · $1.7k retail", perDiemCents: 4500 },
    { date: new Date("2026-07-28T12:00:00Z"), venue: "Neurolux", city: "Boise, ID", fee: 120000, driveMiles: 496, hotel: "Modern Hotel", hotelConfNo: "91847", merchNote: "71 units · $1.6k retail", perDiemCents: 4000 },
    { date: new Date("2026-07-30T12:00:00Z"), venue: "Kilby Court", city: "Salt Lake City, UT", fee: 140000, driveMiles: 340, hotel: "Peery Hotel", hotelConfNo: "55692", merchNote: "65 units · $1.4k retail", perDiemCents: 4000 },
    { date: new Date("2026-08-01T12:00:00Z"), venue: "Lost Lake", city: "Denver, CO", fee: 170000, driveMiles: 520, hotel: "Airbnb — Capitol Hill", hotelConfNo: "AB-3391", merchNote: "58 units · $1.3k retail", perDiemCents: 4500 },
    { date: new Date("2026-08-04T12:00:00Z"), venue: "recordBar", city: "Kansas City, MO", fee: 150000, driveMiles: 600, hotel: "Hotel Kansas City", hotelConfNo: "20558", merchNote: "52 units · $1.1k retail", perDiemCents: 4000 },
  ];
  const daySchedule = [
    { time: "14:00", what: "Load-in", who: "Mara + venue crew" },
    { time: "15:30", what: "Soundcheck", who: "House engineer" },
    { time: "17:00", what: "Dinner (venue buyout $25)", who: "" },
    { time: "19:00", what: "Doors", who: "" },
    { time: "20:00", what: "Support: local opener", who: "" },
    { time: "21:00", what: "Mara Voss — 75 min set", who: "" },
    { time: "22:30", what: "Merch table + settle up", who: "" },
  ];

  const tour = await db.tour.create({
    data: {
      workspaceId: workspace.id,
      name: "Low Light Tour",
      startDate: tourStopsData[0].date,
      endDate: new Date("2026-08-30T12:00:00Z"),
    },
  });

  for (const [i, s] of tourStopsData.entries()) {
    const booking = await db.booking.create({
      data: {
        workspaceId: workspace.id,
        venue: s.venue,
        city: s.city,
        date: s.date,
        fee: s.fee,
        stage: "Confirmed",
      },
    });
    await db.tourStop.create({
      data: {
        tourId: tour.id,
        bookingId: booking.id,
        seq: i,
        driveMiles: s.driveMiles,
        hotel: s.hotel,
        hotelConfNo: s.hotelConfNo,
        merchNote: s.merchNote,
        perDiemCents: s.perDiemCents,
        schedule: JSON.stringify(daySchedule),
      },
    });
  }
  console.log(`Seeded 1 tour with ${tourStopsData.length} stops`);

  const merchItems: Array<{ name: string; variant: string; price: number; margin: number; stock: number; maxStock: number; glyph: string; color: string }> = [
    { name: "Low Light Tee", variant: "Black · S–XL", price: 3000, margin: 0.68, stock: 34, maxStock: 60, glyph: "T", color: "#3fe87a" },
    { name: "Low Light LP", variant: "Vinyl · smoke clear", price: 2800, margin: 0.46, stock: 22, maxStock: 40, glyph: "LP", color: "#e8e43f" },
    { name: "Tour poster", variant: "18×24 screenprint", price: 1500, margin: 0.81, stock: 7, maxStock: 50, glyph: "P", color: "#e8983f" },
    { name: "Hoodie", variant: "Forest · M–XL", price: 5500, margin: 0.52, stock: 11, maxStock: 24, glyph: "H", color: "#7ab8e8" },
    { name: "Sticker pack", variant: "3-pack", price: 600, margin: 0.88, stock: 96, maxStock: 120, glyph: "S", color: "#c99df5" },
    { name: "Songbook", variant: "Tabs + lyrics, signed", price: 2200, margin: 0.64, stock: 14, maxStock: 25, glyph: "B", color: "#e87a9a" },
  ];
  await db.merchItem.createMany({
    data: merchItems.map((m) => ({
      workspaceId: workspace.id,
      name: m.name,
      variant: m.variant,
      price: m.price,
      cogs: Math.round(m.price * (1 - m.margin)),
      stock: m.stock,
      maxStock: m.maxStock,
      glyph: m.glyph,
      color: m.color,
    })),
  });
  console.log(`Seeded ${merchItems.length} merch items`);

  await db.contract.createMany({
    data: [
      { workspaceId: workspace.id, name: "Performance agreement — The Mothlight", kind: "Performance", counterparty: "R. Boone", value: "$1,700", status: "SIGNED", signedDate: new Date("2026-06-20") },
      { workspaceId: workspace.id, name: "Performance agreement — Eddie's Attic", kind: "Performance", counterparty: "M. Klein", value: "$1,900", status: "SIGNED", signedDate: new Date("2026-06-22") },
      { workspaceId: workspace.id, name: "Offer — Pappy & Harriet's", kind: "Performance", counterparty: "D. Marsh", value: "$2,000", status: "AWAITING_SIGN" },
      { workspaceId: workspace.id, name: "Fender artist sponsorship", kind: "Sponsorship", counterparty: "C. Barrett", value: "$4,800/yr", status: "ACTIVE", renewsAt: new Date("2027-01-01") },
      { workspaceId: workspace.id, name: 'Sync license — "Glass Coast"', kind: "Licensing", counterparty: "Indie film co.", value: "$2,000", status: "ACTIVE", renewsAt: daysFromNow(90) },
      { workspaceId: workspace.id, name: "Liability insurance", kind: "Insurance", counterparty: "TourGuard", value: "$1,200/yr", status: "ACTIVE", renewsAt: daysFromNow(31) },
      { workspaceId: workspace.id, name: "Session player agreement", kind: "Work-for-hire", counterparty: "J. Osei", value: "$150/show", status: "DRAFT" },
    ],
  });
  console.log("Seeded 7 contracts");

  await db.fan.createMany({
    data: [
      { workspaceId: workspace.id, name: "Dana Okafor", tier: "VIP", tierNote: "Patreon $25/mo", lifetimeSpend: 124000, showsAttended: 14, lastSeenLabel: "Vancouver, Jul 24", notes: "Always front row; brings friends" },
      { workspaceId: workspace.id, name: "Theo Lindqvist", tier: "Patron", tierNote: "$10/mo", lifetimeSpend: 68000, showsAttended: 8, lastSeenLabel: "Seattle, Mar 12", notes: 'Requested "Glass Coast" twice' },
      { workspaceId: workspace.id, name: "Rosa Delgado", tier: "VIP", tierNote: "house show host", lifetimeSpend: 92500, showsAttended: 11, lastSeenLabel: "Denver, Feb 02", notes: "Hosted 2 living-room shows" },
      { workspaceId: workspace.id, name: "Ben Whitaker", tier: "Donor", tierNote: null, lifetimeSpend: 50000, showsAttended: 3, lastSeenLabel: "Portland, Jan 18", notes: "Funded music video" },
      { workspaceId: workspace.id, name: "Aiko Tanaka", tier: "Patron", tierNote: "$5/mo", lifetimeSpend: 31000, showsAttended: 6, lastSeenLabel: "Seattle, Mar 12", notes: "Runs fan Discord" },
      { workspaceId: workspace.id, name: "Grace Munro", tier: "VIP", tierNote: null, lifetimeSpend: 86000, showsAttended: 9, lastSeenLabel: "Boise, Nov 21", notes: "Buys vinyl every release" },
    ],
  });
  console.log("Seeded 6 fans");

  await db.campaign.createMany({
    data: [
      { workspaceId: workspace.id, name: "Low Light Tour on sale", audienceLabel: "Full list", sentAt: new Date("2026-06-30"), openRate: 0.52, clickRate: 0.19, revenue: 384000 },
      { workspaceId: workspace.id, name: "Seattle — 20 tickets left", audienceLabel: "Seattle metro (388)", sentAt: new Date("2026-07-12"), openRate: 0.61, clickRate: 0.27, revenue: 92000 },
      { workspaceId: workspace.id, name: "Smoke-clear vinyl restock", audienceLabel: "Past buyers (912)", sentAt: new Date("2026-07-02"), openRate: 0.48, clickRate: 0.22, revenue: 141000 },
      { workspaceId: workspace.id, name: "June patron update", audienceLabel: "Patrons (62)", sentAt: new Date("2026-06-28"), openRate: 0.84, clickRate: 0.31, revenue: null },
    ],
  });
  console.log("Seeded 4 campaigns");

  await db.automation.createMany({
    data: [
      { workspaceId: workspace.id, key: "city", name: "New city announcement", trigger: "Show confirmed → subscribers within 50 mi", enabled: true },
      { workspaceId: workspace.id, key: "reminder", name: "Ticket reminder", trigger: "3 days before show → non-buyers nearby", enabled: true },
      { workspaceId: workspace.id, key: "merch", name: "Merch drop", trigger: "New item in inventory → past buyers", enabled: false },
      { workspaceId: workspace.id, key: "bday", name: "Birthday note", trigger: "Fan birthday → personal template", enabled: false },
      { workspaceId: workspace.id, key: "vip", name: "VIP pre-sale invite", trigger: "On-sale minus 48h → VIPs in market", enabled: true },
    ],
  });
  console.log("Seeded 5 automations");

  await db.task.createMany({
    data: [
      { workspaceId: workspace.id, title: "Send W-9 to Fox Cabaret", dueLabel: "today", done: false },
      { workspaceId: workspace.id, title: "Advance Denver show (backline)", dueLabel: "Jul 23", done: false },
      { workspaceId: workspace.id, title: "Order tour poster restock", dueLabel: "Jul 25", done: false },
      { workspaceId: workspace.id, title: "Confirm hotel in Boise", dueLabel: "Jul 26", done: true },
      { workspaceId: workspace.id, title: "Post ticket link — Salt Lake", dueLabel: "Jul 28", done: false },
    ],
  });
  console.log("Seeded 5 tasks");

  console.log("\nDemo login: jamil@headliner.demo / password123");
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function createOrReuseDemoUser(): Promise<string> {
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: "Mara Voss" },
  });
  if (created?.user) return created.user.id;

  // Demo user already exists from a previous seed run — look it up and
  // reset the password so DEMO_PASSWORD keeps working across reseeds.
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email === DEMO_EMAIL);
  if (!existing) throw error ?? new Error("Could not create or find the demo user.");

  await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD });
  return existing.id;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
