/**
 * Phase 3 — Transform selected Prismic docs → Sanity NDJSON.
 *
 * Reads raw/{work,article,author}.json + selection.json, emits
 * out/docs.ndjson ready for `sanity dataset import`. Images/videos use the
 * `_sanityAsset` ("image@<url>" / "file@<url>") syntax so the import fetches +
 * uploads them automatically — no separate asset pass needed.
 *
 * Read-only w.r.t. Sanity. Run: node studio/migration/transform.mjs
 */
import {readFile, writeFile, mkdir} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const RAW = join(DIR, 'raw')
const OUT = join(DIR, 'out')

const DISCIPLINE_MAP = {
  'Brand Strategy and Identity Design': 'brand-identity',
  'Digital Products': 'digital-product',
  'Content Creation': 'editorial',
  'Organisational Strategy and Design': 'strategy',
  'Spatial & Retail Design': 'spatial',
  'Service Design': 'service-design',
  'Employee Experience Design (EX)': 'strategy',
}

const warnings = []
const key = () => Math.random().toString(36).slice(2, 12)
const stripQuery = (url) => (url || '').split('?')[0]

function img(prismicImg, withKey = false) {
  if (!prismicImg?.url) return null
  const o = {_type: 'image', _sanityAsset: `image@${stripQuery(prismicImg.url)}`}
  if (prismicImg.alt) o.alt = prismicImg.alt
  if (withKey) o._key = key()
  return o
}

function imgFromMedia(media) {
  if (!media?.url || media.kind !== 'image') return null
  return {
    _type: 'image',
    _key: key(),
    _sanityAsset: `image@${stripQuery(media.url)}`,
    ...(media.name ? {alt: stripExt(media.name)} : {}),
  }
}

const stripExt = (s) => String(s || '').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()

// ── Rich text (Prismic) → Portable Text ──────────────────────────────────────

const STYLE = {
  paragraph: 'normal',
  heading1: 'h2',
  heading2: 'h2',
  heading3: 'h3',
  heading4: 'h3',
  heading5: 'h3',
  heading6: 'h3',
  preformatted: 'normal',
}

function spansToChildren(text, spans) {
  const t = text ?? ''
  const points = new Set([0, t.length])
  for (const s of spans ?? []) {
    points.add(s.start)
    points.add(s.end)
  }
  const sorted = [...points].sort((a, b) => a - b)
  const markDefs = []
  const children = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i]
    const end = sorted[i + 1]
    if (start >= end) continue
    const marks = []
    for (const s of spans ?? []) {
      if (s.start <= start && s.end >= end) {
        if (s.type === 'strong') marks.push('strong')
        else if (s.type === 'em') marks.push('em')
        else if (s.type === 'hyperlink') {
          const href = s.data?.url || s.data?.value?.url || ''
          if (href) {
            const k = key()
            markDefs.push({_key: k, _type: 'link', href, newTab: s.data?.target === '_blank'})
            marks.push(k)
          }
        }
      }
    }
    children.push({_type: 'span', _key: key(), text: t.slice(start, end), marks})
  }
  if (children.length === 0) children.push({_type: 'span', _key: key(), text: t, marks: []})
  return {children, markDefs}
}

function nodeToBlock(node) {
  if (node.type === 'image') return img(node, true)
  if (node.type === 'embed') return null
  const isList = node.type === 'list-item' || node.type === 'o-list-item'
  const {children, markDefs} = spansToChildren(node.text, node.spans)
  return {
    _type: 'block',
    _key: key(),
    style: isList ? 'normal' : STYLE[node.type] ?? 'normal',
    ...(isList ? {listItem: 'bullet'} : {}),
    markDefs,
    children,
  }
}

const richToBlocks = (rt) => (rt ?? []).map(nodeToBlock).filter(Boolean)
const richToPlain = (rt) =>
  (rt ?? [])
    .map((n) => n.text ?? '')
    .filter(Boolean)
    .join('\n\n')
    .trim()

const h = (text, style = 'normal') => ({
  _type: 'block',
  _key: key(),
  style,
  markDefs: [],
  children: [{_type: 'span', _key: key(), text, marks: []}],
})

// ── Work → caseStudy ─────────────────────────────────────────────────────────

