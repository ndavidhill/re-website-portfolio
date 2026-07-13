import type {Metadata} from 'next'
import Image from 'next/image'
import {
  getFeaturedCaseStudies,
  getHomePage,
  getPlayItems,
  getRecentArticles,
  urlForImage,
  type PlayItem,
} from '@/lib/sanity'
import {SiteHeader} from '@/components/SiteHeader'
import {ContactAndFooter} from '@/components/ContactAndFooter'
import {Reveal} from '@/components/Reveal'
import {FlipOnResize} from '@/components/FlipOnResize'
import {AnimatedHeading} from '@/components/AnimatedHeading'
import {JsonLd} from '@/components/JsonLd'
import {type} from '@/lib/design'
import {pageMetadata} from '@/lib/seo'
import {siteDescription, siteName} from '@/lib/site'
import {organizationSchema} from '@/lib/structuredData'
import {StickyHomeVideo} from './_components/StickyHomeVideo'
import {WorkCard} from './_components/WorkCard'
import {HomeNewsroomCarousel} from './_components/HomeNewsroomCarousel'
import {InfiniteGallery, type GalleryItem} from './_components/InfiniteGallery'
import {AwardsSection} from '@/components/AwardsSection'

/**
 * Newsroom kill switch. The section, its carousel, the GROQ fetch and the
 * `newsroomIntro` field on the home page document are all left in place — flip
 * this to `true` to bring the section back in a single line.
 */
const SHOW_NEWSROOM = false

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomePage()

  // The root layout's `%s — re.design` template applies to child segments, not
  // to this one, so the homepage title stands alone and has to carry the
  // positioning itself.
  const title = home?.seoTitle ?? `${siteName} — Independent design studio`

  return pageMetadata({
    title,
    socialTitle: title,
    description: home?.seoDescription ?? siteDescription,
    path: '/',
    // Hero poster is the only image the homepage has; without it, pageMetadata
    // falls back to the generated site-wide card.
    image: home?.heroVideoPoster
      ? urlForImage(home.heroVideoPoster)
          .width(1200)
          .height(630)
          .fit('crop')
          .auto('format')
          .url()
      : undefined,
  })
}

