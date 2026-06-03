import {notFound} from 'next/navigation'
import type {Metadata} from 'next'
import {getAllCaseStudySlugs, getCaseStudyBySlug} from '@/lib/sanity'
import {SiteHeader} from '@/components/SiteHeader'
import {ContactAndFooter} from '@/components/ContactAndFooter'
import {CaseStudyHero} from './_components/CaseStudyHero'
import {CaseStudyBody} from './_components/CaseStudyBody'
import {CaseStudyDescription} from './_components/CaseStudyDescription'
import {StickyDescriptionAccordion} from './_components/StickyDescriptionAccordion'

type Params = {slug: string}

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllCaseStudySlugs()
  return slugs.map((slug) => ({slug}))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const {slug} = await params
  const caseStudy = await getCaseStudyBySlug(slug)
  if (!caseStudy) return {}
  return {
    title: caseStudy.seoTitle ?? `${caseStudy.title} — ${caseStudy.client}`,
    description: caseStudy.seoDescription ?? caseStudy.summary,
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>
}) {
  const {slug} = await params
  const caseStudy = await getCaseStudyBySlug(slug)
  if (!caseStudy) notFound()

  const accordionItems = caseStudy.descriptionAccordion ?? []

  return (
    <article className="relative flex w-full flex-col bg-canvas text-text-primary">
      <SiteHeader activeHref="/work" />

      <div className="flex w-full flex-col gap-16 px-3 pb-5 pt-[88px] md:gap-[115px] md:px-[30px] md:pt-[110px]">
        {/* Intro — hero on the left. On mobile the accordion stacks below
            the hero. On xl+ the right column is intentionally empty: the
            sticky accordion overlay (rendered below) takes its place so
            it can float over body content as the user scrolls. */}
        <section
          aria-label="Project intro"
          className="flex flex-col items-start gap-10 xl:flex-row xl:gap-[60px]"
        >
          <div className="flex-1 min-w-0">
            <CaseStudyHero caseStudy={caseStudy} />
          </div>

          {/* Mobile / tablet: inline accordion below hero */}
          <div className="w-full xl:hidden">
            <CaseStudyDescription
              items={accordionItems}
              summary={caseStudy.summary}
            />
          </div>

          {/* xl+ placeholder column — actual accordion is rendered as a
              fixed overlay so body content can span full width. */}
          <div
            aria-hidden
            className="hidden xl:block xl:w-[440px] xl:flex-shrink-0"
          />
        </section>

        {caseStudy.body && caseStudy.body.length > 0 && (
          <CaseStudyBody blocks={caseStudy.body} />
        )}

        <ContactAndFooter />
      </div>

      {/* Floating accordion — fixed positioning, scroll-driven morph from
          intro position to bottom-right corner. xl+ only; mobile uses the
          inline accordion above. */}
      <StickyDescriptionAccordion
        items={accordionItems}
        fallbackSummary={caseStudy.summary}
      />
    </article>
  )
}
