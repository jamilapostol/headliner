# HEADLINE.WORLD — Brand & UI Style Guidelines

*Version 1.0 · August 2026 · The single source of truth for the Headline.world website and app, matching the Artist Operator book, the supplement packs, the Playbook, and the merch line.*

**Tagline:** Book it. Run it. Own it.
**Parent voice:** THE ARTIST OPERATOR by Jamil Apostol.

---

## 1. Brand essence

Headline.world is the operating system for independent touring musicians — the software continuation of a book whose whole argument is: *run the career, keep the art.* The visual system reflects that split personality on purpose:

- **The stage:** near-black ink, saturated color glows, big condensed type. Night, venues, festival light. This is the app's default world.
- **The paper:** cream, ruled lines, ink text. The workbook, the settlement sheet, the signed page. This is the app's light mode and its print/document surfaces.

Everything the user sees should feel like it belongs to the same object as the book covers and the packs: dark room, seven lights, one gold line.

**The feel in five words:** operational, warm, confident, specific, human.
**Never:** corporate blue, gradient-startup glossy, sterile gray SaaS, cold.

---

## 2. Logo

The mark is the globe-with-eighth-note glyph; the wordmark is **HEADLINE.WORLD** set in Oswald 500, uppercase, letter-spacing 0.20em–0.30em.

- On dark (default): glyph and wordmark in Cream `#F7F1E6`; the tagline beneath in Gold `#FFC93C`, Oswald 300, letter-spacing 0.14em.
- On light: glyph and wordmark in Ink `#0B0A0E`.
- Signature lockup (used as page/app footer, exactly as on every pack): glyph at ~26px, wordmark stacked with the tagline under it. Do not rearrange this lockup.
- Clear space: the glyph's own width on all sides. Minimum glyph size 16px.
- Never: recolor the glyph in palette colors, add drop shadows, outline it, or set the wordmark in Archivo.

---

## 3. Color

### 3.1 Core trio

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0B0A0E` | The background of the brand. Not pure black — it has a violet-warm cast. All dark surfaces derive from it. |
| `cream` | `#F7F1E6` | The text color of the brand on dark, and the paper surface in light mode. Never use pure white `#FFFFFF` for text or backgrounds — the only white allowed is inside "paper" write-surfaces (see 3.4). |
| `gold` | `#FFC93C` | The brand accent. Primary CTAs, the signature rule, active states, the tagline, key numbers. Gold is spent, not sprayed: one primary gold action per view. |

### 3.2 The seven-color palette

The exact seven, in canonical order (this order is also the data-viz series order):

| # | Token | Hex | Six-Jobs meaning | UI semantic role |
|---|---|---|---|---|
| 1 | `pal-pink` | `#F4356E` | CREATE | Destructive, errors, live/recording |
| 2 | `pal-orange` | `#FF7A2F` | BUILD | Warnings, attention, pending |
| 3 | `pal-gold` | `#FFC93C` | DISTRIBUTE | Primary accent, selection, progress |
| 4 | `pal-green` | `#3FCB86` | CONNECT | Success, money in, confirmed |
| 5 | `pal-blue` | `#38B6E8` | MONETIZE* | Info, links, AI/automation features |
| 6 | `pal-purple` | `#8B5CF6` | SERVE | Premium, "stays human" flags |
| 7 | `pal-magenta` | `#FF4FA3` | — (7th, parts/series only) | Community & fans |

*The Six-Jobs column is the mapping used across the book and packs — when a screen is explicitly about one of the Six Jobs (audit scores, job filters), use that mapping. Everywhere else, use the UI semantic column. When the two conflict on one screen, the Six-Jobs mapping wins and generic semantics fall back to neutral styling.*

**Feature-area accents** (each product area owns one accent, used for its left-border cards, active nav item, and charts):

