import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { BUNDLES, FREE_TOOLS, PACKS, bySlug, bundleListPrice } from "@content/products";
import { absoluteUrl } from "@/lib/site-url";
import { Cover, Eyebrow, AccentRule, LeftBorderCard, MetaRow, usd } from "@/components/store/store-ui";
import { BuyButton } from "@/components/store/buy-button";

export function generateStaticParams() {
  return PACKS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) return { title: "Not found" };

  const title = `${p.title} — ${p.subtitle}`;
  return {
    title,
    description: p.short,
    alternates: { canonical: absoluteUrl(`/artist-operator/packs/${p.slug}`) },
    openGraph: { title, description: p.short, url: absoluteUrl(`/artist-operator/packs/${p.slug}`), images: [p.cover], type: "website" },
    twitter: { card: "summary_large_image", title, description: p.short, images: [p.cover] },
  };
}

/** Preview images only if the folder is actually there — the brief says omit
 *  the section entirely rather than render a placeholder. */
function previewImages(slug: string): string[] {
  const dir = path.join(process.cwd(), "public", "previews", slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort()
    .slice(0, 2)
    .map((f) => `/previews/${slug}/${f}`);
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = bySlug(slug);
  if (!p) notFound();

  const vault = BUNDLES.find((b) => b.slug === "operators-vault");
  const vaultList = vault ? bundleListPrice(vault.slug) : 0;
  const inVault = vault?.includes.includes(p.slug) ?? false;

  const related = PACKS.filter((x) => x.slug !== p.slug && x.tag === p.tag).slice(0, 3);
  const bridge = FREE_TOOLS.find((t) => t.upsell === p.slug);
  const previews = previewImages(p.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: p.short,
    image: absoluteUrl(p.cover),
    brand: { "@type": "Brand", name: "The Artist Operator" },
    offers: {
      "@type": "Offer",
      price: p.price.toFixed(2),
      priceCurrency: "USD",
      availability: p.stripePriceId ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url: absoluteUrl(`/artist-operator/packs/${p.slug}`),
    },
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:gap-14">
        <Cover src={p.cover} title={p.title} priority />

        <div>
          <Eyebrow>The Artist Operator series</Eyebrow>
          <h1 data-no-rule className="mt-3 mb-3 text-[30px] leading-[1.08] tracking-[-.01em] sm:text-[38px]">
            {p.title}
          </h1>
          <div className="mb-4 font-label text-[14px] font-light tracking-[.06em] text-text/60">{p.subtitle}</div>
          <AccentRule className="mb-6" />

          <p className="mb-7 max-w-[560px] text-[15px] leading-[1.6] text-text/75 text-pretty">{p.long}</p>

          <MetaRow
            items={[
              ["Pages", String(p.pages)],
              ["Format", p.format],
              ["Chapters", p.chapters],
            ]}
          />

          <div className="mt-8 mb-2 font-mono text-[40px] leading-none font-black">{usd(p.price)}</div>
          <BuyButton slug={p.slug} type="pack" price={p.price} available={Boolean(p.stripePriceId)} />
          <div className="mt-1 text-[12.5px] text-text/45">Instant download · {p.format} · Yours forever</div>
          <p className="mt-5 max-w-[480px] text-[13.5px] leading-relaxed text-text/55 italic">{p.forWho}</p>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="mb-5 text-[20px] tracking-[-.01em]">What&rsquo;s inside</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {p.inside.map((line) => (
            <LeftBorderCard key={line}>
              <span className="text-[14px] leading-[1.55] text-text/80">{line}</span>
            </LeftBorderCard>
          ))}
        </div>
      </section>

      {previews.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-[20px] tracking-[-.01em]">A look inside</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {previews.map((src) => (
              <div key={src} className="relative aspect-[1000/1294] overflow-hidden rounded-[4px] border border-border">
                <Image src={src} alt={`${p.title} — sample page`} fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {vault && inVault && (
        <section className="mt-16">
          <div className="rounded-[6px] border border-accent/35 bg-accent-soft px-6 py-5">
            <div className="text-[14.5px] leading-relaxed text-text/80">
              This pack is included in{" "}
              <Link href={`/artist-operator/bundles/${vault.slug}`} className="font-semibold text-accent hover:underline">
                {vault.title}
              </Link>{" "}
              — all thirteen packs for {usd(vault.price)} instead of {usd(vaultList)}.
            </div>
          </div>
        </section>
      )}

      {bridge && (
        <section className="mt-12">
          <LeftBorderCard tone="var(--color-green)">
            <div className="mb-1 font-label text-[10.5px] tracking-[.2em] text-green">Start free</div>
            <div className="text-[14px] leading-relaxed text-text/75">
              {bridge.title} is the free one-page version.{" "}
              <Link href={`/free/${bridge.slug}`} className="text-accent hover:underline">
                Take it first
              </Link>
              .
            </div>
          </LeftBorderCard>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-[20px] tracking-[-.01em]">Goes with</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} href={`/artist-operator/packs/${r.slug}`} className="group flex flex-col">
                <Cover src={r.cover} title={r.title} className="mb-3 transition-transform group-hover:-translate-y-1" />
                <div className="mb-1 text-[14px] font-semibold group-hover:text-accent">{r.title}</div>
                <div className="mt-auto font-mono text-[13.5px] text-text/60">{usd(r.price)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
