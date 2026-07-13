import {defineField, defineType} from 'sanity'

/**
 * A single tile in the /play infinite gallery. Editors upload either an image
 * or a video file (image wins if both are set), pick an aspect ratio that
 * drives the tile's width, and choose which of the two rows it belongs to —
 * row 1 drifts left, row 2 drifts right.
 */
export default defineType({
  name: 'playItem',
  title: 'Play item',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Caption',
      type: 'string',
      description:
        'Shown beneath the tile. Keep it short — e.g. "Type study — 2026".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'row',
      title: 'Row',
      type: 'number',
      description:
        'Which of the two gallery rows this tile lives in. Row 1 drifts left, Row 2 drifts right.',
      options: {
        list: [
          {title: 'Row 1 (drifts left)', value: 1},
          {title: 'Row 2 (drifts right)', value: 2},
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      initialValue: 1,
    }),
    defineField({
      name: 'order',
      title: 'Order in row',
      type: 'number',
      description:
        'Lower = appears earlier in the row. Ties break by recency.',
      initialValue: 0,
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect ratio',
      type: 'string',
      description:
        'Determines tile width — all tiles share a row height, so wider ratios take more space.',
      options: {
        // Keep in step with PLAY_ASPECT in web/lib/playAspect.ts — a value the
        // web app doesn't know about has no width and lays out as 0.
        list: [
          {title: '9 × 16 (tall portrait)', value: '9/16'},
          {title: '2 × 3 (portrait)', value: '2/3'},
          {title: '3 × 4 (portrait)', value: '3/4'},
          {title: '4 × 5 (portrait)', value: '4/5'},
          {title: '1 × 1 (square)', value: '1/1'},
          {title: '4 × 3 (landscape)', value: '4/3'},
          {title: '3 × 2 (landscape)', value: '3/2'},
          {title: '16 × 9 (landscape)', value: '16/9'},
          {title: '21 × 9 (panoramic)', value: '21/9'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
      initialValue: '4/5',
    }),
    defineField({
      name: 'lightbox',
      title: 'Enable lightbox',
      type: 'boolean',
      initialValue: false,
      description:
        'When on, tapping this tile in the gallery opens it full-screen in a lightbox.',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description:
        'Upload an image — or a video file below. Image takes precedence if both are set.',
      options: {hotspot: true},
      fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
    }),
    defineField({
      name: 'videoFile',
      title: 'Video file',
      type: 'file',
      description:
        'Short looping MP4 / WebM. Plays muted on autoplay. Only used if no image is uploaded.',
      options: {accept: 'video/mp4,video/webm,video/quicktime'},
    }),
    defineField({
      name: 'poster',
      title: 'Video poster',
      type: 'image',
      description:
        'Optional. Shown while the video buffers. Only relevant when a video file is uploaded.',
      options: {hotspot: true},
      hidden: ({parent}) => !parent?.videoFile,
    }),
  ],
  preview: {
    select: {title: 'title', row: 'row', media: 'image'},
    prepare({title, row, media}) {
      return {
        title: title ?? '(no caption)',
        subtitle: `Row ${row ?? '?'}`,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Row, then order',
      name: 'rowOrder',
      by: [
        {field: 'row', direction: 'asc'},
        {field: 'order', direction: 'asc'},
      ],
    },
  ],
})
