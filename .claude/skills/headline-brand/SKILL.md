---
name: headline-brand
description: >
  Apply the Headline.world / Artist Operator brand system to any UI work on the
  headline.world website or app. Use this skill whenever styling, restyling, or
  building frontend for headline.world — pages, components, themes, emails,
  exports, charts, or marketing surfaces. Triggers: "match the brand",
  "headline style", "make it look like the book/packs", any headline.world
  frontend task.
---

# Headline.world brand skill

You are styling the software arm of THE ARTIST OPERATOR brand. The complete
specification lives in `BRAND.md` in this skill's directory — **read it before
writing any styles**. Ready-made tokens are in `tokens/`:

- `tokens/tokens.css` — CSS custom properties (drop into the global stylesheet; also works as a Tailwind v4 `@theme` source)
- `tokens/tailwind.config.js` — Tailwind v3 preset (`presets: [require('./tailwind.config.js')]`)
- `tokens/tokens.json` — raw design tokens for any other pipeline
- `reference/styleguide.html` — a living reference page; open it to see every component rendered correctly before imitating it

## Non-negotiables (the short version)

1. **Dark by default.** Background `--hw-ink #0B0A0E`, text `--hw-cream #F7F1E6`. Light mode is "paper": cream background (never white), ink text, white ruled write-surfaces.
2. **Fonts:** Archivo (900/800/700/400) for display, headings, numbers, body, buttons. Oswald (300/400/500) for eyebrows, labels, nav, tags — always uppercase + letterspaced. No other fonts, no italic Oswald, no Oswald paragraphs.
3. **Gold `#FFC93C` is the primary accent** — one gold CTA per view, ink text on gold buttons, never cream-on-gold.
4. **The seven palette colors are fixed and ordered:** `#F4356E #FF7A2F #FFC93C #3FCB86 #38B6E8 #8B5CF6 #FF4FA3`. Chart series use this exact order. Semantic roles and the Six-Jobs/feature-area mapping are in BRAND.md §3.2 — never invent new colors or reorder the dot row.
5. **On cream backgrounds, colored TEXT must use the `-deep` variants** (BRAND.md §3.4); bright palette values on cream are borders/fills/display-type only.
6. **Signature motifs** (use them, they are the brand): the 3px gold rule under every H1; left-border cards (`rgba(247,241,230,.045)` fill, radius `0 5px 5px 0`, 3–4px accent left border); the seven-dot row; ruled white write-surfaces for inputs of record; the logo+tagline footer lockup on exports and marketing pages.
7. **Voice:** plain, specific, second person. Empty states quote the book's laws ("The count is the pay."). No "oops", no emoji in system copy.
8. **Accessibility:** AA minimum, 2px gold focus ring on everything interactive, color never the only signal. Contrast values are pre-measured in BRAND.md §3.5.

## Workflow

1. Read `BRAND.md` in full.
2. Wire in `tokens/tokens.css` (or the Tailwind preset) rather than hard-coding values; if a needed token is missing, derive it from the ramp in BRAND.md and add it to the tokens file — do not inline hex values in components.
3. When building a new component, check `reference/styleguide.html` for an existing pattern first and match it.
4. Audit your result against BRAND.md §10 (Do/Don't) before finishing.
