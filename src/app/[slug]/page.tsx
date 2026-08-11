import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";

// Renders admin-created pages (kind "custom") at /<slug>. Static routes
// (/landing, /beta, …) always win over this dynamic segment, and private or
// unknown slugs 404 rather than acknowledging the page exists.
async function getPublicCustomPage(slug: string) {
  const page = await db.webPage.findUnique({ where: { slug } });
  if (!page || page.kind !== "custom" || page.visibility !== "public") return null;
  return page;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicCustomPage(slug);
  return { title: page ? `${page.title} — HEADLINE.WORLD` : "HEADLINE.WORLD" };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicCustomPage(slug);
  if (!page) notFound();

  const paragraphs = (page.body ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-canvas text-text" data-theme="dark">
      <header className="sticky top-0 z-20 border-b border-border bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="HEADLINE.WORLD" width={26} height={26} />
            <span className="text-[15px] font-bold tracking-[-.01em]">HEADLINE.WORLD</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[720px] px-6 py-16">
        <h1 className="mb-7 text-[32px] leading-[1.15] tracking-[-.02em] text-balance sm:text-[40px]">{page.heading ?? page.title}</h1>
        <div className="flex flex-col gap-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15.5px] leading-[1.75] text-muted">
              {p}
            </p>
          ))}
        </div>
      </main>
      <footer className="pb-12 text-center font-sans text-[10.5px] text-muted/70">© 2026 HEADLINE.WORLD</footer>
    </div>
  );
}