export default async function HomePage() {
  const [home, featured, articles, playItems] = await Promise.all([
    getHomePage(),
    getFeaturedCaseStudies(),
    getRecentArticles(),
    getPlayItems(),
  ])

  if (!home) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-canvas text-text-primary">
        <SiteHeader />
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-medium">Home page not yet authored</h1>
          <p className="mt-3 text-text-secondary">
            Open the Studio, pick <strong>Home page</strong> in the sidebar,
            fill in the fields, and publish.
          </p>
        </div>
      </main>
    )
  }

  const posterUrl = home.heroVideoPoster
    ? urlForImage(home.heroVideoPoster).width(1600).auto('format').url()
    : undefined

  return (
    <main className="relative w-full bg-canvas text-text-primary">
      <SiteHeader />

      <JsonLd data={organizationSchema(home.newBusinessEmail)} />

      {/* The hero is a silent full-bleed reel, so the page has no visible text
          to carry its h1. Rather than force a heading into the art direction,
          the h1 is screen-reader-only — it still gives crawlers and assistive
          tech the document's top-level heading. */}
      <h1 className="sr-only">{siteName} — independent design studio</h1>

      {/* Hero: empty viewport-tall region; the StickyHomeVideo overlays it
          while centred, then animates to bottom-right as the user scrolls. */}
      <section aria-label="Reel" className="relative h-screen w-full" />

      <StickyHomeVideo src={home.heroVideoUrl} poster={posterUrl} />

      {/* pb clears the docked StickyHomeVideo (fixed bottom-right, ~191px tall +
          24px margin) so the footer/addresses aren't hidden beneath it. */}
      <div className="flex flex-col gap-24 px-3 pb-[240px] md:gap-60 md:px-[30px]">
        {/* Intro paragraph — full-bleed, left-aligned, fluid type that scales
            smoothly with the viewport (clamped 30px → 72px). */}
        <Reveal>
          <p className="w-full text-left text-text-primary [text-wrap:pretty] font-medium text-[clamp(1.875rem,4.5vw,4.5rem)] leading-[1.05] tracking-[-0.02em]">
            {(() => {
              // Render the CMS copy line by line; the final author-defined line
              // is muted. Add a line break in the Studio "Intro paragraph" field
              // to choose where the faint last line begins.
              const lines = home.introParagraph
                .split('\n')
                .map((l) => l.trim())
                .filter(Boolean)
              return lines.map((line, i) => {
                const isLast = i === lines.length - 1 && lines.length > 1
                return (
                  <span key={i} className={isLast ? 'text-text-faint' : undefined}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                )
              })
            })()}
          </p>
        </Reveal>

        <TldrSection home={home} />
        <WorkSection home={home} featured={featured} />
        {SHOW_NEWSROOM && (
          <NewsroomSection home={home} articles={articles} />
        )}
        <AwardsSection heading={home.awardsHeading} awards={home.awards} />

        <LabsSection items={playItems} />

        <ContactAndFooter />
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

type Home = NonNullable<Awaited<ReturnType<typeof getHomePage>>>

// Muted palette for play tiles with no media (cycled per item).
const LABS_PALETTE = [
  '#D6CFC1',
  '#7B8B7E',
  '#5C6F7E',
  '#A0A8A0',
  '#8B5C5C',
  '#736857',
  '#C9A671',
  '#5E5E68',
] as const

const LABS_FALLBACK: GalleryItem[] = [
  {caption: 'Type study — 2026', ratio: '4/5', color: '#D6CFC1'},
  {caption: 'Colour experiment — 2026', ratio: '1/1', color: '#7B8B7E'},
  {caption: 'Motion sketch — 2026', ratio: '16/9', color: '#5C6F7E'},
  {caption: 'Material study — 2025', ratio: '4/5', color: '#A0A8A0'},
  {caption: 'Pattern system — 2025', ratio: '1/1', color: '#8B5C5C'},
  {caption: 'Type & space — 2025', ratio: '16/9', color: '#736857'},
]

/**
 * Labs — a single drifting row of the /play gallery, teasing the studio's
 * experiments at the foot of the homepage. Rows in the schema are flattened into
 * one; the section breaks the page gutter to run full-bleed.
 */
function LabsSection({items}: {items: PlayItem[]}) {
  const row: GalleryItem[] =
    items.length > 0
      ? items.map((it, i) => ({
          caption: it.title,
          ratio: it.aspectRatio,
          color: LABS_PALETTE[i % LABS_PALETTE.length],
          image: it.image,
          videoUrl: it.videoFile?.asset?.url,
          poster: it.poster,
        }))
      : LABS_FALLBACK

  return (
    <section className="flex flex-col gap-8 md:gap-12">
      <div className="border-t border-border pt-5">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-[60px]">
          <AnimatedHeading
            text="Labs"
            as="h2"
            className={`${type.h1} text-text-primary`}
          />
          <Reveal>
            <p className={`max-w-[550px] text-text-secondary ${type.body}`}>
              Our design practice is built on experimentation.{' '}
              <a
                href="/play"
                className="text-text-primary underline decoration-from-font underline-offset-[3px] transition-colors hover:text-text-secondary"
              >
                Discover our latest here
              </a>
              .
            </p>
          </Reveal>
        </div>
      </div>

      {/* Full-bleed: cancel the homepage gutter so the row runs edge to edge. */}
      <div className="-mx-3 md:-mx-[30px]">
        <InfiniteGallery items={row} direction={1} />
      </div>
    </section>
  )
}

function TldrSection({home}: {home: Home}) {
  return (
    <section className="grid grid-cols-1 gap-x-0 gap-y-12 xl:grid-cols-2">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text="TLDR"
          as="h2"
          className={`${type.h1} text-text-primary`}
        />
      </div>

      <div className="flex flex-col gap-12">
        {/* Contact + Capabilities row */}
        <FlipOnResize className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Reveal delay={0.06}>
            <div className="border-t border-border pt-5">
              <h3 className="text-base font-medium leading-[18px] tracking-[-0.176px] text-text-secondary">
                Contact
              </h3>
              <dl className="mt-6 space-y-4">
                {home.newBusinessEmail && (
                  <div>
                    <dt className="text-base font-medium leading-[18px] tracking-[-0.176px] text-text-primary">
                      New Business
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${home.newBusinessEmail}`}
                        className="text-lg leading-5 tracking-[-0.27px] text-text-faint transition-colors hover:text-text-primary"
                      >
                        {home.newBusinessEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {home.careersEmail && (
                  <div>
                    <dt className="text-base font-medium leading-[18px] tracking-[-0.176px] text-text-primary">
                      Careers
                    </dt>
                    <dd className="mt-1">
                      <a
                        href={`mailto:${home.careersEmail}`}
                        className="text-lg leading-5 tracking-[-0.27px] text-text-faint transition-colors hover:text-text-primary"
                      >
                        {home.careersEmail}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="border-t border-border pt-5">
              <h3 className="text-base font-medium leading-[18px] tracking-[-0.176px] text-text-secondary">
                Capabilities
              </h3>
              {home.capabilities && home.capabilities.length > 0 && (
                <ul className="mt-6 space-y-2">
                  {home.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="text-lg leading-6 tracking-[-0.27px] text-text-faint"
                    >
                      {cap}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </FlipOnResize>

        {/* Questions + Clients row */}
        <FlipOnResize className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Reveal delay={0.06}>
            <div className="border-t border-border pt-5">
              <h3 className="text-base font-medium leading-[18px] tracking-[-0.176px] text-text-secondary">
                The questions we answer
              </h3>
              {home.questions && home.questions.length > 0 && (
                <div className="mt-6 flex flex-col gap-3">
                  {home.questions.map((q, i) => (
                    <div
                      key={q._key}
                      className="flex flex-col gap-2.5 rounded-md bg-surface p-[14px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-sm font-medium leading-5 text-text-primary">
                          {(i + 1).toString().padStart(2, '0')}
                        </span>
                        <h4 className="flex-1 text-sm font-medium leading-5 text-text-primary">
                          {q.label}
                        </h4>
                      </div>
                      {/* `whitespace-pre-line` renders the line breaks stored
                          in the body field as separate question lines. */}
                      <p className="whitespace-pre-line text-sm leading-[22px] text-text-secondary">
                        {q.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="border-t border-border pt-5">
              <h3 className="text-base font-medium leading-[18px] tracking-[-0.176px] text-text-secondary">
                Clients
              </h3>
              {home.clients && home.clients.length > 0 && (
                <ul className="mt-6 grid grid-cols-1 gap-1">
                  {home.clients.map((c) => {
                    const inner = (
                      <span className="text-lg leading-6 tracking-[-0.27px] text-text-faint transition-colors group-hover:text-text-primary">
                        {c.name}
                      </span>
                    )
                    return (
                      <li key={c._id} className="group">
                        {c.url ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="flex items-center gap-1.5"
                          >
                            {inner}
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 -translate-x-1 text-text-primary opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                            >
                              <circle cx="12" cy="12" r="9" />
                              <path d="M3 12h18" />
                              <path d="M12 3a13.5 13.5 0 010 18M12 3a13.5 13.5 0 000 18" />
                            </svg>
                          </a>
                        ) : (
                          inner
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </Reveal>
        </FlipOnResize>
      </div>
    </section>
  )
}

function WorkSection({
  home,
  featured,
}: {
  home: Home
  featured: Awaited<ReturnType<typeof getFeaturedCaseStudies>>
}) {
  return (
    <section className="flex flex-col gap-12 md:gap-[90px]">
      <div className="grid grid-cols-1 gap-x-0 gap-y-8 xl:grid-cols-2">
        <div className="border-t border-border pt-5">
          <AnimatedHeading
            text="Our Work"
            as="h2"
            className={`${type.h1} text-text-primary`}
          />
        </div>

        <div className="flex flex-col gap-12">
          {home.workIntroBlocks?.map((block, i) => (
            <Reveal key={block._key} delay={i * 0.08}>
              <div className="border-t border-border pt-5">
                <h3 className="text-base font-medium leading-6 tracking-[-0.4px] text-text-primary">
                  {block.heading}
                </h3>
                <p className={`mt-6 max-w-[550px] text-text-secondary ${type.bodyLarge}`}>
                  {block.body}
                </p>
                {block.images && block.images.length > 0 && (
                  <div className="mt-6 flex gap-3">
                    {block.images.map((img, j) => (
                      <div
                        key={j}
                        className="relative aspect-[4/3] flex-1 overflow-hidden rounded-[6px] bg-surface"
                      >
                        <Image
                          src={urlForImage(img).width(900).auto('format').url()}
                          alt={img.alt ?? ''}
                          fill
                          sizes="(min-width: 1280px) 16vw, 30vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {featured.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {featured.map((c, i) => (
            <Reveal key={c._id} delay={(i % 2) * 0.10}>
              <WorkCard card={c} showBadge={!!c.isNew} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="rounded-[4px] border border-border bg-surface px-8 py-16 text-center text-text-secondary md:rounded-[20px]">
          No featured case studies yet. Toggle <em>Feature on homepage</em> on
          a case study in the Studio.
        </div>
      )}
    </section>
  )
}

function NewsroomSection({
  home,
  articles,
}: {
  home: Home
  articles: Awaited<ReturnType<typeof getRecentArticles>>
}) {
  return (
    <section className="flex flex-col gap-12">
      <div className="border-t border-border pt-5">
        <AnimatedHeading
          text="Newsroom"
          as="h2"
          className={`${type.h1} text-text-primary`}
        />
        {home.newsroomIntro && (
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-[660px] text-base leading-5 tracking-[-0.176px] text-text-secondary">
              {home.newsroomIntro}
            </p>
          </Reveal>
        )}
      </div>

      <Reveal delay={0.08}>
        <HomeNewsroomCarousel articles={articles} />
      </Reveal>
    </section>
  )
}

// AwardsSection moved to components/AwardsSection.tsx for reuse on /info.
