/**
 * Dump the source narrative for each selected work into a readable markdown
 * file under rewrites/_source/<slug>.md — the raw material for the
 * behaviour-led rewrites. Read-only. Run: node studio/migration/extract-source.mjs
 */
import {readFile, writeFile, mkdir} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const OUT = join(DIR, 'rewrites', '_source')

const plain = (rt) =>
  (rt ?? [])
    .map((n) => n.text ?? '')
    .filter(Boolean)
    .join('\n\n')
    .trim()

const work = JSON.parse(await readFile(join(DIR, 'raw', 'work.json'), 'utf8'))
const sel = JSON.parse(await readFile(join(DIR, 'selection.json'), 'utf8'))
const byUid = Object.fromEntries(work.map((d) => [d.uid, d]))

await mkdir(OUT, {recursive: true})

const index = []
for (const uid of sel.work) {
  const doc = byUid[uid]
  const d = doc.data
  const lines = []
  lines.push(`# ${d.title}  (${uid})`)
  lines.push(`\n**Industry:** ${d.industry_category || '—'}`)
  lines.push(
    `**Work types:** ${(d.work_type_categories ?? []).map((c) => c.work_type_category).join(', ') || '—'}`,
  )
  if (d.sub_title) lines.push(`**Sub-title:** ${d.sub_title}`)
  if (d.excerpt) lines.push(`**Excerpt:** ${d.excerpt}`)
  lines.push('\n---\n')

  for (const s of d.body ?? []) {
    const p = s.primary ?? {}
    switch (s.slice_type) {
      case 'work_-_introduction_block':
        if (p.heading) lines.push(`## [HEADING] ${p.heading}`)
        break
      case 'work_-_paragraph_breakout':
        if (plain(p.content)) lines.push(`[PARAGRAPH]\n${plain(p.content)}`)
        break
      case 'work_-_label___content_breakout':
        lines.push(`### [LABEL] ${p.label_title || ''}\n${plain(p.content)}`)
        break
      case 'work_-_quote_breakout':
        if (p.quote) lines.push(`> [QUOTE] ${p.quote}${p.credit_footnote ? `\n> — ${p.credit_footnote}` : ''}`)
        break
    }
  }

  await writeFile(join(OUT, `${uid}.md`), lines.join('\n\n') + '\n')
  const words = lines.join(' ').split(/\s+/).length
  index.push({uid, title: d.title, words})
}

console.log('Extracted source for', index.length, 'projects:')
for (const r of index.sort((a, b) => a.words - b.words))
  console.log(`  ${String(r.words).padStart(4)} words  ${r.uid}  (${r.title})`)
