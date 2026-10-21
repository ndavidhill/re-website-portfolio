import {defineConfig} from 'sanity'
import {structureTool, type StructureBuilder} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

// Public, non-secret identifiers (the project id is exposed client-side by
// design). Hardcoded as the source of truth so `sanity deploy` always embeds
// the right project even if a local .env isn't loaded; env vars still override
// for e.g. a staging dataset.
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || '7plawvk9'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

const SINGLETONS = ['homePage', 'infoPage'] as const
type Singleton = (typeof SINGLETONS)[number]
const isSingleton = (t: string | undefined): t is Singleton =>
  !!t && (SINGLETONS as readonly string[]).includes(t)

const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Home page')
        .id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage')),
      S.listItem()
        .title('Info page')
        .id('infoPage')
        .child(S.document().schemaType('infoPage').documentId('infoPage')),
      S.divider(),
      S.documentTypeListItem('caseStudy').title('Case studies'),
      S.documentTypeListItem('article').title('Articles'),
      S.documentTypeListItem('playItem').title('Play items'),
      S.documentTypeListItem('author').title('Authors'),
      S.documentTypeListItem('client').title('Clients'),
    ])

export default defineConfig({
  name: 'default',
  title: 're.design',

  projectId,
  dataset,

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    // Hide singletons from the default "Create new" menu (they're only
    // editable via the pinned list item above).
    templates: (templates) =>
      templates.filter(({schemaType}) => !isSingleton(schemaType)),
  },

  document: {
    // Block delete/duplicate actions on singletons.
    actions: (input, context) =>
      isSingleton(context.schemaType)
        ? input.filter(
            ({action}) =>
              action !== 'delete' &&
              action !== 'duplicate' &&
              action !== 'unpublish',
          )
        : input,
  },
})
