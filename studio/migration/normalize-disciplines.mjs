import {getCliClient} from 'sanity/cli'

// Canonical disciplines: [slug, label]. Mirrors caseStudy.ts / web DISCIPLINE_LABELS.
const DISCIPLINES = [
  ['brand-identity', 'Brand identity'],
  ['strategy', 'Strategy'],
  ['digital-product', 'Digital product'],
  ['website', 'Website'],
  ['campaign', 'Campaign'],
  ['packaging', 'Packaging'],
  ['motion', 'Motion'],
  ['editorial', 'Editorial'],
  ['spatial', 'Spatial & retail'],
  ['service-design', 'Service design'],
]

const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '')
const toSlug = new Map()
for (const [slug, label] of DISCIPLINES) {
  toSlug.set(norm(slug), slug)
  toSlug.set(norm(label), slug)
}

const APPLY = process.env.APPLY === '1'
const client = getCliClient({apiVersion: '2025-05-01'})

const docs = await client.fetch(
  `*[_type=="caseStudy" && defined(disciplines)]{_id, title, disciplines}`,
)

let changed = 0
const unmapped = new Set()

for (const doc of docs) {
  const orig = doc.disciplines ?? []
  const slugs = []
  for (const v of orig) {
    if (v == null) continue // drop nulls
    const slug = toSlug.get(norm(v))
    if (!slug) {
      unmapped.add(v)
      slugs.push(v) // keep unknowns rather than lose data
    } else if (!slugs.includes(slug)) {
      slugs.push(slug)
    }
  }
  const same =
    orig.length === slugs.length && orig.every((v, i) => v === slugs[i])
  if (same) continue
  changed++
  console.log(`• ${doc.title}\n    ${JSON.stringify(orig)}\n -> ${JSON.stringify(slugs)}`)
  if (APPLY) {
    await client.patch(doc._id).set({disciplines: slugs}).commit()
  }
}

console.log(
  `\n${APPLY ? 'APPLIED' : 'DRY RUN'} — ${changed} of ${docs.length} case studies ${APPLY ? 'updated' : 'would change'}.`,
)
if (unmapped.size) console.log('Unmapped values (kept as-is):', [...unmapped])
if (!APPLY) console.log('Re-run with APPLY=1 to write changes.')
