import {defineType} from 'sanity'
import {
  ImageIcon,
  ImagesIcon,
  PlayIcon,
  BlockquoteIcon,
  BarChartIcon,
} from '@sanity/icons'

const LAYOUT_LABELS: Record<string, string> = {
  full: 'Full bleed',
  contained: 'Contained',
  pair: 'Image pair',
}

interface InlineImage {
  _key?: string
  _type?: 'image' | 'pairVideo'
  alt?: string
  asset?: {_ref?: string; _type?: 'reference'}
}

/**
 * Strips extension, replaces dashes/underscores with spaces, collapses runs of
 * whitespace, capitalises words. Turns "till_payments_hero-01.jpg" into
 * "Till Payments Hero 01".
 */
function prettyFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export const mediaBlock = defineType({
  name: 'mediaBlock',
  title: 'Image or image pair',
  type: 'object',
  icon: ImageIcon,
  fields: [
    {
      name: 'layout',
      type: 'string',
      title: 'Layout',
      options: {
        list: [
          {title: 'Full bleed', value: 'full'},
          {title: 'Contained', value: 'contained'},
          {title: 'Side by side (images / videos)', value: 'pair'},
        ],
      },
      initialValue: 'contained',
    },
    {
      name: 'images',
      type: 'array',
      title: 'Images / videos',
      description:
        'One or two items. In the side-by-side layout each slot can be an image or a video (Vimeo/YouTube URL or an MP4 upload) — e.g. two portrait videos.',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [{name: 'alt', type: 'string', title: 'Alt text'}],
        },
        {
          type: 'object',
          name: 'pairVideo',
          title: 'Video',
          icon: PlayIcon,
          fields: [
            {
              name: 'url',
              type: 'url',
              title: 'Video URL',
              description: 'Vimeo or YouTube (for embeds). Autoplays muted + loops.',
            },
            {
              name: 'videoFile',
              type: 'file',
              title: 'Video file',
              description:
                'Self-hosted video. Use this OR a URL — file takes precedence. Autoplays muted + loops.',
              options: {accept: 'video/mp4,video/webm,video/quicktime'},
            },
            {
              name: 'poster',
              type: 'image',
              title: 'Poster image',
              options: {hotspot: true},
            },
            {name: 'alt', type: 'string', title: 'Alt text'},
          ],
          preview: {
            select: {
              alt: 'alt',
              url: 'url',
              poster: 'poster',
              filename: 'videoFile.asset.originalFilename',
            },
            prepare: ({alt, url, poster, filename}) => {
              const filenameTitle =
                typeof filename === 'string' ? prettyFilename(filename) : null
              return {
                title:
                  (alt as string) ||
                  filenameTitle ||
                  (url ? `Video — ${url}` : 'Video (empty)'),
                subtitle: 'Video',
                media: poster ?? PlayIcon,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.min(1).max(2),
    },
    {
      name: 'aspectRatio',
      type: 'string',
      title: 'Pair aspect ratio',
      description:
        'Side-by-side layout only. Frame ratio applied to both columns. Default "4/5". Use "9/16" for tall portrait video, "1/1" for square.',
      placeholder: '4/5',
      hidden: ({parent}) => (parent as {layout?: string})?.layout !== 'pair',
    },
    {name: 'caption', type: 'string', title: 'Caption'},
  ],
  preview: {
    select: {
      layout: 'layout',
      caption: 'caption',
      images: 'images',
      firstAlt: 'images.0.alt',
      firstFilename: 'images.0.asset.originalFilename',
    },
    prepare: ({layout, caption, images, firstAlt, firstFilename}) => {
      const imgs = (images as InlineImage[] | undefined) ?? []
      const first = imgs[0]
      const count = imgs.length
      const layoutLabel = LAYOUT_LABELS[layout as string] ?? 'Image'

      const filenameTitle =
        typeof firstFilename === 'string' ? prettyFilename(firstFilename) : null
      const title =
        (caption as string) ||
        (firstAlt as string) ||
        filenameTitle ||
        (count ? layoutLabel : `${layoutLabel} (empty)`)

      const subtitle = count
        ? `${layoutLabel}${count === 2 ? ' · 2 items' : ''}`
        : 'No media yet'

      const firstImage = first?._type === 'image' ? first : undefined
      return {title, subtitle, media: firstImage ?? ImageIcon}
    },
  },
})

export const quoteBlock = defineType({
  name: 'quoteBlock',
  title: 'Pull quote',
  type: 'object',
  icon: BlockquoteIcon,
  fields: [
    {name: 'quote', type: 'text', rows: 3, title: 'Quote'},
    {name: 'attribution', type: 'string', title: 'Attribution'},
    {name: 'role', type: 'string', title: 'Role or company'},
  ],
  preview: {
    select: {quote: 'quote', attribution: 'attribution', role: 'role'},
    prepare: ({quote, attribution, role}) => ({
      title: quote ? `“${quote}”` : 'Pull quote (empty)',
      subtitle: [attribution, role].filter(Boolean).join(' · ') || undefined,
      media: BlockquoteIcon,
    }),
  },
})

export const statsBlock = defineType({
  name: 'statsBlock',
  title: 'Stats',
  type: 'object',
  icon: BarChartIcon,
  fields: [
    {
      name: 'stats',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'value', type: 'string', title: 'Value', description: 'E.g. "+47%", "3.2M"'},
            {name: 'label', type: 'string', title: 'Label'},
          ],
          preview: {select: {title: 'value', subtitle: 'label'}},
        },
      ],
      validation: (Rule) => Rule.min(1).max(4),
    },
  ],
  preview: {
    select: {stats: 'stats'},
    prepare: ({stats}) => {
      const list = (stats as Array<{value?: string}> | undefined) ?? []
      const values = list.map((s) => s.value).filter(Boolean) as string[]
      return {
        title: values.length ? `Stats: ${values.join(' · ')}` : 'Stats (empty)',
        media: BarChartIcon,
      }
    },
  },
})

