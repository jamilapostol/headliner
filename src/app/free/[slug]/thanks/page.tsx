import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FREE_TOOLS, freeBySlug, freeDownloadUrl } from "@content/products";
import { Eyebrow, LeftBorderCard } from "@/components/store/store-ui";

export function generateStaticParams() {
  return FREE_TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = freeBySlug(slug);
  // A delivery page has no business in search results.
  return { title: tool ? `${tool.title} — your download` : "Not found", robots: { index: false, follow: false } };
}

export default async function FreeToolThanksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = freeBySlug(slug);
  if (!tool) notFound();

  const others = FREE_TOOLS.filter((t) => t.slug !== tool.slug);

  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 text-center sm:px-8 sm:py-24">
      <Eyebrow className="mb-4">Your download</Eyebrow>

      {/* Quote style — Oswald 300, in the accent. BRAND.md §4.1. */}
      <h1 data-no-rule className="mb-4 font-label text-[26px] leading-[1.3] font-light tracking-[.015em] text-accent sm:text-[30px]">
        The count is the pay. Here&rsquo;s the paperwork.
      </h1>
      <p className="mx-auto mb-9 max-w-[460px] text-[15px] leading-[1.6] text-text/65">
        {tool.title} is ready. Also on its way to your inbox — check spam if it&rsquo;s shy.
      </p>

      <a
        href={freeDownloadUrl(tool.file)}
        download
        className="inline-block min-h-[44px] rounded-[6px] bg-accent px-8 py-4 text-[16px] font-bold text-ink transition-[filter] hover:brightness-105"
      >
        Download {tool.format === "XLSX" ? "the spreadsheet" : "the PDF"}
      </a>

      <section className="mt-16 text-left">
        <h2 className="mb-5 text-center text-[19px] tracking-[-.01em]">While you&rsquo;re here</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {others.map((t) => (
            <Link key={t.slug} href={`/free/${t.slug}`} className="group">
              <LeftBorderCard className="h-full">
                <div className="mb-1.5 text-[14px] font-semibold group-hover:text-accent">{t.title}</div>
                <div className="text-[12.5px] leading-[1.5] text-text/55">{t.short}</div>
              </LeftBorderCard>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-14 text-[13.5px] text-text/50">
        These are the paper versions of what the app does every day.{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Start free
        </Link>
        .
      </p>
    </div>
  );
}
