import { LogoGlyph } from "@/components/logo-glyph";
import Link from "next/link";

// The brand lockup: logo + wordmark with the tagline underneath, aligned to
// the wordmark's left edge (not the logo's). One component so every surface
// renders the identical lockup.
export function BrandLockup({
  size = 26,
  centered = false,
  tagline = true,
  href,
}: {
  size?: number;
  centered?: boolean;
  tagline?: boolean;
  href?: string;
}) {
  // tagline indent = logo width + the gap-2.5 (10px) between logo and wordmark
  const indent = size + 10;

  const inner = (
    <span className={`flex flex-col gap-0.5 ${centered ? "items-center" : "items-start"}`}>
      <span className="flex items-center gap-2.5">
        <LogoGlyph size={size} />
        <span className="text-[15px] font-bold tracking-[-.01em]">HEADLINE.WORLD</span>
      </span>
      {tagline && (
        <span
          className="text-[10.5px] font-medium tracking-[.04em] text-accent"
          style={centered ? undefined : { paddingLeft: indent }}
        >
          Book it. Run it. Own it.
        </span>
      )}
    </span>
  );

  return href ? (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  ) : (
    inner
  );
}
