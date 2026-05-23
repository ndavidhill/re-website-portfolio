/**
 * Generate out/pilot.ndjson — a small, varied subset of out/docs.ndjson for
 * the Phase 5 pilot import. Reproducible (no ad-hoc one-liners).
 *
 * Run after transform.mjs:  node studio/migration/make-pilot.mjs
 */
import {readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out')

// Chosen to exercise every transform path:
// - tourism-australia: galleries + 7-panel accordion + paragraphs
// - domain-refresh: native full-width video
// - commbank: carousel_2
// - thejollofkitchen: article (inline images, links) + its author
const PILOT_IDS = new Set([
  'caseStudy-tourism-australia',
  'caseStudy-domain-refresh',
  'caseStudy-commbank',
  'article-thejollofkitchen',
  'author-ola-olorunnimbe',
])

const docs = (await readFile(join(OUT, 'docs.ndjson'), 'utf8'))
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l))
  .filter((d) => PILOT_IDS.has(d._id))

await writeFile(join(OUT, 'pilot.ndjson'), docs.map((d) => JSON.stringify(d)).join('\n') + '\n')
console.log(`pilot.ndjson: ${docs.length} docs — ${docs.map((d) => d._id).join(', ')}`)
