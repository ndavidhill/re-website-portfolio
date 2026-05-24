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

      <Reveal delay={0.08}>
        <footer className="mt-12 flex w-full max-w-[2000px] flex-col gap-8 md:flex-row md:items-start md:gap-0">
          <div className={`w-full text-text-primary md:w-[660px] ${type.footer}`}>
            ©2026
          </div>
          <div className={`flex w-full flex-col pr-5 text-text-primary md:w-[330px] ${type.footer}`}>
            <a
              href="https://mouthwash.studio"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-text-secondary"
            >
              Mouthwash Research Center
            </a>
            <a href="/findings" className="hover:text-text-secondary">
              Findings
            </a>
          </div>
          <div className={`w-full text-text-primary md:w-[330px] ${type.footer}`}>
            Level 20, 25 Martin Place Sydney, 2000
          </div>
        </footer>
      </Reveal>
    </>
  )
}
