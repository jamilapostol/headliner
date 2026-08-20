import type { Metadata } from "next";
import Link from "next/link";
import { FREE_TOOLS } from "@content/products";
import { absoluteUrl } from "@/lib/site-url";
import { Cover, Eyebrow, AccentRule } from "@/components/store/store-ui";
import { EmailCapture } from "@/components/store/email-capture";
import { GlowField, DotRow } from "@/components/glow-field";

const TITLE = "Free tools for working musicians";
const DESCRIPTION = "Four paper tools from The Artist Operator — booking pipeline, tour checklist, monthly check-in, and the budget spreadsheet.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/free") },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl("/free"), images: [FREE_TOOLS[0]?.cover ?? "/covers/book.jpg"] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function FreeHubPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-8 sm:py-16">
      <div className="relative overflow-hidden rounded-[6px] border border-border bg-surface px-6 py-10 sm:px-10 sm:py-12">
        <GlowField intensity={0.35} showNodes={false} />
        <div className="relative mx-auto max-w-[620px] text-center">
          <Eyebrow>The Artist Operator</Eyebrow>
          <h1 data-no-rule className="mt-3 mb-3 text-[30px] leading-[1.08] tracking-[-.01em] sm:text-[40px]">
            Four tools. No charge.
          </h1>
          <AccentRule className="mx-auto mb-5" />
          <p className="mx-auto mb-8 max-w-[520px] text-[15px] leading-[1.6] text-text/70 text-pretty">
            The paper versions of the four things a working career runs on. Take all four at once, or pick one.
          </p>
          {/* One form, all four — tagged src:free-all plus each tool's tag. */}
          <div className="mx-auto max-w-[520px] text-left">
            <EmailCapture buttonLabel="Send me all four" />
          </div>
          <DotRow className="mt-8" />
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FREE_TOOLS.map((tool) => (
          <Link key={tool.slug} href={`/free/${tool.slug}`} className="group flex flex-col">
            <Cover src={tool.cover} title={tool.title} className="mb-4 transition-transform group-hover:-translate-y-1" />
            <div className="mb-1.5 text-[15px] font-semibold group-hover:text-accent">{tool.title}</div>
            <div className="mb-2 text-[13px] leading-[1.5] text-text/55 text-pretty">{tool.short}</div>
            <div className="mt-auto font-label text-[10.5px] tracking-[.2em] text-text/40">
              {tool.pages} pages · {tool.format} · Free
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
