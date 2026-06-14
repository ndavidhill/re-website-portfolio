import {getCliClient} from 'sanity/cli'

/**
 * Populate `gridImages` (the Work-index daisy-chain row) for case studies that
 * only have a thumbnail. For each, we pool every image the case study already
 * owns (thumbnail + hero + body media/gallery), then pick 3–4 with the most
 * varied aspect ratios — one per ratio bucket where possible, ordered to
 * alternate wide/tall — so the row reads dynamically instead of as a uniform
 * strip. Reuses existing assets only (no uploads).
 *
 *   Dry run:  npx sanity exec migration/recommend-grid-images.mjs --with-user-token
 *   Apply:    APPLY=1 npx sanity exec migration/recommend-grid-images.mjs --with-user-token
 *
 * Idempotent: only touches case studies whose gridImages is currently empty.
 */
const APPLY = process.env.APPLY === '1'
const client = getCliClient({apiVersion: '2025-05-01'})

const docs = await client.fetch(`
  *[_type=="caseStudy" && (!defined(gridImages) || count(gridImages) == 0)]{
    _id, title, "slug": slug.current,
    "thumb": thumbnailImage{alt, "id": asset->_id, "ar": asset->metadata.dimensions.aspectRatio},
    "hero": heroImage{alt, "id": asset->_id, "ar": asset->metadata.dimensions.aspectRatio},
    "media": body[_type=="mediaBlock"].images[_type!="pairVideo"]{alt, "id": asset->_id, "ar": asset->metadata.dimensions.aspectRatio},
    "gallery": body[_type=="galleryBlock"].images[]{alt, "id": asset->_id, "ar": asset->metadata.dimensions.aspectRatio}
  } | order(title asc)
`)

const bucket = (ar) =>
  ar == null ? '?' : ar < 0.85 ? 'portrait' : ar < 1.15 ? 'square' : ar < 1.7 ? 'landscape' : 'wide'

function poolOf(doc) {
  const out = []
  const seen = new Set()
  const add = (o) => {
    if (!o?.id || o.ar == null || seen.has(o.id)) return
    seen.add(o.id)
    out.push({id: o.id, alt: o.alt || '', ar: o.ar, b: bucket(o.ar)})
  }
  add(doc.thumb)
  add(doc.hero)
  ;(doc.media ?? []).forEach(add)
  ;(doc.gallery ?? []).forEach(add)
  return out
}

function pick(pool) {
  const by = {}
  for (const im of pool) (by[im.b] ??= []).push(im)
  const chosen = []
  for (const b of ['landscape', 'portrait', 'wide', 'square']) {
    if (by[b]?.length) chosen.push(by[b][0])
  }
  // Fill to 4 with the images whose ratio is most different from those chosen.
  while (chosen.length < 4 && chosen.length < pool.length) {
    let best = null
    let bestDist = -1
    for (const im of pool) {
      if (chosen.some((c) => c.id === im.id)) continue
      const dist = chosen.length
        ? Math.min(...chosen.map((c) => Math.abs(im.ar - c.ar)))
        : 99
      if (dist > bestDist) {
        bestDist = dist
        best = im
      }
    }
    if (!best) break
    chosen.push(best)
  }
  // Order to alternate wide/landscape with tall (portrait/square).
  const isWide = (b) => b === 'landscape' || b === 'wide'
  const wides = chosen.filter((c) => isWide(c.b))
  const talls = chosen.filter((c) => !isWide(c.b))
  const ordered = []
  while (wides.length || talls.length) {
    if (wides.length) ordered.push(wides.shift())
    if (talls.length) ordered.push(talls.shift())
  }
  return ordered
}

const key = (id, i) => `grid_${i}_${id.replace('image-', '').slice(0, 10)}`

let updated = 0
let skipped = 0
for (const doc of docs) {
  const pool = poolOf(doc)
  if (pool.length < 2) {
    console.log(`• SKIP ${doc.slug} — only ${pool.length} usable image`)
    skipped++
    continue
  }
  const sel = pick(pool)
  const gridImages = sel.map((im, i) => ({
    _type: 'image',
    _key: key(im.id, i),
    asset: {_type: 'reference', _ref: im.id},
    ...(im.alt ? {alt: im.alt} : {}),
  }))
  console.log(
    `• ${doc.slug}  (${pool.length} avail → ${sel.length}: ${sel.map((s) => s.b).join(', ')})`,
  )
  if (APPLY) {
    await client.patch(doc._id).set({gridImages}).commit()
    updated++
  }
}

console.log(
  `\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${APPLY ? updated : docs.length - skipped} case studies ${APPLY ? 'updated' : 'would update'}, ${skipped} skipped.`,
)
if (!APPLY) console.log('Re-run with APPLY=1 to write changes.')
