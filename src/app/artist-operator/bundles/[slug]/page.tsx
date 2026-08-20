import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BUNDLES, PACKS, bundleListPrice } from "@content/products";
import { absoluteUrl } from "@/lib/site-url";
import { Cover, Eyebrow, AccentRule, MetaRow, usd } from "@/components/store/store-ui";
import { BuyButton } from "@/components/store/buy-button";

export function generateStaticParams() {
  return BUNDLES.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = BUNDLES.find((x) => x.slug === slug);
  if (!b) return { title: "Not found" };

  const title = `${b.title} — ${b.subtitle}`;
  return {
    title,
    description: b.short,
    alternates: { canonical: absoluteUrl(`/artist-operator/bundles/${b.slug}`) },
    openGraph: { title, description: b.short, url: absoluteUrl(`/artist-operator/bundles/${b.slug}`), images: [b.cover] },
    twitter: { card: "summary_large_image", title, description: b.short, images: [b.cover] },
  };
}

export default async function BundlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bundle = BUNDLES.find((x) => x.slug === slug);
  if (!bundle) notFound();

  const included = bundle.includes
    .map((s) => PACKS.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // Computed, never hard-coded — the anchor has to stay true if a price moves.
  const listPrice = bundleListPrice(bundle.slug);
  const saving = listPrice - bundle.price;
  const totalPages = included.reduce((sum, p) => sum + p.pages, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bundle.title,
    description: bundle.short,
    image: absoluteUrl(bundle.cover),
    brand: { "@type": "Brand", name: "The Artist Operator" },
    offers: {
      "@type": "Offer",
      price: bundle.price.toFixed(2),
      priceCurrency: "USD",
      availability: bundle.stripePriceId ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url: absoluteUrl(`/artist-operator/bundles/${bundle.slug}`),
    },
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:gap-14">
        <Cover src={bundle.cover} title={bundle.title} priority />

        <div>
          <Eyebrow>Bundle</Eyebrow>
          <h1 data-no-rule className="mt-3 mb-3 text-[30px] leading-[1.08] tracking-[-.01em] sm:text-[38px]">
            {bundle.title}
          </h1>
          <div className="mb-4 font-label text-[14px] font-light tracking-[.06em] text-text/60">{bundle.subtitle}</div>
          <AccentRule className="mb-6" />

          <p className="mb-7 max-w-[560px] text-[15px] leading-[1.6] text-text/75 text-pretty">{bundle.long}</p>

          <MetaRow
            items={[
              ["Packs", String(included.length)],
              ["Total pages", String(totalPages)],
              ["Format", "PDF"],
            ]}
          />

          {/* The anchor, rendered explicitly. */}
          <div className="mt-8 mb-2 flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-[40px] leading-none font-black text-accent">{usd(bundle.price)}</span>
            {saving > 0 && (
              <>
                <span className="font-mono text-[20px] text-text/35 line-through">{usd(listPrice)}</span>
                <span className="font-label text-[11px] tracking-[.16em] text-green">SAVE {usd(saving)}</span>
              </>
            )}
          </div>
          <BuyButton slug={bundle.slug} type="bundle" price={bundle.price} available={Boolean(bundle.stripePriceId)} />
          <div className="mt-1 text-[12.5px] text-text/45">
            Instant download · {included.length} packs · Yours forever
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="mb-1 text-[20px] tracking-[-.01em]">What&rsquo;s in it</h2>
        <p className="mb-6 text-[13.5px] text-text/50">
          {included.length} packs · {totalPages} pages · {usd(listPrice)} bought separately
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {included.map((p) => (
            <Link key={p.slug} href={`/artist-operator/packs/${p.slug}`} className="group flex flex-col">
              <Cover src={p.cover} title={p.title} className="mb-3 transition-transform group-hover:-translate-y-1" />
              <div className="mb-1 text-[13.5px] font-semibold group-hover:text-accent">{p.title}</div>
              <div className="mt-auto font-mono text-[13px] text-text/55">{usd(p.price)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
