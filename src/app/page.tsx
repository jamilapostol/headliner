import Image from "next/image";
import Link from "next/link";
import { getSiteContent } from "@/lib/site-content";
import { LandingPricing } from "@/components/landing-pricing";
import { db } from "@/lib/db";
import { isPagePublic } from "@/lib/web-pages";
import { ComingSoon } from "@/components/coming-soon";
import { BrandLockup } from "@/components/brand-lockup";
import { GlowField, DotRow } from "@/components/glow-field";

const REPLACES = ["Spreadsheets", "Notes app", "HubSpot", "Dropbox folders", "Group texts", "Sticky notes on the dash"];

// One accent per feature area, per BRAND.md §3.2 — booking gold, fans green,
// money blue, merch orange, contracts purple, show-day pink, community
// magenta. Previously four of these seven were gold, which is what made the
// page read as a single yellow note rather than the cover palette.
const FEATURE_META = [
  { glyph: "▤", color: "text-accent", edge: "#FFC93C" },  // bookings → gold
  { glyph: "➤", color: "text-accent", edge: "#FFC93C" },  // tours → gold
  { glyph: "◉", color: "text-green", edge: "#3FCB86" },   // contacts / fan CRM → green
  { glyph: "▣", color: "text-orange", edge: "#FF7A2F" },  // merch → orange
  { glyph: "$", color: "text-blue", edge: "#38B6E8" },    // money → blue
  { glyph: "✳", color: "text-purple", edge: "#8B5CF6" },  // contracts → purple
  { glyph: "♥", color: "text-magenta", edge: "#FF4FA3" }, // community → magenta
] as const;

const BENEFIT_META = [
  { glyph: "♪", color: "text-pink", edge: "#F4356E" },
  { glyph: "✓", color: "text-green", edge: "#3FCB86" },
  { glyph: "◆", color: "text-blue", edge: "#38B6E8" },
  { glyph: "☾", color: "text-purple", edge: "#8B5CF6" },
] as const;

