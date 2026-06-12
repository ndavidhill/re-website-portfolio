/**
 * Central design tokens — type styles, animations, scroll thresholds, colors,
 * chrome primitives.
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
 *
 * • `ui`        → Reusable chrome primitives — pill, badge, chip, button
 *                 shapes. Each is a Tailwind class string consumed via
 *                 template literals at the call site. Colour-variant pieces
 *                 (chip.active vs chip.inactive) compose with the base
 *                 string. New variants live here as soon as a second call
 *                 site appears.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPE
// ─────────────────────────────────────────────────────────────────────────────

/** Tailwind class bundles for typography — size, weight, leading, tracking. */
export const type = {
  /** 60.5px Helvetica-style display — "Get in touch" CTA (36px on mobile) */
  display:
    'text-[36px] font-medium leading-[34px] tracking-[-1.2px] md:text-[56px] md:leading-[48.7px] md:tracking-[-2.17px]',

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
// UI — reusable chrome shapes (pills, badges, chips, buttons).
//
// Each entry is a Tailwind class string. Compose with theme colours / state
// at the call site:  className={`${ui.button.iconSm} text-text-primary
// hover:bg-surface`}.  Add a variant here as soon as a second call site
// needs the same shape.
// ─────────────────────────────────────────────────────────────────────────────

export const ui = {
  pill: {
    /**
     * Glassmorphic label pill centred over a media card. Used inside a
     * `group` parent — the colour bumps on hover come from the group state.
     * Caller supplies the visibility rule (always-on or
     * opacity-0/group-hover:opacity-100) and any transition timing.
     * Used by WorkCard and WorkIndexMediaCard.
     */
    glassOverlay:
      'pointer-events-none absolute left-1/2 top-1/2 flex max-w-[calc(100%-24px)] ' +
      '-translate-x-1/2 -translate-y-1/2 items-center justify-center ' +
        'rounded-full bg-white/40 px-4 pt-[0.1rem] pb-[0.35rem] backdrop-blur-md ' +
      'text-[22px] font-medium leading-[1.4] tracking-[-0.2px] text-[#333] ' +
      'group-hover:bg-white/70 group-hover:text-[#0a0a0a]',
  },

  badge: {
    /** Green NEW indicator. Caller positions it (e.g. absolute top-left). */
    new:
      'inline-flex items-center justify-center rounded-[4px] bg-[#1fc16b] ' +
      'px-2 pt-0.5 pb-1 text-[14px] font-medium uppercase leading-none ' +
      'tracking-[0.4px] text-white',
  },

  chip: {
    /**
     * Base chip shape — h-6, rounded-md, 1px border. Caller picks the
     * active/inactive variant for colour + bg + border-colour.
     */
    base:
      'flex h-7 items-center rounded-md border px-2 text-xs font-medium ' +
      'leading-4 transition-colors',
    /** Highlighted state. */
    active: 'border-transparent bg-text-primary/10 text-text-primary',
    /** Muted state. */
    inactive: 'border-border text-text-faint',
  },

  button: {
    /**
     * Subtle outlined button — carousel arrows etc. Inherits text-secondary,
     * hovers to surface bg and primary text.
     */
    secondary:
      'flex h-9 items-center rounded-lg border border-border bg-canvas px-3 ' +
      'text-sm text-text-secondary transition-colors ' +
      'hover:bg-surface hover:text-text-primary',
    /**
     * 32×32 rounded-lg icon-only button — theme toggle, mobile menu open /
     * close. Variant-agnostic: caller supplies the bg + text colour and any
     * hover/focus rule for the specific surface it lives on.
     */
    iconSm:
      'flex h-[32px] w-[32px] items-center justify-center rounded-lg ' +
      'transition-colors',
  },
} as const

// ─────────────────────────────────────────────────────────────────────────────
// COLORS — single source of truth. Emitted as CSS variables at runtime.
// ─────────────────────────────────────────────────────────────────────────────

/** Dark palette — the default theme. textFaint is the dimmest tier that still
 *  clears WCAG AA for normal text on canvas (#767676 ≈ 4.6:1 on black —
 *  the previous #525252 measured 2.7:1 and failed even large-text AA). */
export const colors = {
  canvas: '#000000',
  surface: '#1d1d1d',
  textPrimary: '#eeeeee',
  textSecondary: '#9f9f9f',
  textMuted: '#b3b3b3',
  textFaint: '#767676',
  border: '#474747',
} as const

/**
 * Light palette — mapped from the Figma "Foundations" token doc:
 * UI/canvas #ffffff, UI/surface #f6f6f6, UI/border #b4b4b4,
 * Content/primary #1d1d1d, Content/secondary #525252. textMuted and textFaint
 * have no 1:1 Figma token for our names, so they're derived to keep the same
 * visual relationships on a light ground — while keeping every tier above
 * WCAG AA for normal text on white (secondary 7.9:1, muted 5.4:1, faint
 * 4.6:1; the previous faint #8f8f8f measured 3.2:1 and failed).
 */
export const lightColors: Record<keyof typeof colors, string> = {
  canvas: '#ffffff',
  surface: '#f6f6f6',
  textPrimary: '#1d1d1d',
  textSecondary: '#525252',
  textMuted: '#6a6a6a',
  textFaint: '#757575',
  border: '#b4b4b4',
}

/**
 * Desktop nav pill state ramp (Figma 406:7298). Rest matches the Figma
 * `neutral/light/05` pill exactly in both themes; hover and active step the
 * emphasis toward maximum contrast against that theme's canvas — lighter on
 * dark (#d2d2d2 → #e6e6e6 → #ffffff), darker on light (#d2d2d2 → #bfbfbf →
 * #1d1d1d with light text).
 */
const navPill = {
  dark: {
    bg: '#d2d2d2',
    bgHover: '#e6e6e6',
    bgActive: '#ffffff',
    fg: '#0a0a0a',
    fgActive: '#0a0a0a',
  },
  light: {
    bg: '#d2d2d2',
    bgHover: '#bfbfbf',
    bgActive: '#1d1d1d',
    fg: '#0a0a0a',
    fgActive: '#f5f5f5',
  },
} as const

function navPillBlock(p: (typeof navPill)[keyof typeof navPill]): string {
  return `  --nav-pill-bg: ${p.bg};
  --nav-pill-bg-hover: ${p.bgHover};
  --nav-pill-bg-active: ${p.bgActive};
  --nav-pill-fg: ${p.fg};
  --nav-pill-fg-active: ${p.fgActive};`
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
${navPillBlock(navPill.dark)}
}
:root[data-theme="light"] {
  color-scheme: light;
${varBlock(lightColors)}
${navPillBlock(navPill.light)}
}`
}