function transformWork(doc) {
  const d = doc.data
  const body = []
  const accordion = []
  let hero = null
  let projectTitle = null // first introduction_block heading → case study title
  let descPanel = null // first paragraph_breakout → "Description" accordion panel

  for (const s of d.body ?? []) {
    const p = s.primary ?? {}
    switch (s.slice_type) {
      case 'work_-_full_width_image': {
        const im = img(p.image, true)
        if (im) {
          if (!hero) hero = p.image
          body.push({_type: 'mediaBlock', _key: key(), layout: 'full', images: [im]})
        }
        break
      }
      case 'work_-_full_width_video': {
        if (p.video?.url) {
          body.push({
            _type: 'videoBlock',
            _key: key(),
            videoFile: {_sanityAsset: `file@${stripQuery(p.video.url)}`},
            audioControl: false,
          })
        }
        break
      }
      case 'half_image_block':
        pushMedia(body, s.items, 'pair')
        break
      case 'work_-_carousel_1':
      case 'work_-_carousel_2':
      case 'third_image_block':
        pushMedia(body, s.items, 'gallery')
        break
      case 'work_-_paragraph_breakout':
        // First intro paragraph becomes the "Description" accordion panel;
        // any further paragraphs stay in the body.
        if (!descPanel) {
          descPanel = {_key: key(), title: 'Description', body: richToPlain(p.content)}
        } else {
          body.push(...richToBlocks(p.content))
        }
        break
      case 'work_-_introduction_block':
        // First heading becomes the project title (H1); later ones stay as
        // section headings in the body.
        if (!projectTitle && p.heading) projectTitle = p.heading
        else if (p.heading) body.push(h(p.heading, 'h2'))
        break
      case 'work_-_quote_breakout':
        if (p.quote)
          body.push({
            _type: 'quoteBlock',
            _key: key(),
            quote: p.quote,
            ...(p.credit_footnote ? {attribution: p.credit_footnote} : {}),
          })
        break
      case 'work_-_label___content_breakout':
        accordion.push({
          _key: key(),
          title: p.label_title || 'Section',
          body: richToPlain(p.content),
        })
        break
      // tags_module, work_-_video_block__embed_ (always empty): skip
    }
  }

  const heroImage =
    img(hero) || img(d.seo_image) || img(d.thumbnail_image) || img(d.small_thumbnail_image)
  if (!heroImage) warnings.push(`work ${doc.uid}: no hero image resolved`)

  const thumbnailImage = img(d.small_thumbnail_image) || img(d.thumbnail_image) || heroImage
  const disciplines = [
    ...new Set((d.work_type_categories ?? []).map((c) => DISCIPLINE_MAP[c.work_type_category]).filter(Boolean)),
  ]
  const year = parseInt(String(doc.first_publication_date).slice(0, 4), 10) || 2024

  // Description panel first (open by default), then the label/content panels.
  if (!descPanel && d.excerpt) descPanel = {_key: key(), title: 'Description', body: d.excerpt}
  const descriptionAccordion = descPanel ? [descPanel, ...accordion] : accordion

  return {
    _id: `caseStudy-${doc.uid}`,
    _type: 'caseStudy',
    title: projectTitle || d.title, // intro heading → H1; client name as fallback
    slug: {_type: 'slug', current: doc.uid},
    client: d.title, // brand name (Prismic has no separate client field)
    year,
    summary: d.excerpt || d.sub_title || d.title,
    ...(d.sub_title ? {tagline: d.sub_title} : {}),
    ...(disciplines.length ? {disciplines} : {}),
    ...(heroImage ? {heroImage} : {}),
    ...(thumbnailImage ? {thumbnailImage} : {}),
    ...(descriptionAccordion.length ? {descriptionAccordion} : {}),
    ...(body.length ? {body} : {}),
    featured: false,
  }
}

