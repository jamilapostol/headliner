/**
 * THE ARTIST OPERATOR — product catalogue
 * Single source of truth for every product page, the store grid, bundle math,
 * the sitemap, and the checkout. Add a product here and its page exists.
 *
 * Cover images live at /public/covers/<slug>.jpg (1000px wide, provided).
 * Files live in private storage — never expose a public URL to a paid file.
 */

export type Product = {
  slug: string;
  title: string;
  subtitle: string;
  /** one line, used on cards and meta descriptions */
  short: string;
  /** 2–3 sentences, used at the top of the product page */
  long: string;
  /** "what's inside" — 3–5 bullets */
  inside: string[];
  /** who it's for — one sentence, used above the buy button */
  forWho: string;
  price: number;
  /** Stripe Price ID — fill in after creating the product in Stripe */
  stripePriceId?: string;
  /**
   * Stripe product tax code. REQUIRED for Managed Payments.
   *   txcd_10302000 — Digital Books, downloaded, permanent rights   (the book, the Playbook)
   *   txcd_10503000 — Digital other documents, downloaded, permanent rights  (the packs)
   *   txcd_10202001 — Downloadable software, non-recreational, personal  (the spreadsheet)
   * Confirm the mapping with an accountant before going live.
   */
  taxCode: string;
  pages: number;
  format: 'PDF' | 'XLSX' | 'BUNDLE' | 'MULTI';
  cover: string;
  /** file(s) delivered on purchase, relative to private storage root */
  files: string[];
  /** interest tag applied to the buyer in the email list */
  tag: string;
  /** which book chapters it extends */
  chapters: string;
  featured?: boolean;
};

/* ------------------------------------------------------------------ */
/* PAID PACKS                                                          */
/* ------------------------------------------------------------------ */

