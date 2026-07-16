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
  /** Longer copy revealed by "Expand for details" (system phases). */
  detail?: string
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
    detail:
      'We pressure-test where the brand can credibly win — sharpening positioning, distinctiveness and the commercial case. The output is a clear north star: a defensible point of view that every later decision can be measured against, grounded in evidence rather than opinion.',
  },
  {
    title: 'System',
    body: 'Build the brand into infrastructure. Translate strategy into identity, experience tools and logic across platforms, teams and AI.',
    detail:
      'Strategy becomes infrastructure. We build the identity, the experience tools and the operating logic that let teams, platforms and AI express the brand consistently — so coherence is engineered in, not re-decided on every project.',
  },
  {
    title: 'Scale',
    body: 'Make it move. Embed the brand across every journey, channel and team — enabling speed and coherence.',
    detail:
      'The brand moves into every journey, channel and team. Playbooks, components and clear governance make coherent execution fast and repeatable — so growth and speed never come at the cost of consistency.',
  },
  {
    title: 'Sustain',
    body: 'Make it compound. Governance and optimisation loops that keep the brand coherent and commercially effective.',
    detail:
      'Always-on governance and optimisation loops keep the system coherent as the brand grows. Distinctiveness and commercial value compound over time, and the loop feeds back into Shape — keeping drift out and the brand sharp.',
  },
]

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
