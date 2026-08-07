import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BENEFITS, FEATURES } from "@/lib/landing-content";
import { PhotoBleedHero, PhotoBleedBand, RoadPhotoStrip, HERO_PHOTO, SOUNDCHECK_PHOTO, CROWD_PHOTO } from "@/components/marketing-photos";

export const metadata: Metadata = {
  title: "HEADLINE. — Join the Beta",
  description: "HEADLINE. is invite-only right now. Here's what you get, and how to redeem your invite code.",
};

const STEPS = [
  {
    n: "1",
    title: "Get your invite code",
    body: "You'll get this directly from us — we're onboarding artists ourselves, in small batches, one conversation at a time. It looks like BETA-XXXXXXXX.",
  },
  {
    n: "2",
    title: "Create your free account",
    body: "Head to sign-up and create an account with your email. No card required — this step is the same whether or not you have a code yet.",
  },
  {
    n: "3",
    title: "Click \"Have an invite code?\"",
    body: "Once you're in the setup wizard, you'll see this link at the top of every step. Click it to reveal the redemption box.",
  },
  {
    n: "4",
    title: "Enter your code and redeem",
    body: "Type in your BETA- code exactly as given and hit Redeem. It's checked instantly against our records.",
  },
  {
    n: "5",
    title: "You're in — full access, on us",
    body: "Redeeming a valid code unlocks full Pro-tier access for as long as you're in the beta. No billing, nothing to cancel later.",
  },
];

export default function BetaPage() {
  return (
    <div className="bg-canvas text-text">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="HEADLINE." width={26} height={26} />
            <span className="text-[15px] font-bold tracking-[-.01em]">HEADLINE.</span>
          </div>
          <a href="#steps" className="rounded-card bg-accent px-4.5 py-2.5 text-[14px] font-semibold text-ink">
            I have a code
          </a>
        </div>
      </header>

      {/* hero */}
      <section className="px-6 pb-14 pt-16 text-center sm:pt-20">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-3.5 font-mono text-[11px] tracking-[.16em] text-accent">INVITE-ONLY BETA</div>
          <h1 className="mb-4.5 text-[32px] leading-[1.1] tracking-[-.03em] text-balance sm:text-[46px]">
            You&apos;re invited to run your <span className="text-accent">whole career</span> from one place.
          </h1>
          <p className="mx-auto mb-7 max-w-[560px] text-[17px] text-muted text-balance">
            HEADLINE. is in a small, invite-only beta right now. If someone gave you a code, you&apos;re a few minutes from full access — free, no card, nothing to cancel.
          </p>
          <div className="mb-3.5 flex flex-wrap items-center justify-center gap-3">
            <a href="#steps" className="rounded-tile bg-accent px-8 py-4 text-[16px] font-semibold text-ink">
              How to redeem your code
            </a>
            <a href="#benefits" className="rounded-tile border border-border px-8 py-4 text-[16px] font-semibold">
              See what you get ↓
            </a>
          </div>
          <div className="font-mono text-[11.5px] text-muted/70">Full Pro-tier access · Not billed · Small batches, by invite only</div>
        </div>
      </section>

      <PhotoBleedHero {...HERO_PHOTO} />
      <PhotoBleedBand {...SOUNDCHECK_PHOTO} />

      {/* benefits */}
      <section id="benefits" className="px-6 py-16">
        <div className="mx-auto max-w-[980px]">
          <div className="mx-auto mb-8.5 max-w-[540px] text-center">
            <div className="mb-2.5 font-mono text-[11px] tracking-[.16em] text-accent">HOW IT FEELS</div>
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
          </div>
        </div>
      </section>

      {/* features */}
      <section className="border-y border-border bg-surface-nested px-6 py-16">
        <div className="mx-auto max-w-[980px]">
          <div className="mx-auto mb-8.5 max-w-[540px] text-center">
            <div className="mb-2.5 font-mono text-[11px] tracking-[.16em] text-accent">WHAT&apos;S ACTUALLY IN IT</div>
            <h2 className="mb-2.5 text-[26px] tracking-[-.02em] sm:text-[30px]">One workspace. Every part of the job.</h2>
            <p className="text-[15px] text-muted">Beta gets you full access to everything below — same as our top paid tier.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-card border border-border bg-surface px-5.5 py-5">
                <div className="mb-2.5 font-mono text-[15px] text-accent">{f.glyph}</div>
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
          <div className="mb-5 text-center font-mono text-[11px] tracking-[.16em] text-accent">ON THE ROAD</div>
          <RoadPhotoStrip />
        </div>
      </section>

      <PhotoBleedBand {...CROWD_PHOTO} />

      {/* how to redeem — steps */}
      <section id="steps" className="px-6 py-16">
        <div className="mx-auto max-w-[720px]">
          <div className="mb-9 text-center">
            <div className="mb-2.5 font-mono text-[11px] tracking-[.16em] text-accent">HOW TO JOIN</div>
            <h2 className="text-[26px] tracking-[-.02em] sm:text-[30px]">Redeeming your invite code takes about two minutes.</h2>
          </div>
          <div className="flex flex-col gap-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-4 rounded-tile border border-border bg-surface p-5.5">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-accent-soft font-mono text-[13px] font-semibold text-accent">{s.n}</div>
                <div>
                  <h3 className="mb-1.5 text-[15px] font-semibold">{s.title}</h3>
                  <p className="text-[13.5px] leading-[1.65] text-muted">{s.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-tile border border-border bg-surface-nested px-6 py-5 text-center">
            <div className="mb-1 font-mono text-[11px] tracking-[.08em] text-muted">CODE FORMAT</div>
            <div className="font-mono text-[18px] tracking-[.06em] text-accent">BETA-XXXXXXXX</div>
          </div>

          <div className="mt-9 text-center">
            <Link href="/signup" className="inline-block rounded-tile bg-accent px-8 py-4 text-[16px] font-semibold text-ink">
              Create your free account
            </Link>
            <div className="mt-3 font-mono text-[11.5px] text-muted/70">Then look for &quot;Have an invite code?&quot; in setup</div>
          </div>
        </div>
      </section>

      {/* no code yet */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-[720px]">
          <div className="rounded-tile border border-border bg-surface px-7.5 py-6.5 text-center">
            <div className="mb-2.5 font-mono text-[11px] tracking-[.16em] text-accent">DON&apos;T HAVE A CODE YET?</div>
            <p className="mb-4 text-[15px] leading-[1.65] text-text">
              We&apos;re bringing artists in ourselves, in small batches, so we can actually talk to the people using it. Reach out and we&apos;ll follow up when the next batch opens.
            </p>
            <a href="mailto:support@headline.world?subject=Beta%20access%20request" className="inline-block rounded-tile border border-border px-6 py-3 text-[14px] font-semibold">
              Request an invite
            </a>
          </div>
        </div>
      </section>

      <footer className="pb-12 text-center font-mono text-[10.5px] text-muted/70">
        © 2026 HEADLINE. · By musicians, for musicians ·{" "}
        <a href="https://headline.world" className="underline">
          headline.world
        </a>
      </footer>
    </div>
  );
}
