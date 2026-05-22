import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'tldr', title: 'TLDR'},
    {name: 'work', title: 'Our Work intro'},
    {name: 'newsroom', title: 'Newsroom'},
    {name: 'awards', title: 'Awards'},
    {name: 'meta', title: 'Meta & SEO'},
  ],
  fields: [
    // Hero
    defineField({
      name: 'heroVideoUrl',
      title: 'Hero video URL',
      type: 'string',
      group: 'hero',
      description:
        'Path to an MP4 in /web/public, e.g. "/Re-Reel-2025.mp4". Or an absolute URL.',
      initialValue: '/Re-Reel-2025.mp4',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroVideoPoster',
      title: 'Hero video poster image',
      type: 'image',
      group: 'hero',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      description: 'Shown while the video loads / when JS is disabled.',
    }),
    defineField({
      name: 'introParagraph',
      title: 'Intro paragraph',
      type: 'text',
      rows: 6,
      group: 'hero',
      description: 'The large copy block below the hero video.',
      validation: (Rule) => Rule.required(),
    }),

    // TLDR
    defineField({
      name: 'newBusinessEmail',
      title: 'New Business email',
      type: 'string',
      group: 'tldr',
    }),
    defineField({
      name: 'careersEmail',
      title: 'Careers email',
      type: 'string',
      group: 'tldr',
    }),
    defineField({
      name: 'capabilities',
      title: 'Capabilities',
      type: 'array',
      of: [{type: 'string'}],
      group: 'tldr',
      description: 'One capability per line. Rendered as a stacked list.',
    }),
    defineField({
      name: 'questions',
      title: 'The questions we answer',
      type: 'array',
      group: 'tldr',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'label', type: 'string', title: 'Label'},
            {name: 'body', type: 'text', rows: 4, title: 'Body'},
          ],
          preview: {select: {title: 'label', subtitle: 'body'}},
        },
      ],
      description: 'Typically four: Conviction / System / Scale / Sustain.',
    }),
    defineField({
      name: 'clients',
      title: 'Clients',
      type: 'array',
      group: 'tldr',
      of: [{type: 'reference', to: [{type: 'client'}]}],
      description: 'Drag to reorder. Add via the Client document type.',
    }),

    // Our Work intro
    defineField({
      name: 'workIntroBlocks',
      title: 'Our Work intro blocks',
      type: 'array',
      group: 'work',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'heading', type: 'string', title: 'Heading'},
            {name: 'body', type: 'text', rows: 4, title: 'Body'},
          ],
          preview: {select: {title: 'heading', subtitle: 'body'}},
        },
      ],
      description:
        'Right-column copy beside the "Our Work" heading. Designed for two blocks but accepts any count.',
    }),

    // Newsroom
    defineField({
      name: 'newsroomIntro',
      title: 'Newsroom intro',
      type: 'text',
      rows: 3,
      group: 'newsroom',
      description: 'Short paragraph below the "Newsroom" heading.',
    }),

    // Awards
    defineField({
      name: 'awardsHeading',
      title: 'Awards heading',
      type: 'string',
      group: 'awards',
      initialValue: '14 years of global recognition.',
    }),
    defineField({
      name: 'awards',
      title: 'Awards',
      type: 'array',
      group: 'awards',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'description', type: 'string', title: 'Description'},
            {name: 'award', type: 'string', title: 'Award'},
            {name: 'year', type: 'number', title: 'Year'},
          ],
          preview: {
            select: {description: 'description', award: 'award', year: 'year'},
            prepare: ({description, award, year}) => ({
              title: description,
              subtitle: [award, year].filter(Boolean).join(' · '),
            }),
          },
        },
      ],
    }),

    // Meta
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
      rows: 2,
      group: 'meta',
      validation: (Rule) => Rule.max(160),
    }),
  ],
  preview: {prepare: () => ({title: 'Home page'})},
})