export default async function LandingPage() {
  if (!(await isPagePublic("home"))) return <ComingSoon />;

  const c = await getSiteContent();
  const blocks = await db.landingBlock.findMany({ orderBy: { order: "asc" } });

  const features = FEATURE_META.map((meta, i) => ({
    ...meta,
    title: c[`feature_${i + 1}_title`],
    body: c[`feature_${i + 1}_body`],
  }));

  const benefits = BENEFIT_META.map((meta, i) => ({
    ...meta,
    title: c[`benefit_${i + 1}_title`],
    body: c[`benefit_${i + 1}_body`],
  }));

  return (
    <div className="min-h-screen bg-canvas text-text" data-theme="dark">
      {/* Hero, with concert photo as cover */}
      <div className="relative flex min-h-[620px] flex-col overflow-hidden sm:min-h-[720px]">
        <Image
          src={c.hero_image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/75 via-canvas/55 to-canvas" />
        {/* The cover burst, over the scrim so the color reads, at reduced
            intensity so the headline stays the loudest thing. */}
        <GlowField intensity={0.55} />

        {/* Nav */}
        <div className="relative mx-auto flex w-full max-w-[1100px] items-center gap-4 px-4 py-[18px] sm:gap-7 sm:px-10">
          <BrandLockup size={28} />
          <div className="ml-auto flex items-center gap-3 text-[13px] text-text/60 sm:gap-5">
            <span className="hidden cursor-pointer hover:text-text sm:inline">Features</span>
            <span className="hidden cursor-pointer hover:text-text sm:inline">Pricing</span>
            <Link href="/app" className="rounded-lg bg-accent px-4 py-2 font-semibold text-canvas">
              Open the app
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-auto max-w-[820px] px-4 pt-12 pb-14 text-center sm:px-10 sm:pt-[72px]">
          <div className="mb-[22px] inline-block rounded-[20px] border border-yellow/30 px-3.5 py-[5px] font-sans text-[11px] tracking-[.14em] text-yellow">
            {c.hero_eyebrow}
          </div>
          <h1 className="mb-[18px] text-[34px] leading-[1.1] tracking-[-.03em] text-balance sm:text-[52px] sm:leading-[1.08]">
            Your whole career.
            <br />
            One <span className="text-accent">soundboard</span>.
          </h1>
          <p className="mx-auto mb-[30px] max-w-[560px] text-[15px] leading-[1.55] text-text/70 text-pretty sm:text-[17px]">
            {c.hero_subheadline}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="rounded-[10px] bg-accent px-[26px] py-[13px] text-[15px] font-semibold text-canvas">
              {c.hero_cta_primary}
            </Link>
            <div className="cursor-pointer rounded-[10px] border border-text/25 bg-black/20 px-[26px] py-[13px] text-[15px] text-text/90 backdrop-blur-sm hover:border-text/45">
              {c.hero_cta_secondary}
            </div>
          </div>
          <div className="mt-4 text-[12px] text-text/50">{c.hero_disclaimer}</div>
          <DotRow className="mt-7" />
        </div>
      </div>

      {/* Retires strip */}
      <div className="mx-auto max-w-[900px] px-4 pb-16 text-center sm:px-10">
        <div className="mb-3.5 font-sans text-[11px] tracking-[.14em] text-text/35">{c.retires_label}</div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {REPLACES.map((r) => (
            <div
              key={r}
              className="rounded-[20px] border border-text/[.09] px-3.5 py-1.5 text-[12.5px] text-text/50 line-through decoration-orange/60"
            >
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits — the lifestyle payoff, ahead of the tactical feature list */}
      <div className="relative mx-auto max-w-[1100px] px-4 pb-[72px] sm:px-10">
        <GlowField intensity={0.3} showNodes={false} />
        <div className="relative mx-auto mb-[42px] max-w-[640px] text-center">
          <h2 className="mb-2.5 text-[26px] tracking-[-.02em] sm:text-[32px]">{c.benefits_heading}</h2>
          <p className="text-[14.5px] leading-[1.55] text-text/55 sm:text-[15.5px]">{c.benefits_subheading}</p>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex gap-4 border-y border-r border-border bg-surface px-6 py-[22px] transition-colors hover:bg-surface-nested"
              style={{ borderLeft: `4px solid ${b.edge}`, borderRadius: "0 5px 5px 0" }}
            >
              <div className={`flex-none font-sans text-[20px] ${b.color}`}>{b.glyph}</div>
              <div>
                <div className="mb-[7px] text-[16px] font-semibold">{b.title}</div>
                <div className="text-[13.5px] leading-[1.6] text-text/60 text-pretty">{b.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage photo — full-bleed break between the lifestyle pitch and the feature list */}
      <div className="relative min-h-[300px] overflow-hidden sm:min-h-[420px]">
        <Image src={c.break_image} alt={c.break_image_alt} fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/40 via-transparent to-canvas" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas/10 via-transparent to-canvas/25" />
        <GlowField intensity={0.7} showNodes={false} />
      </div>

      {/* Features */}
      <div className="relative mx-auto max-w-[1100px] px-4 pt-[60px] pb-[72px] sm:px-10">
        <GlowField intensity={0.28} showNodes={false} />
        <div className="relative grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="border-y border-r border-border bg-surface px-6 py-[22px] transition-colors hover:bg-surface-nested"
              style={{ borderLeft: `3px solid ${f.edge}`, borderRadius: "0 5px 5px 0" }}
            >
              <div className={`mb-3 font-sans text-[15px] ${f.color}`}>{f.glyph}</div>
              <div className="mb-[7px] text-[15.5px] font-semibold">{f.title}</div>
              <div className="text-[13px] leading-[1.55] text-text/55 text-pretty">{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom blocks — admin-added content between Features and Pricing */}
      {blocks.map((b) =>
        b.type === "text" ? (
          <div key={b.id} className="mx-auto max-w-[720px] px-4 pb-[72px] text-center sm:px-10">
            <h2 className="mb-2.5 text-[24px] tracking-[-.02em] sm:text-[30px]">{b.heading}</h2>
            <p className="text-[14.5px] leading-[1.6] text-text/60 text-pretty sm:text-[15.5px]">{b.body}</p>
          </div>
        ) : (
          <div key={b.id} className="relative min-h-[260px] overflow-hidden sm:min-h-[380px]">
            {b.imageUrl && <Image src={b.imageUrl} alt={b.imageAlt ?? ""} fill sizes="100vw" className="object-cover object-center" />}
          </div>
        ),
      )}

      <LandingPricing heading={c.pricing_heading} subheading={c.pricing_subheading} />

      {/* Footer CTA */}
      <div className="relative overflow-hidden border-t border-border px-4 py-14 text-center sm:px-10">
        <GlowField intensity={0.4} showNodes={false} />
        <div className="relative">
        <h2 className="mb-2.5 text-[22px] tracking-[-.02em] sm:text-[28px]">{c.footer_heading}</h2>
        <div className="mb-6 text-[14px] text-text/55">{c.footer_subheading}</div>
        <Link href="/signup" className="inline-block rounded-[10px] bg-accent px-7 py-[13px] text-[15px] font-semibold text-canvas">
          {c.hero_cta_primary}
        </Link>
        <div className="mt-10 font-sans text-[11px] text-text/30">{c.footer_copyright}</div>
        <div className="mt-2.5 flex items-center justify-center gap-4 font-sans text-[11px] text-text/30">
          <Link href="/privacy" className="hover:text-text/60">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-text/60">
            Terms of Service
          </Link>
          <a href={`mailto:${c.footer_support_email}`} className="hover:text-text/60">
            {c.footer_support_email}
          </a>
        </div>
        </div>
      </div>
    </div>
  );
}
