import Image from "next/image";
import Link from "next/link";
import { getSiteContent } from "@/lib/site-content";
import { LandingPricing } from "@/components/landing-pricing";
import { db } from "@/lib/db";

const REPLACES = ["Spreadsheets", "Notes app", "HubSpot", "Dropbox folders", "Group texts", "Sticky notes on the dash"];

const FEATURE_META = [
  { glyph: "▤", color: "text-accent" },
  { glyph: "➤", color: "text-yellow" },
  { glyph: "◉", color: "text-blue" },
  { glyph: "▣", color: "text-orange" },
  { glyph: "$", color: "text-accent" },
  { glyph: "✳", color: "text-purple" },
  { glyph: "♥", color: "text-yellow" },
] as const;

const BENEFIT_META = [
  { glyph: "♪", color: "text-accent" },
  { glyph: "✓", color: "text-yellow" },
  { glyph: "◆", color: "text-blue" },
  { glyph: "☾", color: "text-purple" },
] as const;

export default async function LandingPage() {
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

        {/* Nav */}
        <div className="relative mx-auto flex w-full max-w-[1100px] items-center gap-4 px-4 py-[18px] sm:gap-7 sm:px-10">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="HEADLINE." width={28} height={28} />
            <div className="text-[15px] font-bold">HEADLINE.</div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-[13px] text-white/60 sm:gap-5">
            <span className="hidden cursor-pointer hover:text-text sm:inline">Features</span>
            <span className="hidden cursor-pointer hover:text-text sm:inline">Pricing</span>
            <Link href="/app" className="rounded-lg bg-accent px-4 py-2 font-semibold text-canvas">
              Open the app
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-auto max-w-[820px] px-4 pt-12 pb-14 text-center sm:px-10 sm:pt-[72px]">
          <div className="mb-[22px] inline-block rounded-[20px] border border-yellow/30 px-3.5 py-[5px] font-mono text-[11px] tracking-[.14em] text-yellow">
            {c.hero_eyebrow}
          </div>
          <h1 className="mb-[18px] text-[34px] leading-[1.1] tracking-[-.03em] text-balance sm:text-[52px] sm:leading-[1.08]">
            Your whole career.
            <br />
            One <span className="text-accent">soundboard</span>.
          </h1>
          <p className="mx-auto mb-[30px] max-w-[560px] text-[15px] leading-[1.55] text-white/70 text-pretty sm:text-[17px]">
            {c.hero_subheadline}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="rounded-[10px] bg-accent px-[26px] py-[13px] text-[15px] font-semibold text-canvas">
              {c.hero_cta_primary}
            </Link>
            <div className="cursor-pointer rounded-[10px] border border-white/25 bg-black/20 px-[26px] py-[13px] text-[15px] text-white/90 backdrop-blur-sm hover:border-white/45">
              {c.hero_cta_secondary}
            </div>
          </div>
          <div className="mt-4 text-[12px] text-white/50">{c.hero_disclaimer}</div>
        </div>
      </div>

      {/* Retires strip */}
      <div className="mx-auto max-w-[900px] px-4 pb-16 text-center sm:px-10">
        <div className="mb-3.5 font-mono text-[11px] tracking-[.14em] text-white/35">{c.retires_label}</div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {REPLACES.map((r) => (
            <div
              key={r}
              className="rounded-[20px] border border-white/[.09] px-3.5 py-1.5 text-[12.5px] text-white/50 line-through decoration-orange/60"
            >
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Benefits — the lifestyle payoff, ahead of the tactical feature list */}
      <div className="mx-auto max-w-[1100px] px-4 pb-[72px] sm:px-10">
        <div className="mx-auto mb-[42px] max-w-[640px] text-center">
          <h2 className="mb-2.5 text-[26px] tracking-[-.02em] sm:text-[32px]">{c.benefits_heading}</h2>
          <p className="text-[14.5px] leading-[1.55] text-white/55 sm:text-[15.5px]">{c.benefits_subheading}</p>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="flex gap-4 rounded-tile border border-border bg-surface px-6 py-[22px]">
              <div className={`flex-none font-mono text-[20px] ${b.color}`}>{b.glyph}</div>
              <div>
                <div className="mb-[7px] text-[16px] font-semibold">{b.title}</div>
                <div className="text-[13.5px] leading-[1.6] text-white/60 text-pretty">{b.body}</div>
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
      </div>

      {/* Features */}
      <div className="mx-auto max-w-[1100px] px-4 pt-[60px] pb-[72px] sm:px-10">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-tile border border-border bg-surface px-6 py-[22px]">
              <div className={`mb-3 font-mono text-[15px] ${f.color}`}>{f.glyph}</div>
              <div className="mb-[7px] text-[15.5px] font-semibold">{f.title}</div>
              <div className="text-[13px] leading-[1.55] text-white/55 text-pretty">{f.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom blocks — admin-added content between Features and Pricing */}
      {blocks.map((b) =>
        b.type === "text" ? (
          <div key={b.id} className="mx-auto max-w-[720px] px-4 pb-[72px] text-center sm:px-10">
            <h2 className="mb-2.5 text-[24px] tracking-[-.02em] sm:text-[30px]">{b.heading}</h2>
            <p className="text-[14.5px] leading-[1.6] text-white/60 text-pretty sm:text-[15.5px]">{b.body}</p>
          </div>
        ) : (
          <div key={b.id} className="relative min-h-[260px] overflow-hidden sm:min-h-[380px]">
            {b.imageUrl && <Image src={b.imageUrl} alt={b.imageAlt ?? ""} fill sizes="100vw" className="object-cover object-center" />}
          </div>
        ),
      )}

      <LandingPricing heading={c.pricing_heading} subheading={c.pricing_subheading} />

      {/* Footer CTA */}
      <div className="border-t border-border px-4 py-14 text-center sm:px-10">
        <h2 className="mb-2.5 text-[22px] tracking-[-.02em] sm:text-[28px]">{c.footer_heading}</h2>
        <div className="mb-6 text-[14px] text-white/55">{c.footer_subheading}</div>
        <Link href="/signup" className="inline-block rounded-[10px] bg-accent px-7 py-[13px] text-[15px] font-semibold text-canvas">
          {c.hero_cta_primary}
        </Link>
        <div className="mt-10 font-mono text-[11px] text-white/30">{c.footer_copyright}</div>
        <div className="mt-2.5 flex items-center justify-center gap-4 font-mono text-[11px] text-white/30">
          <Link href="/privacy" className="hover:text-white/60">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-white/60">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