export const PACKS: Product[] = [
  {
    slug: 'six-jobs-audit',
    title: 'The Six Jobs Audit',
    subtitle: 'Find the Job You Are Neglecting Before It Finds You',
    short: 'Score all six departments of your career from evidence, not mood.',
    long:
      'Every music career runs six jobs — create, build, distribute, connect, monetize, serve — whether you run them on purpose or by neglect. This is the full diagnostic: twenty-four prompts, a five-point score for each job, and an honest picture of which department is quietly costing you the most.',
    inside: [
      '24 audit prompts across the six jobs',
      'A five-point scoring system with evidence requirements',
      'The weakest-job worksheet and what to do about it',
      'A re-score page for six months from now',
    ],
    forWho: 'Anyone who suspects one part of their career is dragging the rest down but cannot name which.',
    price: 17,
    stripePriceId: 'price_1U6chOCTmlS1aGsbb5LwOxUw',
    taxCode: 'txcd_10503000',
    pages: 15,
    format: 'PDF',
    cover: '/covers/six-jobs-audit.jpg',
    files: ['The-Six-Jobs-Audit.pdf'],
    tag: 'int:diagnostics',
    chapters: 'Chapters 6–10',
    featured: true,
  },
  {
    slug: '50-prompts',
    title: '50 Prompts Every Artist Operator Should Use',
    subtitle: 'Copy, Paste, Fill in the Blanks',
    short: 'Fifty working AI prompts for the parts of the job that are not the art.',
    long:
      'Fifty prompts, written out in full, for the administrative half of a music career — pitches, plans, contracts, budgets, bios, tour logistics. Each one is built to be pasted straight into any AI assistant with your details swapped in, and each is tied to the chapter it comes from.',
    inside: [
      '50 complete, copy-paste prompts organised by job',
      'Bracketed fields so you swap in your own details',
      'Chapter references back to the book',
      'The rules for what never gets handed to a machine',
    ],
    forWho: 'Artists who know AI could take work off their plate but freeze at the blank prompt box.',
    price: 17,
    stripePriceId: 'price_1U6chPCTmlS1aGsbLiIxDVl7',
    taxCode: 'txcd_10503000',
    pages: 15,
    format: 'PDF',
    cover: '/covers/50-prompts.jpg',
    files: ['50-Prompts-Every-Artist-Operator-Should-Use.pdf'],
    tag: 'int:ai',
    chapters: 'Part III',
    featured: true,
  },
  {
    slug: 'ai-leverage-ladder',
    title: 'The AI Leverage Ladder',
    subtitle: 'Five Rungs from First Prompt to a Career That Runs Itself',
    short: 'The five rungs of delegation, and exactly where to stop climbing.',
    long:
      'Handing work to a machine is not one decision; it is five, and they escalate. This pack lays out the five rungs — from asking questions to running whole workflows — with a practical test for which rung you are on and the never-automate rules that stop the climb before it costs you the thing that makes you worth listening to.',
    inside: [
      'The five rungs, with a self-assessment for each',
      'What to hand over at every level, and what to keep',
      'The four never-automate rules',
      'A ninety-day climbing plan',
    ],
    forWho: 'Artists who want the leverage without quietly automating away the reason anyone listens.',
    price: 19,
    stripePriceId: 'price_1U6chPCTmlS1aGsbAdrREHpR',
    taxCode: 'txcd_10503000',
    pages: 13,
    format: 'PDF',
    cover: '/covers/ai-leverage-ladder.jpg',
    files: ['The-AI-Leverage-Ladder.pdf'],
    tag: 'int:ai',
    chapters: 'Chapters 11–15',
    featured: true,
  },
  {
    slug: 'money-year',
    title: "The Artist's Money Year",
    subtitle: 'Twelve Lumpy Months, Four Accounts, One Salary You Can Live On',
    short: 'Turn income that arrives like weather into a salary that arrives like a paycheck.',
    long:
      "An artist's income does not arrive in a line; it arrives in lumps. Festival season floods August, winter is a desert, and the van needs a transmission somewhere in between. This workbook runs the whole year on four accounts, one fixed salary, a map of the lumps drawn in advance, and four honest quarterly closes.",
    inside: [
      'The four-account split, with percentages you set once',
      'A twelve-month income map with fat/lean flagging',
      'Fat-month and lean-month protocols, decided while you are calm',
      'Quarterly and annual close worksheets',
      'Three AI prompt sessions for the whole system',
    ],
    forWho: 'Anyone who has had a great August and a frightening February.',
    price: 19,
    stripePriceId: 'price_1U6chQCTmlS1aGsb7tDdoxmf',
    taxCode: 'txcd_10503000',
    pages: 11,
    format: 'PDF',
    cover: '/covers/money-year.jpg',
    files: ['The-Artists-Money-Year.pdf'],
    tag: 'int:money',
    chapters: 'Chapters 22–26',
    featured: true,
  },
  {
    slug: '30-day-sprint',
    title: 'The 30-Day Operator Sprint',
    subtitle: 'One Job. Thirty Days. The Lowest Score Gets the Focus.',
    short: 'Four weeks aimed at the one job your audit says is weakest.',
    long:
      'Scores do not improve because you noticed them. This is the fix: a four-week sprint pointed at your lowest-scoring job, with a focus menu for each of the six and a daily structure small enough to survive a working life on the road.',
    inside: [
      'A four-week sprint structure with weekly gates',
      'Focus menus for all six jobs',
      'Daily actions sized for touring life',
      'The end-of-sprint re-score',
    ],
    forWho: 'Artists who have run the audit and want to move one number.',
    price: 17,
    stripePriceId: 'price_1U6chQCTmlS1aGsb2KsYFWr5',
    taxCode: 'txcd_10503000',
    pages: 11,
    format: 'PDF',
    cover: '/covers/30-day-sprint.jpg',
    files: ['The-30-Day-Operator-Sprint.pdf'],
    tag: 'int:diagnostics',
    chapters: 'Part II',
  },
  {
    slug: 'direct-line',
    title: 'Direct Line',
    subtitle: 'Build Your Email List from Zero in Thirty Days Flat',
    short: 'Thirty days, one action a day, to a channel no platform can repossess.',
    long:
      'Every follower you have lives on rented land. This is the thirty-day sprint that builds the one channel that is actually yours: week one builds the machine, week two does the uncomfortable personal work that seeds it, week three teaches the list why it joined, week four turns it into a system that runs without heroics.',
    inside: [
      '30 daily actions, most under thirty minutes',
      'A thirty-box tracker and three counting days',
      'The capture map — where names actually come from',
      'Three AI prompt sessions, including the founding-fifty excavator',
    ],
    forWho: 'Artists with an audience they cannot reach without asking a platform first.',
    price: 17,
    stripePriceId: 'price_1U6chRCTmlS1aGsbpvH2SHoI',
    taxCode: 'txcd_10503000',
    pages: 10,
    format: 'PDF',
    cover: '/covers/direct-line.jpg',
    files: ['Direct-Line.pdf'],
    tag: 'int:fans',
    chapters: 'Chapters 16–21',
    featured: true,
  },
  {
    slug: 'email-swipe-file',
    title: 'The Email Swipe File',
    subtitle: '25 Emails Every Artist Operator Should Send — Written for You',
    short: 'Twenty-five complete emails, subject lines included, brackets where your life goes.',
    long:
      'Every email written out in full — welcome sequences, release announcements, tour and city emails, merch and crowdfunding asks, promoter pitches, settlement thank-yous. Replace every bracket with something true and specific, delete one sentence, send.',
    inside: [
      '25 complete emails across five categories',
      'Subject lines for every one',
      'A make-it-yours box on each page',
      'The rules that keep these sounding like a human',
    ],
    forWho: 'Anyone who has stared at an empty draft to a promoter for twenty minutes.',
    price: 14,
    stripePriceId: 'price_1U6chSCTmlS1aGsbfcqmGBuE',
    taxCode: 'txcd_10503000',
    pages: 28,
    format: 'PDF',
    cover: '/covers/email-swipe-file.jpg',
    files: ['The-Email-Swipe-File.pdf'],
    tag: 'int:fans',
    chapters: 'Chapters 16–21',
  },
  {
    slug: 'merch-math',
    title: 'Merch Math for Musicians',
    subtitle: 'Unit Economics, Pricing, Nightly Counts and the Break-Even Point',
    short: 'The table is a store. This is its arithmetic.',
    long:
      'For most independent artists the merch table out-earns the door — and most run it with no numbers at all. Four pieces of math fix that: true unit economics, the break-even point before you order, per-head forecasting so you buy for the tour you booked, and the nightly count that turns all of it into money that actually arrives.',
    inside: [
      'Item cards: true cost, profit per unit, break-even units, markup',
      'Pricing rules of thumb and the size curve',
      'Per-head forecasting bands by room type',
      'Nightly count sheets and the reorder verdict',
    ],
    forWho: 'Anyone with a closet full of larges and no idea how it happened.',
    price: 14,
    stripePriceId: 'price_1U6chSCTmlS1aGsbSJLOi6pL',
    taxCode: 'txcd_10503000',
    pages: 11,
    format: 'PDF',
    cover: '/covers/merch-math.jpg',
    files: ['Merch-Math-for-Musicians.pdf'],
    tag: 'int:merch',
    chapters: 'Chapters 22–26',
  },
  {
    slug: 'operators-week',
    title: "The Operator's Week",
    subtitle: 'The Artist Operating System, One Week at a Time',
    short: 'Six stages of the loop, on a weekly schedule that survives touring.',
    long:
      'The operating loop — create, capture, distribute, connect, monetize, repeat — only works if it turns. This is the weekly structure that keeps it turning, with a review protocol and a counter for what each cycle actually deposited.',
    inside: [
      'The six stages on a weekly schedule',
      'The weekly review protocol',
      'A turn counter for assets deposited per cycle',
      'What to do in a week that falls apart',
    ],
    forWho: 'Artists whose good intentions keep dying somewhere around Wednesday.',
    price: 14,
    stripePriceId: 'price_1U6chTCTmlS1aGsbZ3mWBtQC',
    taxCode: 'txcd_10503000',
    pages: 12,
    format: 'PDF',
    cover: '/covers/operators-week.jpg',
    files: ['The-Operators-Week.pdf'],
    tag: 'int:systems',
    chapters: 'Part II',
  },
  {
    slug: 'five-artist-assets',
    title: 'The Five Artist Assets',
    subtitle: 'The Balance Sheet Behind Every Career That Survives Its Own Luck',
    short: 'The five things that compound, and whether you are actually depositing into them.',
    long:
      'Talent, audience, relationships, intellectual property, reputation. These are the five accounts a career actually runs on, and most artists have never once checked the balances. This pack turns them into a balance sheet with a deposit filter and a quarterly re-score.',
    inside: [
      'The five assets defined, with what counts as a deposit',
      'The Deposit Filter for evaluating opportunities',
      'An evidence inventory for each asset',
      'Quarterly re-score pages',
    ],
    forWho: 'Artists who are busy but cannot tell whether the busyness is building anything.',
    price: 14,
    stripePriceId: 'price_1U6chUCTmlS1aGsbURWiiufq',
    taxCode: 'txcd_10503000',
    pages: 15,
    format: 'PDF',
    cover: '/covers/five-artist-assets.jpg',
    files: ['The-Five-Artist-Assets-Balance-Sheet.pdf'],
    tag: 'int:systems',
    chapters: 'Chapters 22–26',
  },
  {
    slug: 'what-stays-human',
    title: 'What Stays Human',
    subtitle: 'The Not-Doing List and the Artist Moat Inventory',
    short: 'Two lists that decide what never gets handed over.',
    long:
      'The counterweight to every other pack in the series. The Not-Doing List is the good, available, tempting things you are formally declining this season — signed. The Artist Moat is the ten advantages that cannot be downloaded, each scored the only way allowed: one piece of concrete evidence from the last twelve months.',
    inside: [
      'The four never-automate rules',
      'The Not-Doing List, with a season and a signature line',
      'The ten-item Artist Moat inventory',
      'The evidence standard — a name, a date, a room',
    ],
    forWho: 'Artists who can feel the machines closing in and want to know what is actually theirs.',
    price: 14,
    stripePriceId: 'price_1U6chUCTmlS1aGsbk7fmHOhO',
    taxCode: 'txcd_10503000',
    pages: 9,
    format: 'PDF',
    cover: '/covers/what-stays-human.jpg',
    files: ['What-Stays-Human.pdf'],
    tag: 'int:craft',
    chapters: 'Chapters 15, 16, 31',
  },
  {
    slug: 'retreat-playbook',
    title: 'The Retreat Playbook',
    subtitle: 'Design, Budget, Fill and Run a Small Retreat That Actually Pays',
    short: 'Fifteen people at $1,200 is a season of income. Here is the math and the arc.',
    long:
      'A retreat is the highest-ticket thing most artists will ever sell, and often easier to fill than a $15 show — because you are not selling a night out, you are selling a turning point. This covers the three honest formats, the budget page with break-even in heads, the sixteen-week fill timeline, and the five-phase container.',
    inside: [
      'Three formats: day gathering, weekend, immersion',
      'A full budget page with break-even and margin',
      'The sixteen-week timeline and the interest-list gate',
      'The five-phase container design',
    ],
    forWho: 'Artists and facilitators who want to run a room, not just play one.',
    price: 12,
    stripePriceId: 'price_1U6chVCTmlS1aGsbmmadzXHc',
    taxCode: 'txcd_10503000',
    pages: 8,
    format: 'PDF',
    cover: '/covers/retreat-playbook.jpg',
    files: ['The-Retreat-Playbook.pdf'],
    tag: 'int:teaching',
    chapters: 'Parts V–VI',
  },
  {
    slug: 'playbook',
    title: 'The Artist Operator Playbook',
    subtitle: "The Workbook — Every Chapter's Playbook, in Your Own Hand",
    short: 'All thirty-five chapters as worksheets, with room to write.',
    long:
      'Every chapter of the book ends with a playbook. This is those playbooks with space to answer them: forty-five pages, seven part dividers, three questions, an exercise, an action, an automation, a never-automate line and a metric per chapter. Read the chapter, then take its page while the argument is still warm.',
    inside: [
      'All 35 chapters as write-in worksheets',
      'Seven part dividers with the book’s epigraphs',
      'Journal pages for the four human chapters and the manifesto',
      'A re-run instruction for one year from now',
    ],
    forWho: 'Readers who want the book to change something rather than just be agreed with.',
    price: 14.99,
    stripePriceId: 'price_1U6chVCTmlS1aGsbTPKPuwYR',
    taxCode: 'txcd_10302000',
    pages: 45,
    format: 'PDF',
    cover: '/covers/playbook.jpg',
    files: ['The-Artist-Operator-Playbook.pdf'],
    tag: 'int:systems',
    chapters: 'All 35',
    featured: true,
  },
  {
    slug: 'contract-vault',
    title: "The Artist's Contract Vault",
    subtitle: 'Eight Editable Templates — Read the Guide First',
    short: 'Eight music contracts, in Word, with guidance at the clauses deals die on.',
    long:
      'Performance agreements, deal memos, band partnerships, split sheets, session work-for-hire, merch collaborations, tour cost-sharing and support slots. Every template is editable, with bracketed fields for your deal and gold guidance notes exactly where independent artists get hurt. Paper is not distrust; paper is memory.',
    inside: [
      '8 editable .docx templates',
      'A branded guide covering the rules of paper',
      'Guidance notes at every clause that matters',
      'Plain language throughout — no Latin, no ambush',
    ],
    forWho: 'Anyone whose last three shows were confirmed in a text thread.',
    price: 59,
    stripePriceId: 'price_1U6chWCTmlS1aGsbxj3mp6Ro',
    taxCode: 'txcd_10503000',
    pages: 9,
    format: 'MULTI',
    cover: '/covers/contract-vault.jpg',
    files: ['vault/The-Artists-Contract-Vault.zip'],
    tag: 'int:contracts',
    chapters: 'Chapters 19–21',
    featured: true,
  },
];

