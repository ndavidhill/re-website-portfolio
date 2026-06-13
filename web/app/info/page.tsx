import type {Metadata} from 'next'
import {getHomePage, getInfoPage, urlForImage} from '@/lib/sanity'
import {SiteHeader} from '@/components/SiteHeader'
import {ContactAndFooter} from '@/components/ContactAndFooter'
import {AwardsSection} from '@/components/AwardsSection'
import {InfoHero} from './_components/InfoHero'
import {ProblemSection} from './_components/ProblemSection'
import {MarketGap} from './_components/MarketGap'
import {BrandSystem} from './_components/BrandSystem'
import {BrandPillars} from './_components/BrandPillars'
import {ConnectedBrand} from './_components/ConnectedBrand'
import {OneCollective} from './_components/OneCollective'
import {FRAMEWORK_COLLABORATORS, FRAMEWORK_CODES, FRAMEWORK_CONVICTION} from './_components/info-content'

export async function generateMetadata(): Promise<Metadata> {
  const info = await getInfoPage()
  if (!info) return {title: 'Info'}
  return {
    title: info.seoTitle ?? 'Info',
    description: info.seoDescription,
  }
}

export default async function InfoPage() {
  // Pull the homePage in parallel for the recognition table — single source of
  // truth for awards lives on homePage, both surfaces render the same data.
  const [info, home] = await Promise.all([getInfoPage(), getHomePage()])

  if (!info) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-canvas text-text-primary">
        <SiteHeader activeHref="/info" />
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-medium">Info page not yet authored</h1>
          <p className="mt-3 text-text-secondary">
            Open the Studio, pick <strong>Info page</strong> in the sidebar,
            fill in the fields, and publish.
          </p>
        </div>
      </main>
    )
  }

  const posterUrl = info.heroVideoPoster
    ? urlForImage(info.heroVideoPoster).width(1600).auto('format').url()
    : undefined

  return (
    <main className="relative w-full bg-canvas text-text-primary">
      <SiteHeader activeHref="/info" />

      <div className="flex w-full flex-col gap-16 px-3 pb-5 pt-[88px] md:gap-[115px] md:px-[30px] md:pt-[110px]">
        <InfoHero
          darkUrl={info.heroVideoDark?.asset?.url}
          lightUrl={info.heroVideoLight?.asset?.url}
          posterUrl={posterUrl}
          alt={info.heroVideoPoster?.alt ?? 're.design hero'}
        />

        {/* Approach narrative (deck): problem → market gap → system →
            framework (pillars) → connected brand. */}
        <ProblemSection
          heading={info.problemHeading}
          intro={info.problemIntro}
          points={info.problemPoints}
        />

        <MarketGap
          heading={info.marketHeading}
          intro={info.marketIntro}
          types={info.marketTypes}
          punchline={info.marketPunchline}
        />

        <BrandSystem
          heading={info.systemHeading}
          intro={info.systemIntro}
          phases={info.systemPhases}
        />

        <BrandPillars
          heading={info.leadHeading}
          intro={info.pillarsIntro}
          defaultImage={info.pillarsDefaultImage}
          pillars={info.pillars ?? []}
          conviction={info.frameworkConviction ?? FRAMEWORK_CONVICTION}
          collaborators={info.frameworkCollaborators ?? FRAMEWORK_COLLABORATORS}
          codes={info.frameworkCodes ?? FRAMEWORK_CODES}
        />

        <ConnectedBrand
          heading={info.connectedHeading}
          layers={info.connectedLayers}
        />

        <OneCollective
          heading={info.collectiveHeading}
          subheading={info.collectiveSubheading}
          intro={info.collectiveIntro}
          team={info.team}
        />

        <AwardsSection heading={home?.awardsHeading} awards={home?.awards} />

        <ContactAndFooter />
      </div>
    </main>
  )
}
