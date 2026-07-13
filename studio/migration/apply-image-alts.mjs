/**
 * Apply generated image alt text → caseStudy image fields.
 *
 * Reads a patches file: [{id, slug, path, alt, prev}] where `path` is a Sanity
 * key-addressed path relative to the document, e.g.
 *
 *   heroImage
 *   gridImages[_key=="a1b2"]
 *   body[_key=="blk1"].images[_key=="img7"]
 *
 * and sets `<path>.alt` on each. Only images whose alt was empty or was a
 * filename artefact of the migration are included — genuinely authored alt text
 * is filtered out upstream and never passed here.
 *
 *   Dry run (no Sanity):   node studio/migration/apply-image-alts.mjs --dry --in=<file>
 *   Apply (from /studio):  npx sanity exec migration/apply-image-alts.mjs --with-user-token -- --in=<file>
 */
import {readFileSync} from 'node:fs'
import {getCliClient} from 'sanity/cli'

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry')
const inArg = argv.find((a) => a.startsWith('--in='))
if (!inArg) {
  console.error('missing --in=<patches.json>')
  process.exit(1)
}

const patches = JSON.parse(readFileSync(inArg.slice('--in='.length), 'utf8'))

// Guard: a path must be key-addressed or a plain field. A bare positional index
// (gridImages[0]) would silently retarget if the array were ever reordered.
const bad = patches.filter((p) => /\[\d+\]/.test(p.path))
if (bad.length) {
  console.error(`refusing to patch ${bad.length} positional path(s), e.g. ${bad[0].path}`)
  process.exit(1)
}

const tooLong = patches.filter((p) => p.alt.length > 140)
if (tooLong.length) {
  console.error(`refusing: ${tooLong.length} alt(s) exceed 140 chars, e.g. ${tooLong[0].alt}`)
  process.exit(1)
}

console.log(`${patches.length} alt patches across ${new Set(patches.map((p) => p.id)).size} documents`)

if (DRY) {
  for (const p of patches.slice(0, 15)) {
    console.log(`\n  ${p.slug}  ${p.path}.alt`)
    console.log(`    was: ${p.prev === '' ? '(empty)' : JSON.stringify(p.prev)}`)
    console.log(`    now: ${JSON.stringify(p.alt)}`)
  }
  console.log(`\n… (${Math.max(0, patches.length - 15)} more). Dry run — nothing written.`)
  process.exit(0)
}

const client = getCliClient()

// Group by document so each case study is a single patch, and commit in
// transactions of ~10 docs to stay well inside Sanity's mutation limits.
const byDoc = new Map()
for (const p of patches) {
  if (!byDoc.has(p.id)) byDoc.set(p.id, [])
  byDoc.get(p.id).push(p)
}

const docs = [...byDoc.entries()]
let done = 0

for (let i = 0; i < docs.length; i += 10) {
  const chunk = docs.slice(i, i + 10)
  const tx = client.transaction()
  for (const [id, ps] of chunk) {
    const set = {}
    for (const p of ps) set[`${p.path}.alt`] = p.alt
    tx.patch(id, (patch) => patch.set(set))
  }
  await tx.commit({visibility: 'async'})
  done += chunk.reduce((n, [, ps]) => n + ps.length, 0)
  console.log(`  committed ${done}/${patches.length}`)
}

console.log(`\nDone — ${patches.length} alt texts written.`)
