import {Reveal} from './Reveal'
import {AnimatedHeading} from './AnimatedHeading'
import {type} from '@/lib/design'

interface Props {
  /** Override the contact email; defaults to hello@re.design */
  email?: string
}

export function ContactAndFooter({email = 'hello@re.design'}: Props) {
  return (
    <>
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text="Get in touch"
          as="h2"
          className={`${type.display} text-text-primary`}
        />
        <Reveal delay={0.25}>
          <a
            href={`mailto:${email}`}
            className={`mt-4 inline-block text-text-muted transition-colors hover:text-text-primary ${type.display}`}
          >
            {email}
          </a>
        </Reveal>
      </div>

      {/* rootMarginPx={0}: the footer is the last element on the page, pinned to
          the bottom. With the default negative bottom inset it never crosses the
          trigger line (the page can't scroll past it), so it would stay hidden.
          Trigger the reveal as soon as it enters the viewport instead. */}
      <Reveal delay={0.08} rootMarginPx={0}>
        <footer className="mt-12 grid w-full max-w-[2000px] grid-cols-1 gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-0">
          <div className={`min-w-0 text-text-primary ${type.footer}`}>
            ©2026
          </div>
          <div className={`min-w-0 text-text-primary ${type.footer}`}>
            <address className="not-italic whitespace-normal">
              Level 20, 25 Martin Place Sydney, 2000
            </address>
          </div>
          <div className={`min-w-0 text-text-primary ${type.footer}`}>
            <address className="not-italic whitespace-normal">
            The Commons, 10-20 Gwynne St, Cremorne VIC 3121
            </address>
          </div>
        </footer>
      </Reveal>
    </>
  )
}
