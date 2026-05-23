/**
 * Phase 1 — Pull all Prismic content (read-only) into local JSON snapshots.
 *
 * No auth needed: the `reagency` Prismic API is public. No Sanity involved.
 * Run:  node studio/migration/pull.mjs
 * Output: studio/migration/raw/{work,article,author}.json (+ _meta.json)
 */
import {writeFile, mkdir} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const REPO = 'reagency'
const API = `https://${REPO}.cdn.prismic.io/api/v2`
const TYPES = ['work', 'article', 'author']

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'raw')

async function getMasterRef() {
  const res = await fetch(API)
  if (!res.ok) throw new Error(`Failed to load API root: ${res.status}`)
  const data = await res.json()
  const master = data.refs.find((r) => r.isMasterRef) ?? data.refs[0]
  if (!master) throw new Error('No refs found on Prismic API')
  return master.ref
}

async function fetchType(type, ref) {
  const results = []
  let page = 1
  let totalPages = 1
  do {
    const q = encodeURIComponent(`[[at(document.type,"${type}")]]`)
    const url = `${API}/documents/search?ref=${ref}&q=${q}&pageSize=100&page=${page}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${type} page ${page}: HTTP ${res.status}`)
    const data = await res.json()
    results.push(...data.results)
    totalPages = data.total_pages
    process.stdout.write(`\r  ${type}: page ${page}/${totalPages} (${results.length} docs)`)
    page += 1
  } while (page <= totalPages)
  process.stdout.write('\n')
  return results
}

async function main() {
  await mkdir(OUT_DIR, {recursive: true})
  const ref = await getMasterRef()
  console.log(`Master ref: ${ref}`)

  const counts = {}
  for (const type of TYPES) {
    const docs = await fetchType(type, ref)
    counts[type] = docs.length
    await writeFile(join(OUT_DIR, `${type}.json`), JSON.stringify(docs, null, 2))
  }

  const meta = {repo: REPO, ref, pulledAt: new Date().toISOString(), counts}
  await writeFile(join(OUT_DIR, '_meta.json'), JSON.stringify(meta, null, 2))
  console.log('Done:', JSON.stringify(counts))
}

main().catch((err) => {
  console.error('\nPull failed:', err.message)
  process.exit(1)
})
