import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'meta', title: 'Meta & SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Shown on the Think index and in social previews. ~2 sentences.',
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: 'authors',
      title: 'Authors',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'author'}]}],
      validation: (Rule) => Rule.required().min(1),
      description: 'Most articles have one author. Add more for co-authored pieces.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published date',
      type: 'datetime',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      group: 'content',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Alt text'},
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: 'Used for filtering on the Think index.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'portableText',
      group: 'content',
    }),
    // Meta group
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      group: 'meta',
      description: 'Defaults to the article title. Override only if needed.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 2,
      group: 'meta',
      description: 'Defaults to excerpt. Override for search results specifically.',
      validation: (Rule) => Rule.max(160),
    }),
  ],
  orderings: [
    {
      title: 'Published date, newest first',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author0: 'authors.0.name',
      date: 'publishedAt',
      media: 'coverImage',
    },
    prepare({title, author0, date, media}) {
      const dateStr = date ? new Date(date).toLocaleDateString() : 'Unpublished'
      return {title, subtitle: `${author0 ?? 'No author'} · ${dateStr}`, media}
    },
  },
})
