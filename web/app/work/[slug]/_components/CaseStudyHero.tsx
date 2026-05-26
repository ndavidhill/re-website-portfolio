import {ALL_DISCIPLINES, DISCIPLINE_LABELS, type CaseStudy} from '@/lib/sanity'
import {Reveal} from '@/components/Reveal'
import {AnimatedHeading} from '@/components/AnimatedHeading'
import {type} from '@/lib/design'

interface Props {
  caseStudy: Pick<
    CaseStudy,
    'title' | 'client' | 'year' | 'externalUrl' | 'disciplines'
  >
}

/**
 * Left-column intro: H1 title + small project header card (client, year,
 * Live Site link, discipline tags). Description previously displayed beside
 * this is now rendered by `CaseStudyDescription` as a sticky accordion stack.
 */
export function CaseStudyHero({caseStudy}: Props) {
  const {title, client, year, externalUrl, disciplines} = caseStudy

  return (
    <header className="flex flex-col gap-8">
      <div className="border-t border-border pt-5 pr-[50px]">
        <AnimatedHeading
          text={title}
          as="h1"
          className={`${type.h1} text-text-primary [word-break:break-word]`}
        />
      </div>

      <Reveal
        delay={0.12}
        className="flex w-[302px] max-w-full flex-col gap-1.5 rounded-lg bg-canvas py-2.5 pr-2.5"
      >
        <div className="flex flex-col gap-1.5 pb-[30px]">
          <h2 className="text-lg font-medium leading-[18px] tracking-[-0.27px] text-text-secondary">
            {client}
          </h2>
          <div className="text-lg leading-5 tracking-[-0.27px] text-text-faint">
            {year}
          </div>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="group inline-flex items-center gap-0.5 text-lg leading-5 tracking-[-0.27px] text-text-faint transition-colors hover:text-text-primary"
            >
              <span>Live Site</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 -translate-x-1 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a13.5 13.5 0 010 18M12 3a13.5 13.5 0 000 18" />
              </svg>
            </a>
          )}
        </div>

        {/* All disciplines are always shown; the ones selected for this project
            are highlighted ("on"), the rest stay visible but muted ("off"). */}
        {(() => {
          // Stored disciplines vary in format (slug vs Title Case vs Sentence
          // case label), so match on a normalized key rather than ===.
          const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')
          const selected = new Set((disciplines ?? []).map(norm))
          return (
            <ul className="flex flex-wrap gap-1.5">
              {ALL_DISCIPLINES.map((discipline) => {
                const active =
                  selected.has(norm(discipline)) ||
                  selected.has(norm(DISCIPLINE_LABELS[discipline]))
                return (
                  <li
                    key={discipline}
                    data-active={active}
                    className={
                      'flex h-6 items-center rounded-md px-2 text-xs font-medium leading-4 transition-colors ' +
                      (active
                        ? 'border border-transparent bg-text-primary/10 text-text-primary'
                        : 'border border-border text-text-faint')
                    }
                  >
                    {DISCIPLINE_LABELS[discipline]}
                  </li>
                )
              })}
            </ul>
          )
        })()}
      </Reveal>
    </header>
  )
}
