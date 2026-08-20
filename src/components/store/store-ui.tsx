import Image from "next/image";

// Shared furniture for the store and free-tool pages, so the brand motifs
// are defined once. Everything here follows
// .claude/skills/headline-brand/BRAND.md — no hex values, tokens only.

/** Oswald, uppercase, tracked. BRAND.md §4.1 "Eyebrow". */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`font-label text-[12px] tracking-[.26em] text-text/45 ${className}`}>{children}</div>
  );
}

/** The gold rule that follows every H1. §5.1. Rendered explicitly where a
 *  heading needs it inside a flex column that the global h1::after would sit
 *  awkwardly in. */
export function AccentRule({ className = "", tone }: { className?: string; tone?: string }) {
  return <div className={`h-[3px] w-16 ${className}`} style={{ background: tone ?? "var(--color-accent)" }} />;
}

/** The system's card: surface fill, accent left border, 0 5px 5px 0. §5.2 */
export function LeftBorderCard({
  children,
  tone,
  className = "",
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <div
      className={`border-y border-r border-border bg-surface px-5 py-4 transition-colors hover:bg-surface-nested ${className}`}
      style={{ borderLeft: `3px solid ${tone ?? "var(--color-accent)"}`, borderRadius: "0 5px 5px 0" }}
    >
      {children}
    </div>
  );
}

/** A document cover. It is a document — let it look like one. */
export function Cover({
  src,
  title,
  priority = false,
  className = "",
}: {
  src: string;
  title: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-[1000/1294] w-full overflow-hidden rounded-[4px] shadow-2xl shadow-black/50 ${className}`}>
      <Image src={src} alt={`${title} — cover`} fill sizes="(max-width: 768px) 100vw, 420px" priority={priority} className="object-cover" />
    </div>
  );
}

export function MetaRow({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="flex flex-wrap gap-x-7 gap-y-2.5">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="font-label text-[10.5px] tracking-[.2em] text-text/40">{label}</dt>
          <dd className="mt-0.5 text-[13.5px] text-text/80">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Catalogue prices are dollars-as-floats (19, 15.99), not cents, so
 * subtracting them produces the usual binary-fraction noise — a $113.99
 * saving renders as $113.99000000000001 straight out of the arithmetic.
 * Every price on these pages goes through here.
 *
 * Whole dollars stay whole: "$89", not "$89.00".
 */
export function usd(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
}