export const galleryBlock = defineType({
  name: 'galleryBlock',
  title: 'Gallery',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    {
      name: 'images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            {name: 'alt', type: 'string', title: 'Alt text'},
            {
              name: 'aspectRatio',
              type: 'string',
              title: 'Aspect ratio',
              description:
                "Cell shape. Defaults to the image's own (natural) shape — pick a preset only to force a different crop. On mobile the grid is 2-up; a lone final image spans full width.",
              options: {
                list: [
                  {title: "Auto — image's natural shape", value: 'auto'},
                  {title: 'Square (1:1)', value: '1/1'},
                  {title: 'Portrait (4:5)', value: '4/5'},
                  {title: 'Tall (3:4)', value: '3/4'},
                  {title: 'Landscape (4:3)', value: '4/3'},
                  {title: 'Wide (16:9)', value: '16/9'},
                  {title: 'Tall portrait (9:16)', value: '9/16'},
                ],
              },
              initialValue: 'auto',
            },
            {
              name: 'customAspectRatio',
              type: 'string',
              title: 'Custom aspect ratio',
              description:
                'Override for when none of the presets fit — e.g. a very tall image. Enter width/height like "5/16" or a decimal like "0.42". Takes precedence over the preset above.',
              validation: (Rule) =>
                Rule.custom((v) => {
                  if (!v) return true
                  const c = String(v).trim().replace(/:/g, '/').replace(/\s+/g, '')
                  return /^\d+(\.\d+)?(\/\d+(\.\d+)?)?$/.test(c)
                    ? true
                    : 'Enter a ratio like "5/16", "9:16", or a decimal like "0.42".'
                }),
            },
          ],
        },
      ],
      validation: (Rule) => Rule.min(2),
    },
    {
      name: 'columns',
      type: 'number',
      title: 'Columns',
      options: {list: [2, 3, 4]},
      initialValue: 3,
    },
  ],
  preview: {
    select: {
      images: 'images',
      columns: 'columns',
      firstAlt: 'images.0.alt',
      firstFilename: 'images.0.asset.originalFilename',
    },
    prepare: ({images, columns, firstAlt, firstFilename}) => {
      const imgs = (images as InlineImage[] | undefined) ?? []
      const first = imgs[0]
      const count = imgs.length

      const filenameTitle =
        typeof firstFilename === 'string' ? prettyFilename(firstFilename) : null
      const nameTitle = (firstAlt as string) || filenameTitle

      const title = count
        ? nameTitle
          ? `${nameTitle} + ${count - 1} more`
          : `Gallery (${count} images)`
        : 'Gallery (empty)'

      return {
        title,
        subtitle: columns ? `${columns} columns` : undefined,
        media: first ?? ImagesIcon,
      }
    },
  },
})

export const videoBlock = defineType({
  name: 'videoBlock',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    {name: 'url', type: 'url', title: 'Video URL', description: 'Vimeo or YouTube (for embeds)'},
    {
      name: 'videoFile',
      type: 'file',
      title: 'Video file',
      description:
        'Self-hosted video (autoplays muted, loops). Use this OR a URL — file takes precedence.',
      options: {accept: 'video/mp4,video/webm,video/quicktime'},
    },
    {
      name: 'poster',
      type: 'image',
      title: 'Poster image',
      options: {hotspot: true},
    },
    {name: 'caption', type: 'string', title: 'Caption'},
    {
      name: 'audioControl',
      type: 'boolean',
      title: 'Show audio toggle',
      description:
        'Off by default — video autoplays muted with controls hidden. Turn on to show a mute/unmute button (same component as the homepage hero).',
      initialValue: false,
    },
    {
      name: 'aspectRatio',
      type: 'string',
      title: 'Aspect ratio',
      description:
        'Optional. Set to override the auto-detected aspect (e.g. "16/9", "9/16", "4/5"). Leave blank to detect from the video itself on load.',
      placeholder: '16/9',
    },
  ],
  preview: {
    select: {
      caption: 'caption',
      url: 'url',
      poster: 'poster',
      posterFilename: 'poster.asset.originalFilename',
    },
    prepare: ({caption, url, poster, posterFilename}) => {
      let host: string | undefined
      try {
        if (url) host = new URL(url as string).hostname.replace(/^www\./, '')
      } catch {
        host = undefined
      }

      const filenameTitle =
        typeof posterFilename === 'string'
          ? prettyFilename(posterFilename)
          : null
      const title =
        (caption as string) ||
        filenameTitle ||
        (url ? `Video — ${host ?? url}` : 'Video (empty)')

      const subtitle = host && !(title as string).includes(host) ? host : undefined

      return {
        title,
        subtitle,
        media: poster ?? PlayIcon,
      }
    },
  },
})
