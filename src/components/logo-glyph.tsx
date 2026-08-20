// The brand glyph. BRAND.md §2: cream on dark, ink on light, never recolored
// into a palette color.
//
// Rendered as a CSS mask rather than an <img> so it takes `currentColor` and
// follows the theme automatically — an <img> would isolate the SVG and its
// currentColor would resolve to black, which is invisible on ink. One asset
// covers both modes.
//
// The artwork is 1692×2004, so height is the controlling dimension and width
// follows the real ratio instead of being forced square.
const RATIO = 1692 / 2004;

export function LogoGlyph({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="HEADLINE.WORLD"
      className={`inline-block flex-none bg-current ${className}`}
      style={{
        height: size,
        width: Math.round(size * RATIO),
        WebkitMaskImage: "url(/headline-logo.svg)",
        maskImage: "url(/headline-logo.svg)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