- Booking pipeline & tours → `pal-gold`
- Fan CRM / Direct Line → `pal-green`
- Money, settlements, royalties → `pal-blue`
- Merch & inventory → `pal-orange`
- Contracts vault → `pal-purple`
- Day sheets / show day → `pal-pink`
- Community → `pal-magenta`

### 3.3 Neutrals (the gray ramp on dark)

Derived from cream, warm, never blue-gray:

| Token | Hex | Use on ink |
|---|---|---|
| `gray-100` | `#F7F1E6` | Primary text (= cream) |
| `gray-200` | `#D9D2C6` | Secondary text, subheads |
| `gray-300` | `#CFC8BC` | Body text (long-form) |
| `gray-400` | `#B9B1A4` | Tertiary text, helper text |
| `gray-500` | `#9A9286` | Placeholder, hints |
| `gray-600` | `#8E877C` | Muted labels |
| `gray-700` | `#6E675C` | Footer text, disabled (decoration only — fails AA for essential text) |
| `gray-800` | `#4A443C` | Hairlines, input underlines, borders |
| `surface-1` | `rgba(247,241,230,0.045)` | Card fill on ink (the pack card fill) |
| `surface-2` | `rgba(247,241,230,0.07)` | Hover/raised card fill |
| `ink-2` | `#131118` | Elevated dark surface (modals, popovers) |

### 3.4 The two modes

**Stage (dark, default).** Background `ink`. Text `cream`/gray ramp. Accents at full palette values. This is where the brand lives; marketing pages and the app default here.

