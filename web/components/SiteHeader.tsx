import Image from 'next/image'
import Link from 'next/link'

const NAV_ITEMS = [
  {label: 'Work', href: '/work'},
  {label: 'About', href: '/about'},
  {label: 'Play', href: '/play'},
  {label: 'Contact', href: '/contact'},
] as const

export function SiteHeader({activeHref}: {activeHref?: string}) {
  return (
    <header className="absolute inset-x-0 top-0 z-50 flex flex-col items-center px-[60px] py-5">
      <div className="flex w-full max-w-[2000px] items-center justify-between">
        <Link href="/" aria-label="re.design home" className="pr-5">
          <Image
            src="/ReLogo.svg"
            alt="re.design"
            width={50}
            height={30}
            priority
          />
        </Link>

        <nav aria-label="Primary">
          <ul className="flex h-[32px] items-center gap-1.5 rounded-lg bg-text-muted/90 px-1 backdrop-blur-sm">
            {NAV_ITEMS.map((item) => {
              const isActive = !!activeHref && activeHref.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      'flex h-[25px] items-center rounded-lg px-2.5 text-[14.75px] leading-[18px] tracking-[-0.3px] transition-colors ' +
                      (isActive
                        ? 'bg-text-primary text-canvas'
                        : 'text-canvas/80 hover:bg-text-primary hover:text-canvas')
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
