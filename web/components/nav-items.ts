/** Primary navigation — used by MobileNav (the logo covers "home" there). */
export const NAV_ITEMS = [
  {label: 'Work', href: '/work'},
  {label: 'Info', href: '/info'},
  {label: 'Play', href: '/play'},
  {label: '@', href: 'mailto:hello@re.design'},
] as const

/** Desktop pill nav (Figma 406:7297) — leads with a Re.design home pill. */
export const DESKTOP_NAV_ITEMS = [
  {label: 'Re.design', href: '/'},
  ...NAV_ITEMS,
] as const
