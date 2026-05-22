'use client'

interface Props {
  muted: boolean
  onToggle: () => void
  /** Visual size — 'lg' is the 72×48 pill from Figma; 'sm' is a 36×36 corner button. */
  size?: 'lg' | 'sm'
  className?: string
}

/**
 * Toggle button that swaps between muted/unmuted speaker icons. Visual styling
 * matches the Figma "Mute Button" component used on the homepage hero video.
 * The parent is responsible for positioning (absolute, fixed, etc).
 */
export function MuteToggle({muted, onToggle, size = 'lg', className}: Props) {
  const sizeCls =
    size === 'lg' ? 'h-12 w-[72px]' : 'h-9 w-9'

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? 'Unmute video' : 'Mute video'}
      aria-pressed={!muted}
      className={
        'pointer-events-auto flex items-center justify-center rounded-full bg-canvas/45 text-text-primary backdrop-blur-md transition-[background-color,transform] duration-200 hover:bg-canvas/70 active:scale-95 ' +
        sizeCls +
        (className ? ' ' + className : '')
      }
    >
      {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
    </button>
  )
}

function SpeakerOnIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 010 7" />
      <path d="M18.5 6a9 9 0 010 12" />
    </svg>
  )
}

function SpeakerOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M22 9l-6 6" />
      <path d="M16 9l6 6" />
    </svg>
  )
}
