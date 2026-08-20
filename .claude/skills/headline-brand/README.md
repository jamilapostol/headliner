# headline-brand — plug-in brand kit for Claude Code

This folder is a ready-to-use **Claude Code skill** that teaches Claude the complete
Headline.world / Artist Operator brand system, so any frontend work it does on the
website or app comes out matching the book, the packs, the Playbook, and the merch.

## Install (pick one)

**As a project skill (recommended):**
```
your-repo/
└── .claude/
    └── skills/
        └── headline-brand/   ← copy this whole folder here
```
Claude Code discovers it automatically. Then just ask: *"restyle the dashboard to match the brand"* — the skill triggers on any headline.world frontend task.

**As a personal skill:** copy to `~/.claude/skills/headline-brand/`.

**Minimal alternative:** add one line to your repo's `CLAUDE.md`:
`When doing any UI/frontend work, follow docs/BRAND.md strictly.` and copy `BRAND.md` to `docs/`.

## What's inside

| File | Purpose |
|---|---|
| `SKILL.md` | The skill entry — non-negotiable rules + workflow Claude follows |
| `BRAND.md` | The full specification: color (with measured WCAG contrast), type, motifs, components, motion, voice, do/don't |
| `tokens/tokens.css` | CSS custom properties + signature-motif helper classes (`.hw-card`, `.hw-rule`, `.hw-dots`, `.hw-write`) — dark default, `.theme-paper` light mode |
| `tokens/tailwind.config.js` | Tailwind v3 preset with the same values |
| `tokens/tokens.json` | Raw design tokens for any other pipeline |
| `reference/styleguide.html` | Living reference page — open in a browser to see every component rendered correctly |

## Wiring the tokens into the app

- **Plain CSS / any framework:** import `tokens/tokens.css` globally; use `var(--hw-*)` everywhere. Light mode = add `theme-paper` class (or `data-theme="paper"`) to `<html>`.
- **Tailwind v3:** `presets: [require('./.claude/skills/headline-brand/tokens/tailwind.config.js')]`
- **Tailwind v4:** reference the CSS variables from `tokens.css` in your `@theme` block.
- **Fonts:** Archivo 400/700/800/900 + Oswald 300/400/500 (Google Fonts or Fontsource, latin subset, `font-display: swap`).

## The five-second version of the brand

Ink `#0B0A0E` background · Cream `#F7F1E6` text · Gold `#FFC93C` accent (one CTA per view, ink text on gold) · the seven-color palette in fixed order `#F4356E #FF7A2F #FFC93C #3FCB86 #38B6E8 #8B5CF6 #FF4FA3` · Archivo for statements, Oswald (uppercase, tracked) for labels · left-border cards, the 3px gold rule under H1s, the seven-dot row, ruled white write-surfaces, the logo+tagline footer. Full rules in `BRAND.md`.
