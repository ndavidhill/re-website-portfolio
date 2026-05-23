/**
 * Phase 2 — Build a triage index from the raw Prismic snapshot.
 *
 * Reads studio/migration/raw/{work,article}.json and emits:
 *   - triage.csv   → your selection checklist (mark the `keep` column with `y`)
 *   - triage.html  → a visual gallery with thumbnails to help you decide
 *
 * Read-only. Run: node studio/migration/build-index.mjs
 */
import {readFile, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const RAW = join(DIR, 'raw')
const SITE = 'https://re.design'

/** Prismic title fields can be a plain string or a RichText array. */
function plainText(v) {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map((b) => b.text ?? '').join(' ').trim()
  return ''
}

function yearOf(...dates) {
  for (const d of dates) {
    if (!d) continue
    const m = String(d).match(/\d{4}/)
    if (m) return m[0]
  }
  return ''
}

function thumb(...candidates) {
  for (const c of candidates) if (c?.url) return c.url
  return ''
}

function workRow(doc) {
  const d = doc.data ?? {}
  return {
    type: 'work',
    title: plainText(d.title) || doc.uid,
    detail: d.industry_category || '', // industry hint (no explicit client field)
    year: yearOf(doc.first_publication_date),
    disciplines: (d.work_type_categories ?? [])
      .map((c) => c.work_type_category)
      .filter(Boolean)
      .join('; '),
    slug: doc.uid ?? '',
    url: `${SITE}/work/${doc.uid}`,
    thumb: thumb(d.small_thumbnail_image, d.thumbnail_image, d.thumbnail),
  }
}

function articleRow(doc) {
  const d = doc.data ?? {}
  return {
    type: 'article',
    title: plainText(d.title) || doc.uid,
    detail: d.author?.slug ? `by ${d.author.slug}` : '',
    year: yearOf(d.date, doc.first_publication_date),
    disciplines: d.category || '',
    slug: doc.uid ?? '',
    url: `${SITE}/think/${doc.uid}`,
    thumb: thumb(d.featured_thumbnail, d.thumbnail),
  }
}

function csvCell(s) {
  const v = String(s ?? '')
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

function toCsv(rows) {
  const cols = ['keep', 'type', 'title', 'detail', 'year', 'disciplines', 'slug', 'url', 'thumb']
  const head = cols.join(',')
  const body = rows
    .map((r) => [''.padEnd(0), r.type, r.title, r.detail, r.year, r.disciplines, r.slug, r.url, r.thumb].map(csvCell).join(','))
    .join('\n')
  return `${head}\n${body}\n`
}

function toHtml(rows) {
  const card = (r, i) => `
    <article class="card" data-type="${r.type}">
      <label><input type="checkbox" data-slug="${r.slug}" data-type="${r.type}" /> keep</label>
      ${r.thumb ? `<img loading="lazy" src="${r.thumb}&w=600" alt="" />` : '<div class="noimg">no image</div>'}
      <div class="meta">
        <strong>${escapeHtml(r.title)}</strong>
        <span>${escapeHtml([r.detail, r.year].filter(Boolean).join(' · '))}</span>
        <span class="disc">${escapeHtml(r.disciplines)}</span>
        <a href="${r.url}" target="_blank" rel="noreferrer">${r.slug} ↗</a>
      </div>
    </article>`
  const works = rows.filter((r) => r.type === 'work')
  const arts = rows.filter((r) => r.type === 'article')
  return `<!doctype html><html><head><meta charset="utf-8" />
<title>Migration triage</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;background:#111;color:#eee}
  header{position:sticky;top:0;background:#000;padding:16px 24px;border-bottom:1px solid #333;z-index:10}
  button{font:inherit;padding:8px 14px;border-radius:8px;border:1px solid #555;background:#1d1d1d;color:#eee;cursor:pointer}
  h2{padding:0 24px;margin:32px 0 8px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;padding:0 24px}
  .card{background:#1d1d1d;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a}
  .card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
  .noimg{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:#666;background:#161616}
  .card label{display:block;padding:8px 12px;font-size:13px;color:#9f9f9f}
  .meta{padding:0 12px 14px;display:flex;flex-direction:column;gap:3px;font-size:13px}
  .meta strong{font-size:15px}
  .meta span{color:#9f9f9f}
  .meta .disc{color:#6f6f6f;font-size:12px}
  .meta a{color:#7ab7ff;text-decoration:none;font-size:12px;margin-top:4px}
  textarea{width:100%;height:120px;background:#000;color:#7dff9b;border:1px solid #333;border-radius:8px;padding:8px;font-family:monospace}
</style></head><body>
<header>
  <button onclick="exportSel()">Copy selected slugs</button>
  <span id="count" style="margin-left:12px;color:#9f9f9f"></span>
  <textarea id="out" placeholder="Selected slugs appear here — paste back to Claude" style="margin-top:10px"></textarea>
</header>
<h2>Work (${works.length})</h2><div class="grid">${works.map(card).join('')}</div>
<h2>Articles (${arts.length})</h2><div class="grid">${arts.map(card).join('')}</div>
<script>
  const boxes=()=>[...document.querySelectorAll('input[type=checkbox]')]
  function refresh(){document.getElementById('count').textContent=boxes().filter(b=>b.checked).length+' selected'}
  function exportSel(){
    const sel={work:[],article:[]}
    boxes().filter(b=>b.checked).forEach(b=>sel[b.dataset.type].push(b.dataset.slug))
    document.getElementById('out').value=JSON.stringify(sel,null,2)
  }
  document.addEventListener('change',refresh);refresh()
</script>
</body></html>`
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]))
}

async function main() {
  const work = JSON.parse(await readFile(join(RAW, 'work.json'), 'utf8'))
  const article = JSON.parse(await readFile(join(RAW, 'article.json'), 'utf8'))

  const rows = [
    ...work.map(workRow).sort((a, b) => a.title.localeCompare(b.title)),
    ...article.map(articleRow).sort((a, b) => b.year.localeCompare(a.year)),
  ]

  await writeFile(join(DIR, 'triage.csv'), toCsv(rows))
  await writeFile(join(DIR, 'triage.html'), toHtml(rows))
  console.log(`Wrote triage.csv + triage.html — ${work.length} work, ${article.length} articles`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
