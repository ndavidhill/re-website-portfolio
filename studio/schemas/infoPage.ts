import {defineField, defineType} from 'sanity'

/**
 * Singleton document backing the /info page (studio / about / team page).
 *
 * Surfaces fed from here:
 *  - Hero: two video files (dark + light), with a poster fallback.
 *  - Brand pillars: lead heading, intro paragraph, a default image, and a
 *    list of 5+ pillars (title + body + image). Each pillar's image swaps
 *    into the left column when the visitor hovers / focuses that pillar on
 *    the right.
 *  - One collective: subheading + intro paragraph + team headshot grid.
 *  - Recognition table is reused from `homePage.awards` (not stored here).
 */
export default defineType({
  name: 'infoPage',
  title: 'Info page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'approach', title: 'Approach (deck)'},
    {name: 'pillars', title: 'Brand pillars'},
    {name: 'collective', title: 'One collective'},
    {name: 'meta', title: 'Meta & SEO'},
  ],
  fields: [
    // ── Hero ───────────────────────────────────────────────────────────────
    defineField({
      name: 'heroVideoDark',
      title: 'Hero video — dark mode',
      type: 'file',
      group: 'hero',
      options: {accept: 'video/mp4,video/webm,video/quicktime'},
      description:
        'Plays when the site is in dark mode (default). Autoplays muted, loops.',
    }),
    defineField({
      name: 'heroVideoLight',
      title: 'Hero video — light mode',
      type: 'file',
      group: 'hero',
      options: {accept: 'video/mp4,video/webm,video/quicktime'},
      description:
        'Plays when the visitor has toggled the site to light mode. Falls back to the dark video if not set.',
    }),
    defineField({
      name: 'heroVideoPoster',
      title: 'Hero poster',
      type: 'image',
      group: 'hero',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      description: 'Frame shown while the video buffers.',
    }),

    // ── Brand pillars ──────────────────────────────────────────────────────
    defineField({
      name: 'leadHeading',
      title: 'Lead heading',
      type: 'text',
      rows: 3,
      group: 'pillars',
      description:
        'Large heading above the pillar list. e.g. "We build brand systems that turn distinctive behaviour into growth."',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pillarsIntro',
      title: 'Pillars intro',
      type: 'text',
      rows: 3,
      group: 'pillars',
      description:
        'Short paragraph above the pillar list on the right. e.g. "Not a project. A permanent system…"',
    }),
    defineField({
      name: 'pillarsDefaultImage',
      title: 'Pillars default image',
      type: 'image',
      group: 'pillars',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      description:
        'Shown on the left when no pillar is hovered. Each pillar can override with its own image.',
    }),
    defineField({
      name: 'pillars',
      title: 'Pillars',
      type: 'array',
      group: 'pillars',
      description:
        'The pillar list on the right. Each pillar\'s image swaps into the left column on hover/focus.',
      of: [
        {
          type: 'object',
          name: 'pillar',
          fields: [
            {
              name: 'title',
              type: 'string',
              title: 'Title',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'body',
              type: 'text',
              rows: 3,
              title: 'Body',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'image',
              type: 'image',
              title: 'Hover image',
              options: {hotspot: true},
              fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {title: 'title', media: 'image'},
          },
        },
      ],
      validation: (Rule) => Rule.min(1),
    }),

    // Framework framing around the pillars (deck slide 4: Conviction → the
    // 5 C's → Collaborators → Connected experiences & codes).
    defineField({
      name: 'frameworkConviction',
      title: 'Framework — conviction (lead-in above pillars)',
      type: 'text',
      rows: 2,
      group: 'pillars',
      initialValue:
        'Conviction — a clear belief and cultural ambition that guides every choice and the outcomes we design for.',
    }),
    defineField({
      name: 'frameworkCollaborators',
      title: 'Framework — collaborators (band below pillars)',
      type: 'text',
      rows: 2,
      group: 'pillars',
      initialValue:
        'Collaborators — the creators and partners that amplify the brand in culture.',
    }),
    defineField({
      name: 'frameworkCodes',
      title: 'Framework — connected experiences & codes (band below pillars)',
      type: 'text',
      rows: 2,
      group: 'pillars',
      initialValue:
        'Connected experiences & codes — the distinctive brand signals that make it recognisable everywhere.',
    }),

    // ── Approach (deck slides 1–3, 5) ───────────────────────────────────────
    // Slide 1 — the problem.
    defineField({
      name: 'problemHeading',
      title: 'Problem — heading',
      type: 'text',
      rows: 2,
      group: 'approach',
      initialValue: 'Brands don’t collapse overnight',
    }),
    defineField({
      name: 'problemIntro',
      title: 'Problem — intro',
      type: 'text',
      rows: 3,
      group: 'approach',
      initialValue:
        'They lose strength slowly, showing up differently across channels, experiences and now AI. That drift has a commercial cost — differentiation erodes.',
    }),
    defineField({
      name: 'problemPoints',
      title: 'Problem — points',
      type: 'array',
      group: 'approach',
      description: 'Up to 3 supporting points. Optional large label (e.g. “$3T”).',
      of: [
        {
          type: 'object',
          name: 'problemPoint',
          fields: [
            {name: 'label', type: 'string', title: 'Label (optional, e.g. $3T)'},
            {
              name: 'body',
              type: 'text',
              rows: 2,
              title: 'Body',
              validation: (Rule) => Rule.required(),
            },
          ],
          preview: {
            select: {title: 'label', subtitle: 'body'},
            prepare: ({title, subtitle}) => ({
              title: (title as string) || (subtitle as string),
              subtitle: title ? (subtitle as string) : undefined,
            }),
          },
        },
      ],
      validation: (Rule) => Rule.max(3),
      initialValue: [
        {label: '$3T', body: 'in brand value lost globally to brand drift.'},
        {body: 'A brand stops building value the moment it shows up inconsistently.'},
        {body: 'AI doesn’t fix broken brands — it exposes and scales them.'},
      ],
    }),

    // Slide 2 — the market gap.
    defineField({
      name: 'marketHeading',
      title: 'Market gap — heading',
      type: 'text',
      rows: 2,
      group: 'approach',
      initialValue: 'The market pulls brands in every direction',
    }),
    defineField({
      name: 'marketIntro',
      title: 'Market gap — intro',
      type: 'text',
      rows: 3,
      group: 'approach',
      initialValue:
        'Transformation, optimisation, creative, social — everyone improves a part, but no one connects the whole.',
    }),
    defineField({
      name: 'marketTypes',
      title: 'Market gap — the three approaches',
      type: 'array',
      group: 'approach',
      of: [
        {
          type: 'object',
          name: 'marketType',
          fields: [
            {name: 'title', type: 'string', title: 'Title', validation: (Rule) => Rule.required()},
            {name: 'body', type: 'text', rows: 2, title: 'Body'},
          ],
          preview: {select: {title: 'title', subtitle: 'body'}},
        },
      ],
      validation: (Rule) => Rule.max(4),
      initialValue: [
        {title: 'Business first', body: 'Strategy & transformation consultancies.'},
        {title: 'Identity first', body: 'Brand & design consultancies.'},
        {title: 'Channel first', body: 'Digital creative & experience agencies.'},
      ],
    }),
    defineField({
      name: 'marketPunchline',
      title: 'Market gap — punchline',
      type: 'string',
      group: 'approach',
      initialValue: 'RE connects the whole.',
    }),

    // Slide 3 — the system (Shape → System → Scale → Sustain).
    defineField({
      name: 'systemHeading',
      title: 'System — heading',
      type: 'text',
      rows: 2,
      group: 'approach',
      initialValue: 'A system for how brands behave',
    }),
    defineField({
      name: 'systemIntro',
      title: 'System — intro',
      type: 'text',
      rows: 3,
      group: 'approach',
      initialValue:
        'Not a project. A permanent system — each phase feeds the next, continuously building brand value.',
    }),
    defineField({
      name: 'systemPhases',
      title: 'System — phases',
      type: 'array',
      group: 'approach',
      of: [
        {
          type: 'object',
          name: 'systemPhase',
          fields: [
            {name: 'title', type: 'string', title: 'Title', validation: (Rule) => Rule.required()},
            {name: 'body', type: 'text', rows: 3, title: 'Body'},
            {
              name: 'detail',
              type: 'text',
              rows: 4,
              title: 'Detail (expand)',
              description: 'Longer copy revealed by "Expand for details" — up to ~5 lines.',
            },
          ],
          preview: {select: {title: 'title', subtitle: 'body'}},
        },
      ],
      validation: (Rule) => Rule.max(6),
      initialValue: [
        {title: 'Shape', body: 'Define where we win. Strategic direction, positioning and distinctiveness grounded in insight and commercial reality.'},
        {title: 'System', body: 'Build the brand into infrastructure. Translate strategy into identity, experience tools and logic across platforms, teams and AI.'},
        {title: 'Scale', body: 'Make it move. Embed the brand across every journey, channel and team — enabling speed and coherence.'},
        {title: 'Sustain', body: 'Make it compound. Governance and optimisation loops that keep the brand coherent and commercially effective.'},
      ],
    }),

    // Slide 5 — the connected brand layers.
    defineField({
      name: 'connectedHeading',
      title: 'Connected brand — heading',
      type: 'text',
      rows: 3,
      group: 'approach',
      initialValue:
        'Cultural power is built when every part of the brand system is connected',
    }),
    defineField({
      name: 'connectedLayers',
      title: 'Connected brand — layers',
      type: 'array',
      group: 'approach',
      description: 'The connected layers of the brand system, in order.',
      of: [
        {
          type: 'object',
          name: 'connectedLayer',
          fields: [
            {name: 'title', type: 'string', title: 'Title', validation: (Rule) => Rule.required()},
            {name: 'body', type: 'text', rows: 2, title: 'Body (optional)'},
          ],
          preview: {select: {title: 'title', subtitle: 'body'}},
        },
      ],
      initialValue: [
        {title: 'Insights + strategy'},
        {title: 'Customer experiences'},
        {title: 'Design system'},
        {title: 'Digital experiences'},
        {title: 'Internal & employee comms'},
        {title: 'Corporate reputation & storytelling'},
        {title: 'Environmental experiences'},
      ],
    }),

    // ── One collective ─────────────────────────────────────────────────────
    defineField({
      name: 'collectiveHeading',
      title: 'Collective heading',
      type: 'string',
      group: 'collective',
      description: 'Large heading. Defaults to "One collective".',
      initialValue: 'One collective',
    }),
    defineField({
      name: 'collectiveSubheading',
      title: 'Collective subheading',
      type: 'string',
      group: 'collective',
      description: 'Smaller heading above the intro. e.g. "We design brands people want to belong to."',
    }),
    defineField({
      name: 'collectiveIntro',
      title: 'Collective intro',
      type: 'text',
      rows: 5,
      group: 'collective',
      description: 'Paragraph about the studio that sits above the team grid.',
    }),
    defineField({
      name: 'team',
      title: 'Team headshots',
      type: 'array',
      group: 'collective',
      description: 'Portrait images, rendered in a 3-column grid (square crop).',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt text',
              description: 'Person\'s name + role.',
            },
          ],
        },
      ],
    }),

    // ── Meta ──────────────────────────────────────────────────────────────
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      group: 'meta',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      group: 'meta',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Info page'}),
  },
})
