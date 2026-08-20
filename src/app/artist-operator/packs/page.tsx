import type { Metadata } from "next";
import Link from "next/link";
import { BUNDLES, PACKS, bundleListPrice } from "@content/products";
import { absoluteUrl } from "@/lib/site-url";
import { Cover, Eyebrow, AccentRule, usd } from "@/components/store/store-ui";
import { GlowField, DotRow } from "@/components/glow-field";
import { StoreFilter } from "@/components/store/store-filter";

const TITLE = "The Artist Operator packs";
const DESCRIPTION = "Thirteen working packs and the Contract Vault — the paper system behind The Artist Operator.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/artist-operator/packs") },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/artist-operator/packs"), images: ["/covers/book.jpg"] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/covers/book.jpg"] },
};

export default function PacksPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-8 sm:py-16">
      <div className="relative mb-12 overflow-hidden rounded-[6px] border border-border bg-surface px-6 py-10 sm:px-10">
        <GlowField intensity={0.32} showNodes={false} />
        <div className="relative max-w-[640px]">
          <Eyebrow>The Artist Operator series</Eyebrow>
          <h1 data-no-rule className="mt-3 mb-3 text-[32px] leading-[1.06] tracking-[-.01em] sm:text-[42px]">
            The packs
          </h1>
          <AccentRule className="mb-5" />
          <p className="text-[15px] leading-[1.6] text-text/70 text-pretty">
            Every pack is the paper version of one working system — printable, writable, and built to sit where the work
            happens.
          </p>
          <DotRow className="mt-7" />
        </div>
      </div>

      {/* Bundles first, as wide feature cards — the anchor is computed, never typed. */}
      <div className="mb-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {BUNDLES.map((b) => {
          const list = bundleListPrice(b.slug);
          return (
            <Link
              key={b.slug}
              href={`/artist-operator/bundles/${b.slug}`}
              className="group grid grid-cols-[110px_minmax(0,1fr)] gap-5 border-y border-r border-border bg-surface p-5 transition-colors hover:bg-surface-nested"
              style={{ borderLeft: "4px solid var(--color-accent)", borderRadius: "0 5px 5px 0" }}
            >
              <Cover src={b.cover} title={b.title} />
              <div>
                <Eyebrow className="mb-2">Bundle</Eyebrow>
                <div className="mb-1.5 text-[19px] font-bold group-hover:text-accent">{b.title}</div>
                <p className="mb-4 text-[13.5px] leading-[1.55] text-text/60 text-pretty">{b.short}</p>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[26px] font-bold text-accent">{usd(b.price)}</span>
                  {list > b.price && (
                    <>
                      <span className="font-mono text-[15px] text-text/35 line-through">{usd(list)}</span>
                      <span className="font-label text-[10.5px] tracking-[.16em] text-green">SAVE {usd(list - b.price)}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <StoreFilter packs={PACKS.map((p) => ({
        slug: p.slug,
        title: p.title,
        short: p.short,
        price: p.price,
        cover: p.cover,
        tag: p.tag,
        featured: Boolean(p.featured),
      }))} />
    </div>
  );
}
