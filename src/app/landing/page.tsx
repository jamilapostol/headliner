import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LandingPricing } from "@/components/landing-pricing";
import { BENEFITS, FEATURES } from "@/lib/landing-content";
import { PhotoBleedHero, PhotoBleedBand, RoadPhotoStrip, HERO_PHOTO, SOUNDCHECK_PHOTO, CROWD_PHOTO } from "@/components/marketing-photos";
import { isPagePublic } from "@/lib/web-pages";
import { ComingSoon } from "@/components/coming-soon";

export async function generateMetadata(): Promise<Metadata> {
  if (!(await isPagePublic("landing"))) return { title: "HEADLINE.WORLD" };
  return {
    title: "HEADLINE.WORLD — Run Your Business Like You Run a Soundcheck",
    description: "Bookings, routing, contracts, merch and money — all in one place, so the only thing you're managing from the green room is the set.",
  };
}

const FAQS = [
  { q: "Do I need to migrate anything to start?", a: "No. Free gets you 5 active bookings and 50 contacts to try it on real, current work before you commit to anything." },
  { q: "Is this only for full touring acts, or also local gigging bands?", a: "Both. Pro Artist is built for artists gigging regularly without a full tour underway. Touring Artist adds routing, day sheets and contracts for artists on the road." },
  { q: "What does Roadie AI actually do?", a: "It drafts follow-up emails, summarizes contracts, flags radius clauses, and predicts which cities are worth booking based on your history. It's a drafting and flagging tool — you're still the one deciding." },
  { q: "Can my band or crew use it with me?", a: "Yes. Touring Artist includes 3 team seats, Management Team includes 10." },
  { q: "What happens to my data if I stop paying, or want to leave?", a: "Your contacts, your contracts, your history — it's yours, and it's not held hostage behind a paywall the moment you downgrade." },
];

