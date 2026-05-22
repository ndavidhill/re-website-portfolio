import {Accordion} from '@/components/Accordion'
import {Reveal} from '@/components/Reveal'
import type {CaseStudy} from '@/lib/sanity'

interface Props {
  /** Accordion items authored in the Studio. */
  items: NonNullable<CaseStudy['descriptionAccordion']>
  /** Fallback summary if no accordion items are authored. */
  summary?: string
}

/**
 * Right-column description for the case study. Renders the accordion stack
 * authored in Sanity; falls back to a single "Description" panel showing the
 * `summary` field so older case studies (pre-accordion) still look right.
 */
export function CaseStudyDescription({items, summary}: Props) {
  const accordionItems = items.length
    ? items.map((item) => ({
        id: item._key,
        title: item.title,
        body: item.body ?? '',
      }))
    : summary
    ? [{title: 'Description', body: summary}]
    : []

  if (accordionItems.length === 0) return null

  return (
    <Reveal delay={0.24}>
      <Accordion items={accordionItems} defaultOpen={[0]} />
    </Reveal>
  )
}
