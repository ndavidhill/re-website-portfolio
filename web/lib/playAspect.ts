/**
 * Source of truth for /play tile aspect ratios.
 *
 * Keys are the CSS `aspect-ratio` strings written straight onto the tile;
 * values are the same ratio as a number, used for width/layout maths in the
 * grid and for fitting the lightbox into the viewport.
 *
 * Ordered portrait → landscape. The Studio's `playItem.aspectRatio` list must
 * stay in step with these keys — a value there that isn't a key here has no
 * width and lays out as 0.
 */
export const PLAY_ASPECT = {
  '9/16': 9 / 16,
  '2/3': 2 / 3,
  '3/4': 0.75,
  '4/5': 0.8,
  '1/1': 1,
  '4/3': 4 / 3,
  '3/2': 1.5,
  '16/9': 16 / 9,
  '21/9': 21 / 9,
} as const

export type PlayRatio = keyof typeof PLAY_ASPECT
