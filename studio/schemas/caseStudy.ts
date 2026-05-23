import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  groups: [
    {name: 'overview', title: 'Overview', default: true},
    {name: 'content', title: 'Content'},
    {name: 'credits', title: 'Credits'},
    {name: 'meta', title: 'Meta & SEO'},
  ],
  fields: [
    // Overview
    defineField({
      name: 'title',
      title: 'Project title',
      type: 'string',
      group: 'overview',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'overview',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      group: 'overview',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      group: 'overview',
      validation: (Rule) => Rule.required().min(2000).max(2100),
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'text',
      rows: 6,
      group: 'overview',
      description: 'SEO meta description and social card fallback. Keep it short.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'overview',
      description:
        "Short phrase next to the client name on the Work index. e.g. 'Accelerating growth by putting customers first'.",
    }),
    defineField({
      name: 'descriptionAccordion',
      title: 'Description accordion',
      type: 'array',
      group: 'overview',
      description:
        'Expandable description panels shown sticky on the right of the case study. First item is open by default.',
      of: [
        {
          type: 'object',
          name: 'descriptionAccordionItem',
          fields: [
            {
              name: 'title',
              type: 'string',
              title: 'Title',
              validation: (Rule) => Rule.required(),
            },
            {name: 'body', type: 'text', rows: 6, title: 'Body'},
          ],
          preview: {
            select: {title: 'title', subtitle: 'body'},
            prepare: ({title, subtitle}) => ({
              title: (title as string) || 'Untitled section',
              subtitle: subtitle as string,
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'disciplines',
      title: 'Disciplines',
      type: 'array',
      group: 'overview',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
        list: [
          {title: 'Brand identity', value: 'brand-identity'},
          {title: 'Strategy', value: 'strategy'},
          {title: 'Digital product', value: 'digital-product'},
          {title: 'Website', value: 'website'},
          {title: 'Campaign', value: 'campaign'},
          {title: 'Packaging', value: 'packaging'},
          {title: 'Motion', value: 'motion'},
          {title: 'Editorial', value: 'editorial'},
          {title: 'Spatial & retail', value: 'spatial'},
          {title: 'Service design', value: 'service-design'},
        ],
      },
      description: 'Pick all that apply. Edit the list in caseStudy.ts to add new disciplines.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'overview',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'thumbnailImage',
      title: 'Thumbnail image',
      type: 'image',
      group: 'overview',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
      description:
        'Single-image fallback for the Work index when no Grid images are set, and used by the homepage card.',
    }),
    defineField({
      name: 'gridImages',
      title: 'Grid media',
      type: 'array',
      group: 'overview',
      description:
        '1–4 images or short looping videos. Each card keeps its intrinsic aspect ratio on /work. Falls back to the thumbnail image if empty.',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
        },
        {
          type: 'object',
          name: 'gridVideo',
          title: 'Video',
          fields: [
            {
              name: 'file',
              type: 'file',
              title: 'Video file',
              options: {accept: 'video/mp4,video/webm,video/quicktime'},
            },
            {
              name: 'aspectRatio',
              type: 'string',
              title: 'Aspect ratio',
              description:
                'Required — e.g. "16/9", "9/16", "1/1", "4/5". Determines the card height.',
              placeholder: '16/9',
              validation: (Rule) => Rule.required(),
            },
            {name: 'alt', type: 'string', title: 'Alt text'},
            {
              name: 'poster',
              type: 'image',
              title: 'Poster image',
              options: {hotspot: true},
              description: 'Shown while the video loads.',
            },
          ],
          preview: {
            select: {
              title: 'alt',
              ratio: 'aspectRatio',
              filename: 'file.asset.originalFilename',
              media: 'poster',
            },
            prepare: ({title, ratio, filename, media}) => ({
              title:
                (title as string) ||
                (filename
                  ? (filename as string).replace(/\.[^.]+$/, '')
                  : 'Video'),
              subtitle: (ratio as string) || 'Video',
              media,
            }),
          },
        },
      ],
      validation: (Rule) => Rule.max(4),
    }),
    defineField({
      name: 'featured',
      title: 'Feature on homepage',
      type: 'boolean',
      group: 'overview',
      initialValue: false,
    }),
    defineField({
      name: 'isNew',
      title: 'Show "NEW" badge',
      type: 'boolean',
      group: 'overview',
      initialValue: false,
      description: 'Adds the green NEW badge to the work card on the homepage.',
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      group: 'overview',
      description: 'Lower numbers appear first on the Work index. Leave blank to sort by year.',
    }),
    // Content
    defineField({
      name: 'body',
      title: 'Case study body',
      type: 'array',
      group: 'content',
      of: [
        {type: 'block'}, // rich text
        {type: 'mediaBlock'},
        {type: 'quoteBlock'},
        {type: 'statsBlock'},
        {type: 'galleryBlock'},
        {type: 'videoBlock'},
      ],
      description: 'Mix rich text with media, quotes, stats, galleries, and video.',
    }),
    // Credits
    defineField({
      name: 'credits',
      title: 'Project credits',
      type: 'array',
      group: 'credits',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'role', type: 'string', title: 'Role'},
            {name: 'people', type: 'string', title: 'People', description: 'Comma-separated names'},
          ],
          preview: {select: {title: 'role', subtitle: 'people'}},
        },
      ],
    }),
    defineField({
      name: 'externalUrl',
      title: 'Live project URL',
      type: 'url',
      group: 'credits',
      description: 'Optional link to live site, app, etc.',
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
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}, {field: 'year', direction: 'desc'}],
    },
    {
      title: 'Year, newest first',
      name: 'yearDesc',
      by: [{field: 'year', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      client: 'client',
      year: 'year',
      media: 'thumbnailImage',
    },
    prepare({title, client, year, media}) {
      return {title, subtitle: `${client} · ${year}`, media}
    },
  },
})