function pushMedia(body, items, mode) {
  const images = []
  const videos = []
  for (const it of items ?? []) {
    const m = it.image_or_video
    if (!m?.url) continue
    if (m.kind === 'image') images.push(imgFromMedia(m))
    else if (m.kind === 'file') videos.push(m)
  }
  const imgs = images.filter(Boolean)
  if (mode === 'pair' && imgs.length) {
    body.push({_type: 'mediaBlock', _key: key(), layout: 'pair', images: imgs.slice(0, 2)})
    if (imgs.length > 2)
      body.push({_type: 'galleryBlock', _key: key(), images: imgs.slice(2), columns: 3})
  } else if (imgs.length) {
    body.push({_type: 'galleryBlock', _key: key(), images: imgs, columns: 3})
  }
  for (const v of videos)
    body.push({
      _type: 'videoBlock',
      _key: key(),
      videoFile: {_sanityAsset: `file@${stripQuery(v.url)}`},
      audioControl: false,
    })
}

// ── Article → article, Author → author ───────────────────────────────────────

function transformArticle(doc, refByPrismicId) {
  const d = doc.data
  const body = []
  for (const s of d.body ?? []) {
    const p = s.primary ?? {}
    switch (s.slice_type) {
      case 'text_content':
        body.push(...richToBlocks(p.content))
        break
      case 'image_block': {
        const im = img(p.image, true)
        if (im) body.push(im)
        break
      }
      case 'image_carousel':
        for (const it of s.items ?? []) {
          const im = img(it.image, true)
          if (im) body.push(im)
        }
        break
      case 'quote':
      case 'share_quote':
        if (p.quote) {
          body.push(h(`“${p.quote}”`, 'h3'))
          if (p.credit) body.push(h(p.credit, 'normal'))
        }
        break
    }
  }

  const aid = d.author?.id
  const ref = aid ? refByPrismicId[aid] : null
  if (aid && !ref) warnings.push(`article ${doc.uid}: author ${aid} not resolved`)

  return {
    _id: `article-${doc.uid}`,
    _type: 'article',
    title: d.title,
    slug: {_type: 'slug', current: doc.uid},
    excerpt: d.excerpt || '',
    authors: ref ? [{_type: 'reference', _key: key(), _ref: ref}] : [],
    publishedAt: d.date ? new Date(d.date).toISOString() : doc.first_publication_date,
    ...(d.featured_thumbnail?.url
      ? {coverImage: img(d.featured_thumbnail)}
      : d.thumbnail?.url
      ? {coverImage: img(d.thumbnail)}
      : {}),
    ...(d.category ? {tags: [d.category]} : {}),
    ...(body.length ? {body} : {}),
  }
}

async function main() {
  await mkdir(OUT, {recursive: true})
  const work = JSON.parse(await readFile(join(RAW, 'work.json'), 'utf8'))
  const article = JSON.parse(await readFile(join(RAW, 'article.json'), 'utf8'))
  const author = JSON.parse(await readFile(join(RAW, 'author.json'), 'utf8'))
  const sel = JSON.parse(await readFile(join(DIR, 'selection.json'), 'utf8'))

  const byUid = (arr) => Object.fromEntries(arr.map((d) => [d.uid, d]))
  const workByUid = byUid(work)
  const articleByUid = byUid(article)
  const authorById = Object.fromEntries(author.map((a) => [a.id, a.data]))

  // Authors referenced by selected articles → Sanity author docs (deduped).
  const refByPrismicId = {}
  const authorDocs = []
  for (const uid of sel.article) {
    const a = articleByUid[uid]
    const link = a?.data?.author
    if (!link?.id || refByPrismicId[link.id]) continue
    const slug = link.slug || (authorById[link.id]?.name ?? link.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const _id = `author-${slug}`
    refByPrismicId[link.id] = _id
    authorDocs.push({
      _id,
      _type: 'author',
      name: authorById[link.id]?.name || slug,
      slug: {_type: 'slug', current: slug},
      ...(authorById[link.id]?.title ? {role: authorById[link.id].title} : {}),
    })
  }

  const caseStudies = sel.work.map((uid) => transformWork(workByUid[uid]))
  const articles = sel.article.map((uid) => transformArticle(articleByUid[uid], refByPrismicId))

  const all = [...authorDocs, ...caseStudies, ...articles]
  const ndjson = all.map((d) => JSON.stringify(d)).join('\n') + '\n'
  await writeFile(join(OUT, 'docs.ndjson'), ndjson)

  console.log(
    `Wrote out/docs.ndjson — ${authorDocs.length} authors, ${caseStudies.length} case studies, ${articles.length} articles`,
  )
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`)
    for (const w of warnings) console.log('  -', w)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
