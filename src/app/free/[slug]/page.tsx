import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FREE_TOOLS, freeBySlug } from "@content/products";
import { absoluteUrl } from "@/lib/site-url";
import { Cover, Eyebrow, AccentRule, LeftBorderCard, MetaRow } from "@/components/store/store-ui";
import { EmailCapture } from "@/components/store/email-capture";

// One free tool. The page's whole job is one email address, so nothing paid
// appears anywhere on it — selling on the capture page suppresses the
// capture, and the upsell happens later, in email.

export function generateStaticParams() {
  return FREE_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = freeBySlug(slug);
  if (!tool) return { title: "Not found" };

  const title = `${tool.title} — free download`;
  return {
    title,
    description: tool.short,
    alternates: { canonical: absoluteUrl(`/free/${tool.slug}`) },
    openGraph: { title, description: tool.short, url: absoluteUrl(`/free/${tool.slug}`), images: [tool.cover] },
    twitter: { card: "summary_large_image", title, description: tool.short, images: [tool.cover] },
  };
}

export default async function FreeToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = freeBySlug(slug);
  if (!tool) notFound();

  const others = FREE_TOOLS.filter((t) => t.slug !== tool.slug);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-8 sm:py-16">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-14">
        <Cover src={tool.cover} title={tool.title} priority />

        <div>
          <Eyebrow>Free tool</Eyebrow>
          <h1 data-no-rule className="mt-3 mb-3 text-[30px] leading-[1.08] tracking-[-.01em] sm:text-[38px]">
            {tool.title}
          </h1>
          <div className="mb-4 font-label text-[14px] font-light tracking-[.06em] text-text/60">{tool.subtitle}</div>
          <AccentRule className="mb-6" />

          <p className="mb-7 max-w-[560px] text-[15px] leading-[1.6] text-text/75 text-pretty">{tool.long}</p>

          {/* High and dominant, per the brief — this is the point of the page. */}
          <div className="mb-6 rounded-[6px] border border-border bg-surface p-5">
            <EmailCapture toolSlug={tool.slug} downloadName={tool.file.split("/").pop()} thanksHref={`/free/${tool.slug}/thanks`} />
          </div>

          <MetaRow
            items={[
              ["Pages", String(tool.pages)],
              ["Format", tool.format],
              ["Price", "Free"],
            ]}
          />
        </div>
      </div>

      <section className="mt-16">
        <h2 className="mb-5 text-[20px] tracking-[-.01em]">What&rsquo;s inside</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {tool.inside.map((line) => (
            <LeftBorderCard key={line}>
              <span className="text-[14px] leading-[1.55] text-text/80">{line}</span>
            </LeftBorderCard>
          ))}
        </div>
      </section>

      {tool.appBridge && (
        <p className="mt-10 max-w-[620px] text-[13.5px] leading-relaxed text-text/55">
          {tool.appBridge}{" "}
          <Link href="/signup" className="text-accent hover:underline">
            See it in the app
          </Link>
          .
        </p>
      )}

      <section className="mt-16">
        <h2 className="mb-5 text-[20px] tracking-[-.01em]">The other free tools</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {others.map((t) => (
            <Link key={t.slug} href={`/free/${t.slug}`} className="group">
              <LeftBorderCard className="h-full">
                <div className="mb-1.5 text-[14.5px] font-semibold group-hover:text-accent">{t.title}</div>
                <div className="text-[13px] leading-[1.5] text-text/55">{t.short}</div>
              </LeftBorderCard>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