**Paper (light).** Background `cream` (never white). Text `ink`. Cards: white `#FFFFFF` with the ruled-line motif where users write/edit (the packs' write-box: white fill, repeating rule lines every 0.3em-ish, 3px left accent border). **Accent text on cream must use the darkened `-deep` variants below** — the bright palette fails contrast on cream for text (gold on cream is 1.37:1). Bright palette values on cream are allowed only as borders, fills, chart marks, and display type ≥ 24px/700.

| Token | Hex | Contrast on cream |
|---|---|---|
| `pink-deep` | `#D70645` | 4.7:1 |
| `orange-deep` | `#BD4400` | 4.7:1 |
| `gold-deep` | `#8C6500` | 4.7:1 |
| `green-deep` | `#1E7B4D` | 4.7:1 |
| `blue-deep` | `#0E749D` | 4.7:1 |
| `purple-deep` | `#7B43F9` | 4.7:1 |
| `magenta-deep` | `#D60066` | 4.6:1 |

### 3.5 Contrast facts (WCAG, measured)

On `ink`: cream 17.6:1 · gold 12.9:1 · green 9.5:1 · blue 8.5:1 · orange 7.6:1 · magenta 6.5:1 · pink 5.3:1 · purple 4.7:1 — all pass AA for normal text; purple and pink reserved for text ≥ 14px medium anyway. `gray-700` (3.5:1) is decorative only.

**Rules:** never place palette colors on palette colors. Never put cream text on gold — gold buttons take ink text. Charts follow the canonical palette order, always starting from pink, skipping nothing.

---

## 4. Typography

Two families, loaded once, no substitutes:

- **Archivo** — weights 900, 800, 700, 400. The voice of statements. All display, headings, big numbers, buttons, body.
- **Oswald** — weights 300, 400, 500. The voice of labels. All eyebrows, section labels, nav, tags, metadata — always uppercase, always letterspaced.

If self-hosting: Google Fonts / Fontsource, latin subset, `font-display: swap`.

### 4.1 The scale (desktop / mobile)

| Style | Family & weight | Size | Tracking | Case | Use |
|---|---|---|---|---|---|
| Display | Archivo 900 | 64–96px / 40–56px | −0.015em | UPPER | Hero statements, cover-style screens. Line-height 0.95–1.05 |
| H1 | Archivo 800 | 32–40px / 28px | 0 | UPPER | Page titles. Followed by the accent rule (see 5.1) |
| H2 | Archivo 800 | 24px / 20px | 0 | UPPER | Section heads |
| H3 | Archivo 700 | 18px / 16px | 0 | Sentence | Card titles |
| Body | Archivo 400 | 15–16px | 0 | Sentence | Line-height 1.55–1.6, color `gray-300` on dark |
| Small | Archivo 400 | 13px | 0 | Sentence | `gray-400` |
| Big number | Archivo 900 | 28–64px | −0.01em | — | KPIs, money, counts. Numbers are content in this product — let them be huge |
| Eyebrow | Oswald 300 | 12–13px | 0.24–0.28em | UPPER | The line above a title. Often `gray-400` with one word in an accent |
| Label | Oswald 400 | 11–12px | 0.18–0.22em | UPPER | Form labels, table headers, tags |
| Nav / wordmark | Oswald 500 | 13–15px | 0.14–0.20em | UPPER | Navigation, the wordmark |
| Quote | Oswald 300 | 20–28px | 0.015em | Sentence | Pull quotes, empty states. Line-height 1.3, in an accent color or gold |

### 4.2 Type rules

- Bold inside body text renders in `cream` (on dark) — that is how the packs emphasize: `<b>` brightens, it doesn't just thicken.
- Prevent orphan words in headings and quotes: `text-wrap: balance` on headings, `text-wrap: pretty` on body.
- Numbers in tables and KPIs: `font-variant-numeric: tabular-nums`.
- Never use Oswald for paragraphs. Never letterspace Archivo body. Never use italic Oswald.

---

## 5. Signature motifs

These five details are what make a screen unmistakably Headline. Use them.

### 5.1 The accent rule
Every H1 is followed by a short thick rule: 48–96px wide, 3px tall, gold (or the feature-area accent). It is the UI descendant of the gold rule on every book cover.

### 5.2 The left-border card
The system's card: `surface-1` fill, radius `0 5px 5px 0`, and a 3–4px solid left border in the contextual accent. Content: an Oswald label line, then Archivo content. Hover: fill moves to `surface-2`. This is the packs' `.card`/`.grow` pattern and should be the app's default list item, tip box, and panel.

### 5.3 The dot row
Seven (or fewer) 8–11px circles in canonical palette order, 8–9px gaps. Used as: brand flourish under heroes, loading indicator, step/progress marker (filled = done, 30% opacity = todo). Never reorder the colors.

### 5.4 The ruled write-surface (paper mode / inputs of record)
Where the user records something that matters — notes on a show, the settlement, an audit answer — the field is white with printed rule lines (repeating linear-gradient, hairline `#C9C2B4`, ~29px pitch) and a 3px left accent border. The app's inputs of record should feel like the workbook.

### 5.5 The signature footer
Bottom of marketing pages, settlement PDFs, exports, and emails: left — `THE ARTIST OPERATOR · [CONTEXT]` or `HEADLINE.WORLD · [CONTEXT]` in Oswald 400 11px tracking 0.22em `gray-700`; right — logo glyph + stacked wordmark and gold tagline. Exports from the app should look like pages from the packs.

---

## 6. Components

**Buttons.**
- Primary: gold fill, **ink text** (Archivo 700, 14–15px), radius 6px, padding 12×20. Hover: brightness 1.06. One per view.
- Secondary: transparent, 1.5px `gray-800` border, cream text. Hover: border cream.
- Destructive: `pal-pink` fill, ink text (dark mode) / `pink-deep` fill, cream text (light).
- Ghost/tertiary: cream text, gold on hover. Button labels are sentence case; only tiny "tag buttons" may use Oswald uppercase.

**Inputs.** Dark mode: `ink-2` field, 1px `gray-800` border, radius 6px, cream text, `gray-500` placeholder; focus = 2px gold ring (`outline-offset: 2px`). Labels above in Oswald label style with the contextual accent color. Errors: `pal-pink` border + 13px Archivo message.

**Tables.** Header row: Oswald label style, `gray-500`, hairline bottom border `gray-800`. Rows: 1px hairlines only — no zebra striping. Row hover: `surface-1`. Money right-aligned, tabular-nums; positive `pal-green`, negative `pal-pink` (deep variants in light mode).

**Badges / status.** Pill, Oswald 400 11px tracking 0.16em uppercase; 12% opacity accent fill + full-strength accent text (dark mode). Statuses use the booking pipeline vocabulary wherever true: PROSPECT blue · PITCHED green · HOLD gold · CONFIRMED orange · SETTLED pink.

**Navigation.** Dark rail or top bar on `ink`; items Oswald 500 tracking 0.14em; inactive `gray-500`, hover cream, active cream with 3px accent left-border (rail) or underline (top bar) in the feature-area accent.

**Empty states.** Never a gray void: a Quote-style line in gold (voice: see §8), one sentence of body, one primary action. Example: *"No shows in the pipeline yet."* / "Three prospects per open night — start with the first one." / [Add a prospect].

**Toasts.** `ink-2`, left accent border by semantic color, cream text. Success confirmations may use the celebration glow (see §7).

**Charts.** Follow the dataviz conventions of the packs: series colors in canonical palette order; single-metric charts use the feature-area accent; grid hairlines `gray-800`; axis labels Oswald 11px `gray-500`; no 3D, no gradients except the glow motif. Sequential ramps: accent → transparent-toward-ink.

---

## 7. Motion & effects

- Standard transitions 150–200ms ease-out (hovers, fills); entrances 250–300ms with 4–8px translate-up + fade.
- **The glow** is the brand's only decoration: soft radial blooms of palette color (the cover-art "burst"). Reserve it for celebration moments — show settled, retreat sold out, first fan captured, onboarding complete — and hero backgrounds. Never behind data tables or forms.
- Respect `prefers-reduced-motion`: kill translates and glows, keep opacity fades.

---

## 8. Voice & microcopy

The interface speaks in the book's voice: plain, specific, second person, warm but not chummy, allergic to jargon and hype.

- Verbs first, specifics always: "Settle the night" not "Complete transaction workflow". "3 pitches waiting on a reply" not "3 pending outreach items".
- The product repeats the book's laws where they fit, as one-liners in empty states, tooltips, and confirmations: *"The count is the pay."* (merch) · *"A text thread is not a contract."* (contracts) · *"Your direct line hears it first."* (fan blasts) · *"Fat months fund lean months."* (money).
- Sentence case everywhere except Oswald labels (which are always uppercase).
- Numbers are never rounded away: "$1,384" not "~$1.4k" in records; abbreviations allowed in charts only.
- Errors: say what happened and the next move, no apology theater. "That date is already confirmed at The Holland Project. Pick another night or edit the existing show."
- Never: "oops", "uh-oh", emoji in system copy, exclamation points in operational copy (one is allowed in a celebration toast).

---

## 9. Accessibility checklist

- AA contrast minimum everywhere; the tables in §3.5 are pre-measured — trust them.
- On cream, colored text uses `-deep` variants, period.
- `gray-700` and below: decoration only.
- Focus visible on every interactive element: 2px gold ring, offset 2px (gold-deep in light mode).
- Hit targets ≥ 44×44px on touch; the dot-row when used as progress gets an aria-label.
- Palette color is never the only signal: pair with a label, icon, or position (pipeline stages are numbered as well as colored).

---

## 10. Do / Don't

**Do:** ink first · one gold action per screen · left-border cards · Oswald labels over everything · huge honest numbers · quotes from the book in empty states · exports that look like the packs.

**Don't:** pure black or pure white backgrounds · blue-gray neutrals · gradients on buttons · palette-on-palette · cream text on gold · reordering the seven dots · Oswald paragraphs · glow effects behind data · more than two accent colors on one screen (feature accent + semantic state is the max).
