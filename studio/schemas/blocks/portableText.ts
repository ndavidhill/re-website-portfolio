import {defineType} from 'sanity'

export const portableText = defineType({
  name: 'portableText',
  title: 'Portable text',
  type: 'array',
  of: [
    {
      type: 'block',
      styles: [
        {title: 'Body', value: 'normal'},
        {title: 'Heading', value: 'h2'},
        {title: 'Subheading', value: 'h3'},
      ],
      lists: [{title: 'Bullet', value: 'bullet'}],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {name: 'href', type: 'url', title: 'URL'},
              {name: 'newTab', type: 'boolean', title: 'Open in new tab', initialValue: false},
            ],
          },
        ],
      },
    },
    // Inline images — used by article bodies (migrated from Prismic image
    // slices). The article frontend isn't built yet, but the images are stored
    // here so nothing is lost.
    {
      type: 'image',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Alt text'},
        {name: 'caption', type: 'string', title: 'Caption'},
      ],
    },
  ],
})
