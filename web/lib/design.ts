/**
 * Central design tokens — type styles, animations, scroll thresholds, colors.
 *
 * Tweak values here and they propagate everywhere they're consumed. Each
 * section has a short note on where the values are actually used.
 *
 * • `type`      → Tailwind class strings (size + weight + leading + tracking).
 *                 Used by AnimatedHeading callsites and headings across the
 *                 case study + homepage. Colour is composed at the use site
 *                 (e.g. `text-text-primary`), so these strings stay reusable.
 *                 Note: h3 / h4 / bodySmall / caption are defined but not yet
 *                 adopted by their target surfaces — those still inline the
 *                 equivalent classes. Refactor when convenient.
 *
 * • `animation` → JS values consumed by framer-motion. The ease curve is also
 *                 the source of truth for the matching inline cubic-bezier
 *                 transitions in Tailwind classes (WorkCard, WorkIndexMediaCard,
 *                 the theme-toggle CSS in globals.css). Direct consumers:
 *                 Reveal, AnimatedHeading, StickyHomeVideo, Accordion,
 *                 FlipOnResize.
 *
 * • `scroll`    → Scroll-position thresholds. Currently drives the homepage
 *                 hero video docking.
 *
 * • `colors`    → Source of truth for theme colours. Emitted as CSS custom
 *                 properties at runtime via `designVariablesCss()`. Tailwind
 *                 utilities (`bg-canvas`, `text-text-primary`, etc.) resolve
 *                 against those variables via globals.css.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPE
// ─────────────────────────────────────────────────────────────────────────────

/** Tailwind class bundles for typography — size, weight, leading, tracking. */
export const type = {
  /** 60.5px Helvetica-style display — "Get in touch" CTA (36px on mobile) */
  display:
    'text-[36px] font-normal leading-[34px] tracking-[-1.2px] md:text-[60.5px] md:leading-[52.7px] md:tracking-[-2.17px]',

  /** 56px section heading — TLDR / Our Work / Awards on the homepage, Work
   *  index header, case study title (36px on mobile). */
  h1: 'text-[36px] font-medium leading-[34px] tracking-[-1.5px] md:text-[56px] md:leading-[52px] md:tracking-[-2.56px]',

  /** 48px secondary heading — homepage intro paragraph (30px on mobile) */
  h2Large:
    'text-[30px] font-medium leading-[32px] tracking-[-0.4px] md:text-[48px] md:leading-[48px] md:tracking-[-0.6px]',

  /** 24px sub-heading — Work intro blocks, Clients heading */
  h2: 'text-2xl font-medium leading-6 tracking-[-0.4px]',

  /** 18px medium label — project name in case study card */
  h3: 'text-lg font-medium leading-[18px] tracking-[-0.27px]',

  /** 16px small label — Description / Capabilities / Contact / Questions headings */
  h4: 'text-base font-medium leading-[18px] tracking-[-0.176px]',

  /** 18px body / paragraph */
  bodyLarge: 'text-lg leading-[20px] tracking-[-0.2px]',

  /** 18px paragraph — TLDR question bodies, year/links */
  body: 'text-lg leading-5 tracking-[-0.27px]',

  /** 14px paragraph — description card body, news card meta */
  bodySmall: 'text-sm leading-[22px] tracking-[-0.084px]',

  /** 12px small caps-ish — discipline / capability tags */
  caption: 'text-xs font-medium leading-4',

  /** 15.75px footer copy */
  footer: 'text-[15.75px] leading-4 tracking-[-0.6px]',
} as const

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

export const animation = {
  /** Default easing — ease-out-expo. Snappy start, smooth settle. */
  ease: [0.16, 1, 0.3, 1] as const,

  /** Seconds. `short` for compact UI motion (Accordion), `medium` for Reveal
   *  defaults, `long` for hero-scale word-by-word entrances. */
  duration: {
    short: 0.4,
    medium: 0.6,
    long: 0.95,
  },

  /** Seconds between staggered children (word-by-word reveal, list cascades). */
  stagger: {
    tight: 0.05,
    normal: 0.08,
  },

  /** Defaults for the on-scroll `Reveal` wrapper. */
  reveal: {
    /** Px the element travels in from below. */
    offset: 32,
    /** Negative bottom inset so animation fires shortly before fully visible. */
    rootMarginPx: 80,
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL
// ─────────────────────────────────────────────────────────────────────────────

export const scroll = {
  /**
   * Hero video docking band — at TRIGGER_START the video is still centred,
   * by TRIGGER_END it's fully docked to the bottom-right corner.
   */
  heroVideoTrigger: {
    start: 240,
    end: 900,
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// COLORS — single source of truth. Emitted as CSS variables at runtime.
// ─────────────────────────────────────────────────────────────────────────────

/** Dark palette — the default theme. */
export const colors = {
  canvas: '#000000',
  surface: '#1d1d1d',
  textPrimary: '#eeeeee',
  textSecondary: '#9f9f9f',
  textMuted: '#b3b3b3',
  textFaint: '#525252',
  border: '#474747',
} as const

/**
 * Light palette — mapped from the Figma "Foundations" token doc:
 * UI/canvas #ffffff, UI/surface #f6f6f6, UI/border #b4b4b4,
 * Content/primary #1d1d1d, Content/secondary #525252. textMuted and textFaint
 * have no 1:1 Figma token for our names, so they're derived to keep the same
 * visual relationships on a light ground.
 */
export const lightColors: Record<keyof typeof colors, string> = {
  canvas: '#ffffff',
  surface: '#f6f6f6',
  textPrimary: '#1d1d1d',
  textSecondary: '#525252',
  textMuted: '#767676',
  textFaint: '#8f8f8f',
  border: '#b4b4b4',
}

function varBlock(palette: Record<keyof typeof colors, string>): string {
  return `  --color-canvas: ${palette.canvas};
  --color-surface: ${palette.surface};
  --color-text-primary: ${palette.textPrimary};
  --color-text-secondary: ${palette.textSecondary};
  --color-text-muted: ${palette.textMuted};
  --color-text-faint: ${palette.textFaint};
  --color-border: ${palette.border};`
}

/**
 * CSS that sets the `--color-*` custom properties consumed by Tailwind's theme
 * tokens (see `globals.css`). Dark is the default on `:root`; light applies when
 * `<html data-theme="light">`. Injected in `<head>` from the root layout so this
 * stays the runtime source of truth.
 */
export function designVariablesCss(): string {
  return `:root {
  color-scheme: dark;
${varBlock(colors)}
}
:root[data-theme="light"] {
  color-scheme: light;
${varBlock(lightColors)}
}`
}