/* ------------------------------------------------------------------ */
/* BUNDLES — price these so the bundle is obviously the right choice   */
/* ------------------------------------------------------------------ */

export const BUNDLES = [
  {
    slug: 'operators-vault',
    title: "The Operator's Vault",
    subtitle: 'All Thirteen Packs',
    short: 'Every PDF pack in the series, at less than half the à-la-carte price.',
    long:
      'Thirteen packs covering all six jobs — the audit that finds the weak one, the sprint that fixes it, the week that keeps it turning, the AI packs that put a team behind it, the money and merch math, the list-building sprint, and the two lists that decide what never gets automated.',
    includes: PACKS.filter((p) => p.slug !== 'contract-vault').map((p) => p.slug),
    price: 89,
    stripePriceId: 'price_1U6chWCTmlS1aGsbPTAn4Hfb',
    taxCode: 'txcd_10503000',
    files: ['bundles/The-Operators-Vault.zip'],
    cover: '/covers/six-jobs-audit.jpg',
    tag: 'own:vault',
    featured: true,
  },
  {
    slug: 'complete-library',
    title: 'The Complete Library',
    subtitle: 'Everything, Including the Contract Vault',
    short: 'All thirteen packs plus the eight contract templates.',
    long:
      'The whole system: every pack in the series, the Playbook workbook, and the Contract Vault’s eight editable agreements with their guide. Everything the book points at, in one download.',
    includes: PACKS.map((p) => p.slug),
    price: 129,
    stripePriceId: 'price_1U6chXCTmlS1aGsbntt8LELc',
    taxCode: 'txcd_10503000',
    files: ['bundles/The-Complete-Library.zip'],
    cover: '/covers/contract-vault.jpg',
    tag: 'own:library',
  },
];

