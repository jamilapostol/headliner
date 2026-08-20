"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Cover, usd } from "@/components/store/store-ui";

type Card = {
  slug: string;
  title: string;
  short: string;
  price: number;
  cover: string;
  tag: string;
  featured: boolean;
};

/** Turns `int:touring` into `Touring` — the tags are machine labels, not copy. */
function tagLabel(tag: string): string {
  const bare = tag.includes(":") ? tag.split(":")[1] : tag;
  return bare.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function StoreFilter({ packs }: { packs: Card[] }) {
  const [active, setActive] = useState<string | null>(null);

  const tags = useMemo(() => [...new Set(packs.map((p) => p.tag))].sort(), [packs]);
  const shown = active ? packs.filter((p) => p.tag === active) : packs;

  return (
    <>
      <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Filter packs by topic">
        <button
          onClick={() => setActive(null)}
          aria-pressed={active === null}
          className={`min-h-[36px] rounded-pill border px-4 py-1.5 font-label text-[10.5px] tracking-[.16em] transition-colors ${
            active === null ? "border-accent bg-accent-soft text-accent" : "border-border text-text/55 hover:border-text/30"
          }`}
        >
          All {packs.length}
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActive(tag === active ? null : tag)}
            aria-pressed={tag === active}
            className={`min-h-[36px] rounded-pill border px-4 py-1.5 font-label text-[10.5px] tracking-[.16em] transition-colors ${
              tag === active ? "border-accent bg-accent-soft text-accent" : "border-border text-text/55 hover:border-text/30"
            }`}
          >
            {tagLabel(tag)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((p) => (
          <Link key={p.slug} href={`/artist-operator/packs/${p.slug}`} className="group relative flex flex-col">
            {p.featured && (
              // A quiet gold corner, not a shouty badge.
              <span
                aria-hidden
                className="absolute top-0 right-0 z-10 h-0 w-0"
                style={{ borderTop: "22px solid var(--color-accent)", borderLeft: "22px solid transparent" }}
              />
            )}
            <Cover src={p.cover} title={p.title} className="mb-4 transition-transform group-hover:-translate-y-1" />
            <div className="mb-1.5 text-[14.5px] font-semibold group-hover:text-accent">{p.title}</div>
            <div className="mb-3 text-[12.5px] leading-[1.5] text-text/55 text-pretty">{p.short}</div>
            <div className="mt-auto font-mono text-[15px] font-bold">{usd(p.price)}</div>
          </Link>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="py-12 text-center text-[14px] text-text/50">Nothing under that one yet.</p>
      )}
    </>
  );
}
