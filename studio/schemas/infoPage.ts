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
