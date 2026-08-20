/** HEADLINE.WORLD Tailwind preset · v1.0 · source of truth: BRAND.md
 *  Tailwind v3: in your tailwind.config.js →  presets: [require('./headline-brand/tokens/tailwind.config.js')]
 *  Tailwind v4: prefer tokens.css variables via @theme; this file is for v3 codebases.
 */
module.exports = {
  darkMode: 'class', // dark ("stage") is the DEFAULT look — apply .theme-paper for light
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0B0A0E', 2: '#131118' },
        cream: '#F7F1E6',
        gold: { DEFAULT: '#FFC93C', deep: '#8C6500' },
        pal: {
          pink: '#F4356E', orange: '#FF7A2F', gold: '#FFC93C', green: '#3FCB86',
          blue: '#38B6E8', purple: '#8B5CF6', magenta: '#FF4FA3',
        },
        deep: {
          pink: '#D70645', orange: '#BD4400', gold: '#8C6500', green: '#1E7B4D',
          blue: '#0E749D', purple: '#7B43F9', magenta: '#D60066',
        },
        warm: { // the neutral ramp (warm, never blue-gray)
          100: '#F7F1E6', 200: '#D9D2C6', 300: '#CFC8BC', 400: '#B9B1A4',
          500: '#9A9286', 600: '#8E877C', 700: '#6E675C', 800: '#4A443C',
        },
        surface: {
          1: 'rgba(247,241,230,0.045)',
          2: 'rgba(247,241,230,0.07)',
        },
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],  // 900/800/700/400
        label: ['Oswald', 'sans-serif'],                   // 300/400/500, uppercase + tracked
      },
      letterSpacing: {
        eyebrow: '0.26em', label: '0.20em', nav: '0.16em', display: '-0.015em',
      },
      borderRadius: {
        hw: '6px',
        card: '0 5px 5px 0', // apply via rounded-r-[5px] + rounded-l-none, or arbitrary value
      },
      transitionTimingFunction: { hw: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
      transitionDuration: { fast: '160ms', enter: '280ms' },
      backgroundImage: {
        // the ruled write-surface
        'hw-ruled': 'repeating-linear-gradient(to bottom, transparent, transparent 28px, #C9C2B4 28px, #C9C2B4 29px)',
      },
    },
  },
};
