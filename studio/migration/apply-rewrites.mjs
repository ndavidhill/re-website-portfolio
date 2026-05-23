/**
 * Apply behaviour-led rewrites → caseStudy.descriptionAccordion.
 *
 * Parses each studio/migration/rewrites/<slug>.md (the "Brand that behaves"
 * format) into accordion panels and patches caseStudy-<slug>. Title/body/images
 * are left untouched — only the narrative accordion is replaced.
 *
 *   Dry run (parser check, no Sanity):  node studio/migration/apply-rewrites.mjs --dry
 *   Apply (from /studio, authed):       npx sanity exec migration/apply-rewrites.mjs --with-user-token
 */
import {readdir, readFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'rewrites')
const DRY = process.argv.includes('--dry')
const key = () => Math.random().toString(36).slice(2, 12)

const cleanBody = (s) =>
  s
    .replace(/\*\*/g, '') // strip markdown bold (accordion body is plain text)
    .replace(/^[-*] /gm, '• ') // normalise bullets
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/** Split a section's lines into groups at each `### ` subhead. */
function splitBySubhead(lines) {
  const groups = []
  let g = null
  for (const line of lines) {
    if (line.startsWith('### ')) {
      g = {subhead: line.slice(4).trim(), body: []}
      groups.push(g)
    } else if (g) {
      g.body.push(line)
    }
  }
  return groups.map((x) => ({subhead: x.subhead, body: x.body.join('\n')}))
}

/**
 * Parse the behaviour-led markdown into [{_key, title, body}] panels.
 * Normal sections → one panel (title = #### label, body = subhead + prose).
 * "Signature Behaviours" → one panel PER behaviour (title = ### subhead,
 * body = prose); its first ### is a framing line and is hidden.
 */
function parseRewrite(md) {
  // Segment into #### sections (lines before the first #### — the doc title — are ignored).
  const sections = []
  let cur = null
  for (const raw of md.split('\n')) {
    const line = raw.replace(/\s+$/, '')
    if (line.startsWith('#### ')) {
      const label = line
        .slice(5)
        .replace(/\s*_\(.*?\)_\s*/g, '')
        .replace(/\s*\(optional[^)]*\)\s*/gi, '')
        .trim()
      cur = {label, lines: []}
      sections.push(cur)
    } else if (cur) {
      cur.lines.push(line)
    }
  }

  const panels = []
  for (const sec of sections) {
    const groups = splitBySubhead(sec.lines)
    if (/^signature behaviours/i.test(sec.label)) {
      // Drop the framing line (groups[0]); each remaining subhead is its own panel.
      for (const g of groups.slice(1)) {
        panels.push({_key: key(), title: g.subhead, body: cleanBody(g.body)})
      }
    } else {
      const g = groups[0] ?? {subhead: '', body: ''}
      const body = [g.subhead, g.body].filter(Boolean).join('\n\n')
      panels.push({_key: key(), title: sec.label, body: cleanBody(body)})
    }
  }
  return panels
}

async function main() {
  const files = (await readdir(DIR)).filter((f) => f.endsWith('.md'))
  if (files.length === 0) {
    console.log('No rewrites found in', DIR)
    return
  }

  let client = null
  if (!DRY) {
    const {getCliClient} = await import('sanity/cli')
    client = getCliClient({apiVersion: '2025-05-01'})
  }

  for (const f of files.sort()) {
    const slug = f.replace(/\.md$/, '')
    const id = `caseStudy-${slug}`
    const panels = parseRewrite(await readFile(join(DIR, f), 'utf8'))

    if (DRY) {
      console.log(`\n=== ${id} → ${panels.length} panels ===`)
      for (const p of panels) console.log(`  • ${p.title}  (${p.body.length} chars)`)
      continue
    }

    const exists = await client.fetch('count(*[_id == $id]) > 0', {id})
    if (!exists) {
      console.log('skip (no doc):', id)
      continue
    }
    const res = await client.patch(id).set({descriptionAccordion: panels}).commit()
    console.log(`patched ${id} → ${panels.length} panels (rev ${res._rev})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