export default async function LandingPage() {
  if (!(await isPagePublic("landing"))) return <ComingSoon />;

  return (
    <div className="bg-canvas text-text">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 py-3.5">
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.svg" alt="HEADLINE.WORLD" width={26} height={26} />
              <span className="text-[15px] font-bold tracking-[-.01em]">HEADLINE.WORLD</span>
            </div>
            <span className="hidden text-[10.5px] tracking-[.04em] text-muted/70 sm:block">— Book it. Run it. Own it.</span>
          </div>
          <Link href="/signup" className="rounded-card bg-accent px-4.5 py-2.5 text-[14px] font-semibold text-ink">
            Start free
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="px-6 pb-14 pt-16 text-center sm:pt-20">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-3.5 font-sans text-[11px] tracking-[.16em] text-accent">FOR INDEPENDENT TOURING MUSICIANS</div>
          <h1 className="mb-4.5 text-[32px] leading-[1.1] tracking-[-.03em] text-balance sm:text-[46px]">
            Run your business
            <br />
            like you run a <span className="text-accent">soundcheck.</span>
          </h1>
          <p className="mx-auto mb-7 max-w-[560px] text-[17px] text-muted text-balance">
            Bookings, routing, contracts, merch and money — all in one place, so the only thing you&apos;re managing from the green room is the set.
          </p>
          <div className="mb-3.5 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className="rounded-tile bg-accent px-8 py-4 text-[16px] font-semibold text-ink">
              Start free
            </Link>
            <a href="#benefits" className="rounded-tile border border-border px-8 py-4 text-[16px] font-semibold">
              Keep reading ↓
            </a>
          </div>
          <div className="font-sans text-[11.5px] text-muted/70">Free forever for your first 5 bookings · No card required</div>
        </div>
      </section>

      <PhotoBleedHero {...HERO_PHOTO} />
      <PhotoBleedBand {...SOUNDCHECK_PHOTO} />

      {/* benefits */}
      <section id="benefits" className="px-6 py-16">
        <div className="mx-auto max-w-[980px]">
          <div className="mx-auto mb-8.5 max-w-[540px] text-center">
            <div className="mb-2.5 font-sans text-[11px] tracking-[.16em] text-accent">HOW IT FEELS</div>
            <h2 className="mb-2.5 text-[26px] tracking-[-.02em] text-balance sm:text-[30px]">Less noise in your head. More room for the music.</h2>
            <p className="text-[15px] text-muted">This isn&apos;t just about the admin getting done. It&apos;s about what&apos;s left over when it is.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-tile border border-border bg-surface p-5.5">
                <h3 className="mb-2 text-[15.5px] font-semibold">{b.title}</h3>
                <p className="text-[13.5px] leading-[1.65] text-muted">{b.body}</p>
              </div>
            ))}
            <div className="rounded-tile border border-border bg-surface p-5.5 sm:col-span-2">
              <h3 className="mb-2 text-[15.5px] font-semibold">You can finally see the whole picture.</h3>
              <p className="text-[13.5px] leading-[1.65] text-muted">Every tour, every fan, every dollar — in one place instead of scattered across your phone, your notes app, and a dozen group texts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-y border-border bg-surface-nested px-6 py-16">
        <div className="mx-auto max-w-[980px]">
          <div className="mx-auto mb-8.5 max-w-[540px] text-center">
            <div className="mb-2.5 font-sans text-[11px] tracking-[.16em] text-accent">WHAT&apos;S ACTUALLY IN IT</div>
            <h2 className="mb-2.5 text-[26px] tracking-[-.02em] sm:text-[30px]">One workspace. Every part of the job.</h2>
            <p className="text-[15px] text-muted">The felt part above comes from what&apos;s built underneath.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-card border border-border bg-surface px-5.5 py-5">
                <div className="mb-2.5 font-sans text-[15px] text-accent">{f.glyph}</div>
                <h3 className="mb-1.5 text-[14px] font-semibold">{f.title}</h3>
                <p className="text-[12.5px] leading-[1.6] text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* on the road strip */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-5 text-center font-sans text-[11px] tracking-[.16em] text-accent">ON THE ROAD</div>
          <RoadPhotoStrip />
        </div>
      </section>

      <PhotoBleedBand {...CROWD_PHOTO} />

      {/* founder story */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-9 text-left">
            <div className="mb-2.5 font-sans text-[11px] tracking-[.16em] text-accent">WHY THIS EXISTS</div>
            <h2 className="text-[26px] tracking-[-.02em] sm:text-[30px]">I built this because I lived it.</h2>
          </div>
          <div className="grid grid-cols-1 items-start gap-9 sm:grid-cols-[260px_1fr]">
            <div className="relative mx-auto aspect-[4/5] w-[260px] max-w-full overflow-hidden rounded-tile border border-border sm:mx-0">
              <Image src="/landing-jamil.jpg" alt="Jamil Apostol" fill sizes="260px" className="object-cover" />
            </div>
            <div>
              <p className="mb-4.5 text-[17.5px] leading-[1.75] text-text">
                I&apos;ve been a touring musician for 13 years. Playing shows across the world, mostly running my own business the whole time — no label, no manager doing the back-end work for me.
              </p>
              <p className="mb-4.5 text-[16px] leading-[1.75] text-muted">
                For most of that time, my &quot;system&quot; was whatever I could cobble together on the road. Spreadsheets for the money. Files split across a couple of different Dropbox and Google Drive accounts, because I&apos;d lose track of which one I&apos;d used last. Receipts as random photos on my phone, buried somewhere between soundcheck videos and setlists. To-do lists everywhere and nowhere.
              </p>
              <p className="mb-4.5 text-[16px] leading-[1.75] text-muted">
                I was booking shows, tracking merch sales, and trying to keep track of every promoter and fan I&apos;d met on tour — all of it by hand, all of it while also trying to be a musician. It was genuinely stressful. It was driving me crazy.
              </p>
              <p className="mb-4.5 text-[16px] leading-[1.75] text-muted">I looked for something built for how touring actually works, and I couldn&apos;t find it. So I built it myself.</p>
              <p className="mb-4.5 text-[16px] leading-[1.75] text-muted">
                HEADLINE.WORLD exists because I lived this exact mess for over a decade, out on the road, trying to run a career and a business at the same time with nothing built for either.
              </p>
              <p className="mb-5.5 text-[16px] leading-[1.75] text-muted">If you&apos;re doing the same thing right now — HEADLINE.WORLD is here to make it easier for you to tour the world, stay organized, and worry free.</p>
              <div className="text-[14px]">
                Jamil Apostol
                <span className="block font-sans text-[11px] text-muted/70">Founder, HEADLINE.WORLD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* pricing — reuse the real component so it never drifts from the actual plans */}
      <LandingPricing heading="An easy decision" subheading="You don't need to commit to anything to find out if this fits how you work." />

      {/* faq */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-[760px]">
          <h2 className="mb-7.5 text-center text-[26px] tracking-[-.02em] sm:text-[28px]">Questions you&apos;re probably asking</h2>
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-border py-5.5">
              <h3 className="mb-2.5 flex gap-2.5 text-[16px] font-semibold">
                <span className="flex-none font-sans text-[14px] text-accent">Q.</span>
                {f.q}
              </h3>
              <p className="pl-6 text-[14.5px] leading-[1.65] text-muted">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* what we can't promise */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-[760px]">
          <div className="rounded-tile border border-border bg-surface px-7 py-7.5">
            <h3 className="mb-3 text-[18px] font-semibold">What we can&apos;t promise</h3>
            <p className="mb-3 text-[14.5px] leading-[1.65] text-muted">It won&apos;t get you more bookings — it makes it easier to not lose the ones you&apos;re already chasing.</p>
            <p className="mb-3 text-[14.5px] leading-[1.65] text-muted">It doesn&apos;t replace a full-time tour manager on a large run. It replaces the spreadsheet a tour manager would otherwise be maintaining.</p>
            <p className="text-[14.5px] leading-[1.65] text-muted">It&apos;s early. Some features on the roadmap aren&apos;t built yet, and the beta plan may change before general release.</p>
          </div>
        </div>
      </section>

      {/* access */}
      <section className="px-6 pb-14">
        <div className="mx-auto max-w-[760px]">
          <div className="rounded-tile border border-border bg-surface px-7.5 py-6.5">
            <div className="mb-2.5 font-sans text-[11px] tracking-[.16em] text-accent">HOW TO GET IN</div>
            <p className="text-[15px] leading-[1.65] text-text">
              HEADLINE.WORLD is invite-only right now. We let people in through invite codes in small batches while we&apos;re still a small team. If you don&apos;t have a code yet, request one below and we&apos;ll follow up when a batch opens.
            </p>
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="border-t border-border px-6 py-18 text-center">
        <div className="mx-auto max-w-[760px]">
          <h2 className="mb-3 text-[26px] tracking-[-.02em] text-balance sm:text-[30px]">The van is packed. Is your business?</h2>
          <p className="mb-6.5 text-[15px] text-muted">Set up your first tour in under ten minutes.</p>
          <a href="mailto:support@headline.world?subject=Beta%20access%20request" className="inline-block rounded-tile bg-accent px-8 py-4 text-[16px] font-semibold text-ink">
            Start free
          </a>
          <div className="mt-4 font-sans text-[11.5px] text-muted/70">No card required · support@headline.world</div>
        </div>
      </section>

      <footer className="pb-12 text-center font-sans text-[10.5px] text-muted/70">
        © 2026 HEADLINE.WORLD · By musicians, for musicians ·{" "}
        <a href="https://headline.world" className="underline">
          headline.world
        </a>
      </footer>
    </div>
  );
}
