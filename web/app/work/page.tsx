import type {Metadata} from 'next'
import {getWorkIndexCaseStudies} from '@/lib/sanity'
import {pageMetadata} from '@/lib/seo'
import {SiteHeader} from '@/components/SiteHeader'
import {ContactAndFooter} from '@/components/ContactAndFooter'
import {AnimatedHeading} from '@/components/AnimatedHeading'
import {type} from '@/lib/design'
import {WorkIndexRow} from './_components/WorkIndexRow'

export const metadata: Metadata = pageMetadata({
  title: 'Work',
  socialTitle: 'Work — re.design',
  description: 'Selected projects from re.design.',
  path: '/work',
})

export default async function WorkIndexPage() {
  const caseStudies = await getWorkIndexCaseStudies()

  return (
    <main className="relative w-full bg-canvas text-text-primary">
      <SiteHeader activeHref="/work" />

      <div className="flex w-full flex-col gap-12 px-3 pb-5 pt-[88px] md:gap-[80px] md:px-[30px] md:pt-[110px]">
        <header className="flex items-start gap-2 border-t border-border pt-5">
          <AnimatedHeading
            text="Our Work"
            as="h1"
            className={`${type.h1} text-text-primary`}
          />
          <span
            aria-label={`${caseStudies.length} projects`}
            className="text-[14px] font-medium leading-[10px] text-text-muted"
          >
            {caseStudies.length}
          </span>
        </header>

        {caseStudies.length > 0 ? (
          <section
            aria-label="Case studies"
            className="flex flex-col gap-12 md:gap-[80px]"
          >
            {caseStudies.map((c) => (
              <WorkIndexRow key={c._id} card={c} />
            ))}
          </section>
        ) : (
          <p className="text-text-secondary">
            No case studies yet — publish from the Studio to populate this
            page.
          </p>
        )}

        <ContactAndFooter />
      </div>
    </main>
  )
}
