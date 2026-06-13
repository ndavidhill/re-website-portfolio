import type {ReactNode} from 'react'

/**
 * Shared Info-page primitives, drawn from the gentle.systems vocabulary and the
 * site's surface/pill tokens: a pill eyebrow that labels each approach section,
 * and a surface panel that groups content. Both are theme-aware via the
 * --color-surface variable. Pure presentational — safe to use inside client or
 * server components.
 */

export function Eyebrow({children}: {children: ReactNode}) {
  return (
    <span className="inline-flex w-fit items-center rounded-full bg-surface px-3 py-1 text-xs font-medium uppercase leading-4 tracking-[0.4px] text-text-secondary">
      {children}
    </span>
  )
}

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-[12px] bg-surface p-5 md:p-6 ${className}`}>
      {children}
    </div>
  )
}
