/**
 * One-time migration: fold the three framing rows (Conviction / Collaborators /
 * Connected experiences & codes) into the single `pillars` array so the whole
 * indexed list is editable, add/removable and reorderable in Studio.
 *
 * Idempotent: skips any framing row whose title already exists in the array.
 * The framing rows carry no image — they fall back to the default image, exactly
 * as they rendered before (they previously came from hardcoded front-end copy).
 *
 * Run:  npx sanity exec scripts/migratePillars.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2023-01-01'})

// Preserves the exact copy the live site rendered (title before "—", body after).
const LEAD = {
  _type: 'pillar',
  title: 'Conviction',
  body: 'a clear belief and cultural ambition that guides every choice and the outcomes we design for.',
}
const TRAILING = [
  {
    _type: 'pillar',
    title: 'Collaborators',
    body: 'the creators and partners that amplify the brand in culture.',
  },
  {
    _type: 'pillar',
    title: 'Connected experiences & codes',
    body: 'the distinctive brand signals that make it recognisable everywhere.',
  },
]

const key = (seed: string) =>
  `fw_${seed.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`

function rebuild(existing: Array<{title?: string}> = []) {
  const titles = new Set(existing.map((p) => (p.title ?? '').trim().toLowerCase()))
  const has = (t: string) => titles.has(t.trim().toLowerCase())
  const lead = has(LEAD.title) ? [] : [{...LEAD, _key: key(LEAD.title)}]
  const trailing = TRAILING.filter((r) => !has(r.title)).map((r) => ({
    ...r,
    _key: key(r.title),
  }))
  return {next: [...lead, ...existing, ...trailing], changed: lead.length + trailing.length}
}

async function run() {
  // Fetch every version (published + any draft) so Studio can't silently revert.
  const docs: Array<{_id: string; pillars?: Array<{title?: string}>}> = await client.fetch(
    `*[_type == "infoPage"]{_id, "pillars": pillars[]{_key, title, body, image}}`,
  )
  if (!docs.length) throw new Error('No infoPage document found.')

  let touched = 0
  for (const doc of docs) {
    const {next, changed} = rebuild(doc.pillars ?? [])
    const kind = doc._id.startsWith('drafts.') ? 'draft   ' : 'published'
    if (!changed) {
      console.log(`${kind} ${doc._id}: already migrated, skipping.`)
      continue
    }
    console.log(
      `${kind} ${doc._id}: ${(doc.pillars ?? []).length} → ${next.length}\n` +
        next.map((p, i) => `    ${String(i + 1).padStart(2, '0')}  ${p.title}`).join('\n'),
    )
    await client.patch(doc._id).set({pillars: next}).commit()
    touched++
  }
  console.log(touched ? `Done. Patched ${touched} document(s).` : 'Nothing to do.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