/** à-la-carte total for a bundle — render this next to the price as the anchor */
export const bundleListPrice = (slug: string) => {
  const b = BUNDLES.find((x) => x.slug === slug);
  if (!b) return 0;
  return b.includes.reduce((sum, s) => sum + (PACKS.find((p) => p.slug === s)?.price ?? 0), 0);
};

/* ------------------------------------------------------------------ */
/* FREE TOOLS — email required, delivered by email + instant download  */
/* ------------------------------------------------------------------ */

export type FreeTool = {
  slug: string;
  title: string;
  subtitle: string;
  short: string;
  long: string;
  inside: string[];
  pages: number;
  format: 'PDF' | 'XLSX';
  cover: string;
  file: string;
  /** tags applied on subscribe */
  tags: string[];
  /** the paid product this tool naturally leads to */
  upsell: string;
  /** the app feature this tool is the paper version of, if any */
  appBridge?: string;
};

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: 'booking-pipeline',
    title: 'The Booking Pipeline Tracker',
    subtitle: 'Five Stages Between "Maybe" and Money in Writing',
    short: 'Every prospect on one page, at exactly one stage, moved forward once a week.',
    long:
      'Booking dies in the follow-up, and the follow-up dies in your memory. This is the fix on paper: five stages from prospect to settled, a thirteen-row tracker, and one weekly booking block where every row moves one action forward.',
    inside: [
      'The five stages defined, with the rules that make them mean something',
      'Two printable tracker pages, thirteen rows each',
      'The weekly booking-block routine',
    ],
    pages: 5,
    format: 'PDF',
    cover: '/covers/booking-pipeline.jpg',
    file: 'The-Booking-Pipeline-Tracker.pdf',
    tags: ['src:free-pipeline', 'int:touring'],
    upsell: 'six-jobs-audit',
    appBridge: 'This is the paper version of what Headline.world does automatically.',
  },
  {
    slug: 'tour-checklist',
    title: 'The Tour Planning Checklist',
    subtitle: 'Five Phases, Twenty-Five Boxes, Zero Forgotten Load-Ins',
    short: 'Every decision a tour needs, front-loaded instead of made at the last minute.',
    long:
      'A tour is not a trip; it is a project with a budget, a schedule and about two hundred small decisions that all want to be made at the last minute. Five phases from sixteen weeks out to the week after, five boxes each, every one written to be checked once, in writing.',
    inside: [
      'Five phases from routing to the post-tour debrief',
      '25 checkboxes, each a decision you only make once',
      'A notes block per phase',
    ],
    pages: 8,
    format: 'PDF',
    cover: '/covers/tour-checklist.jpg',
    file: 'The-Tour-Planning-Checklist.pdf',
    tags: ['src:free-checklist', 'int:touring'],
    upsell: 'operators-week',
    appBridge: 'Headline.world turns this checklist into advances, day sheets and settlements.',
  },
  {
    slug: 'monthly-check-in',
    title: 'The Monthly Operator Check-In',
    subtitle: 'Six Gauges, One Page a Month, No Lying to Yourself',
    short: 'Fifteen minutes a month to catch a career drifting before it has drifted.',
    long:
      'The small, fast sibling of the full Six Jobs Audit. Six scores, one highlight, one number, on the same day every month. The scores matter less than the trend, and the trend matters less than the habit of looking.',
    inside: [
      'The six jobs with an evidence standard for each',
      'Two check-in sheets — print twelve for a year',
      'The trend check against last month',
    ],
    pages: 5,
    format: 'PDF',
    cover: '/covers/monthly-check-in.jpg',
    file: 'The-Monthly-Operator-Check-In.pdf',
    tags: ['src:free-monthly', 'int:diagnostics'],
    upsell: 'six-jobs-audit',
  },
  {
    slug: 'budget-spreadsheet',
    title: 'The Artist Budget Spreadsheet',
    subtitle: 'Four Accounts, Twelve Months, One Salary You Can Live On',
    short: 'A working spreadsheet that splits every dollar and runs your war chest forward.',
    long:
      'Six live sheets: the four-account split, a twelve-month year map that flags fat and lean months automatically, a show tracker that settles each night, merch item cards with break-even math, and a dashboard that tells you your runway in months. Every formula is built and working.',
    inside: [
      'The Split — set your four percentages once',
      'Year Map — twelve months, auto-flagged fat or lean',
      'Show Tracker and Merch Items with live break-even math',
      'Dashboard — runway in months, salary covered or not',
    ],
    pages: 6,
    format: 'XLSX',
    cover: '/covers/budget-spreadsheet.jpg',
    file: 'The-Artist-Budget-Spreadsheet.xlsx',
    tags: ['src:free-budget', 'int:money'],
    upsell: 'money-year',
  },
];

