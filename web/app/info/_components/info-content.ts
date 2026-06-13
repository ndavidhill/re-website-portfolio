/**
 * Default Info-page copy, sourced verbatim (lightly tightened) from the
 * RE/Consulting strategy deck. The Info document predates these fields, so
 * Sanity `initialValue` can't backfill it — components render the Sanity value
 * when set and fall back to these defaults otherwise. Editing in Studio
 * overrides them; this keeps the page populated immediately.
 */

export interface TitleBody {
  title: string
  body?: string
}
export interface LabelBody {
  label?: string
  body: string
}

// Slide 1 — the problem.
export const PROBLEM_HEADING = 'Brands don’t collapse overnight'
export const PROBLEM_INTRO =
  'They lose strength slowly, showing up differently across channels, experiences and now AI. That drift has a commercial cost — differentiation erodes.'
export const PROBLEM_POINTS: LabelBody[] = [
  {label: '$3T', body: 'in brand value lost globally to brand drift.'},
  {body: 'A brand stops building value the moment it shows up inconsistently.'},
  {body: 'AI doesn’t fix broken brands — it exposes and scales them.'},
]

// Slide 2 — the market gap.
export const MARKET_HEADING = 'The market pulls brands in every direction'
export const MARKET_INTRO =
  'Transformation, optimisation, creative, social — everyone improves a part, but no one connects the whole.'
export const MARKET_TYPES: TitleBody[] = [
  {title: 'Business first', body: 'Strategy & transformation consultancies.'},
  {title: 'Identity first', body: 'Brand & design consultancies.'},
  {title: 'Channel first', body: 'Digital creative & experience agencies.'},
]
export const MARKET_PUNCHLINE = 'RE connects the whole.'

// Slide 3 — the system.
export const SYSTEM_HEADING = 'A system for how brands behave'
export const SYSTEM_INTRO =
  'Not a project. A permanent system — each phase feeds the next, continuously building brand value.'
export const SYSTEM_PHASES: TitleBody[] = [
  {
    title: 'Shape',
    body: 'Define where we win. Strategic direction, positioning and distinctiveness grounded in insight and commercial reality.',
  },
  {
    title: 'System',
    body: 'Build the brand into infrastructure. Translate strategy into identity, experience tools and logic across platforms, teams and AI.',
  },
  {
    title: 'Scale',
    body: 'Make it move. Embed the brand across every journey, channel and team — enabling speed and coherence.',
  },
  {
    title: 'Sustain',
    body: 'Make it compound. Governance and optimisation loops that keep the brand coherent and commercially effective.',
  },
]

// Slide 4 — framework framing around the 5 C's.
export const FRAMEWORK_CONVICTION =
  'Conviction — a clear belief and cultural ambition that guides every choice and the outcomes we design for.'
export const FRAMEWORK_COLLABORATORS =
  'Collaborators — the creators and partners that amplify the brand in culture.'
export const FRAMEWORK_CODES =
  'Connected experiences & codes — the distinctive brand signals that make it recognisable everywhere.'

// Slide 5 — the connected brand layers.
export const CONNECTED_HEADING =
  'Cultural power is built when every part of the brand system is connected'
export const CONNECTED_LAYERS: TitleBody[] = [
  {title: 'Insights + strategy'},
  {title: 'Customer experiences'},
  {title: 'Design system'},
  {title: 'Digital experiences'},
  {title: 'Internal & employee comms'},
  {title: 'Corporate reputation & storytelling'},
  {title: 'Environmental experiences'},
]
