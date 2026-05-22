# Sanity schemas — re.design

Drop this `schemas/` folder into `/studio/` in your new monorepo.

## Files

```
schemas/
  index.ts                       → registers all types
  author.ts                      → Author (document)
  article.ts                     → Article (document)
  caseStudy.ts                   → Case Study (document)
  blocks/
    portableText.ts              → shared rich text config
    caseStudyBlocks.ts           → media, quote, stats, gallery, video
```

## Wiring up

In `sanity.config.ts`:

```ts
import {schemaTypes} from './schemas'

export default defineConfig({
  // ...
  schema: {types: schemaTypes},
})
```

## Still to draft

Singletons not yet defined — add as you go:
- `homePage` (likely a flexible block array based on Figma)
- `aboutPage`
- `careersPage`
- `contactPage`
- `playPage`
- `thinkIndexPage` (Think landing — header + maybe featured tags)
- `workIndexPage` (Work landing — header + filter config)
- `mainMenu` (nav links)
- `footer` (footer columns, social, legal)
- `siteOptions` (default OG image, social handles, etc.)

For singletons, use `__experimental_actions: ['update', 'publish']` (disable create/delete) in each schema, and configure the Studio structure to pin them at the top of the document list.

## Principles

- Field groups keep editor view uncluttered
- Validation limits prevent layout-breaking content
- Restricted choice lists (disciplines, layout variants) over free text
- Custom previews show useful info in document lists
- Portable Text is deliberately limited — body, h2, h3, bullets, bold, italic, link
- No category fields, no "related" fields, no reading time fields