/* ------------------------------------------------------------------ */
/* THE BOOK + EDUCATOR ASSET                                           */
/* ------------------------------------------------------------------ */

export const BOOK = {
  slug: 'book',
  title: 'The Artist Operator',
  subtitle: 'How Musicians Win in the Age of AI, and Why the Future Still Belongs to Humans',
  author: 'Jamil Apostol',
  pages: 309,
  cover: '/covers/book.jpg',
  hook: 'Nobody is coming to save you. That is the good news.',
  short:
    'The gatekeepers are gone. Every job they used to do — distribution, marketing, audience, admin, money — landed on you, and nobody ever taught you how to do any of it.',
  formats: [
    { name: 'Ebook', price: 9.99, where: 'Amazon Kindle', url: '#' },
    { name: 'Paperback', price: 22.99, where: 'Amazon', url: '#' },
    { name: 'Hardcover', price: 32.99, where: 'Amazon', url: '#' },
    { name: 'Audiobook', price: 19.95, where: 'Audible', url: '#' },
  ],
  /** the gated sample — same capture mechanism as the free tools */
  sample: { file: 'sample-chapter.pdf', tags: ['src:sample-chapter', 'int:book'] },
};

export const EDUCATOR_ASSET = {
  slug: 'curriculum',
  title: 'Teaching The Artist Operator',
  subtitle: 'A Twelve-Week Curriculum for Music Schools and Artist Development Programs',
  short: 'Week-by-week plans, assessments, and licensing terms — free for educators.',
  cover: '/covers/curriculum.jpg',
  file: 'Teaching-The-Artist-Operator.pdf',
  tags: ['src:educator', 'int:teaching'],
};

/**
 * Public URL for a free tool's file.
 *
 * `file` holds a bare filename while `cover` holds a rooted path, so the
 * two are not interchangeable. The free files ship in /public/downloads,
 * and resolving that here keeps the convention in the catalogue rather than
 * hard-coded in every route and page that links to one.
 */
export const freeDownloadUrl = (file: string) => `/downloads/${file}`;

export const ALL_PAID = [...PACKS];
export const bySlug = (slug: string) => PACKS.find((p) => p.slug === slug);
export const freeBySlug = (slug: string) => FREE_TOOLS.find((p) => p.slug === slug);
