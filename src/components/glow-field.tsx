// The cover art, as a background layer.
//
// Every book and pack in the series puts the same thing on near-black: soft
// radial blooms of the seven palette colors, some strung together with faint
// lines and small solid nodes. BRAND.md §7 calls the glow the brand's only
// decoration and reserves it for hero backgrounds and celebration moments —
// never behind data tables or forms, which is why this is a marketing-surface
// component and not a general wrapper.
//
// Positions are a fixed table rather than random, so the server and client
// render identical markup and the composition stays art-directed instead of
// being different every reload.

type Bloom = { x: number; y: number; size: number; color: string; opacity: number };

const PALETTE = [
  "var(--hw-pal-1)", // pink
  "var(--hw-pal-2)", // orange
  "var(--hw-pal-3)", // gold
  "var(--hw-pal-4)", // green
  "var(--hw-pal-5)", // blue
  "var(--hw-pal-6)", // purple
  "var(--hw-pal-7)", // magenta
];

// x/y are percentages; size is a percentage of the container's width.
const CONSTELLATION: Bloom[] = [
  { x: 12, y: 26, size: 26, color: PALETTE[5], opacity: 0.5 },
  { x: 27, y: 62, size: 20, color: PALETTE[0], opacity: 0.42 },
  { x: 44, y: 30, size: 30, color: PALETTE[2], opacity: 0.44 },
  { x: 58, y: 68, size: 22, color: PALETTE[4], opacity: 0.46 },
  { x: 72, y: 34, size: 26, color: PALETTE[3], opacity: 0.4 },
  { x: 86, y: 60, size: 24, color: PALETTE[6], opacity: 0.42 },
  { x: 66, y: 14, size: 16, color: PALETTE[1], opacity: 0.38 },
];

// Small solid nodes sitting on top of the blooms, as on the covers.
const NODES: Array<{ x: number; y: number; color: string }> = [
  { x: 12, y: 26, color: PALETTE[5] },
  { x: 27, y: 62, color: PALETTE[0] },
  { x: 44, y: 30, color: PALETTE[2] },
  { x: 58, y: 68, color: PALETTE[4] },
  { x: 72, y: 34, color: PALETTE[3] },
  { x: 86, y: 60, color: PALETTE[6] },
  { x: 66, y: 14, color: PALETTE[1] },
];

export function GlowField({
  className = "",
  intensity = 1,
  showNodes = true,
}: {
  className?: string;
  /** Scales every bloom's opacity. Drop it where type sits on top. */
  intensity?: number;
  showNodes?: boolean;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {CONSTELLATION.map((b, i) => (
        <div
          key={`bloom-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.size}%`,
            aspectRatio: "1",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${b.color} 0%, transparent 68%)`,
            opacity: b.opacity * intensity,
            filter: "blur(28px)",
          }}
        />
      ))}

      {showNodes && (
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Faint strung line through the nodes, as on the pack covers. */}
          <polyline
            points={NODES.map((n) => `${n.x},${n.y}`).join(" ")}
            fill="none"
            stroke="var(--hw-cream)"
            strokeOpacity={0.12}
            strokeWidth={0.15}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {showNodes &&
        NODES.map((n, i) => (
          <span
            key={`node-${i}`}
            className="absolute h-[5px] w-[5px] rounded-full"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              transform: "translate(-50%, -50%)",
              background: n.color,
              boxShadow: `0 0 10px 2px ${n.color}`,
              opacity: 0.9 * intensity,
            }}
          />
        ))}
    </div>
  );
}

/** BRAND.md §5.3 — the seven, in canonical order, never reordered. */
export function DotRow({ className = "", size = 9 }: { className?: string; size?: number }) {
  return (
    <div aria-hidden className={`inline-flex items-center gap-[9px] ${className}`}>
      {PALETTE.map((c, i) => (
        <span key={i} className="rounded-full" style={{ width: size, height: size, background: c }} />
      ))}
    </div>
  );
}
