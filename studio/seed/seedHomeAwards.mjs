/**
 * Seed homePage.awards from /data/awards.csv.
 *
 * Reads the curated marquee CSV at the repo root, builds an awards array of
 * {description, client, award, year}, and patches the homePage singleton.
 *
 * Run from /studio/ with:
 *   npx sanity exec seed/seedHomeAwards.mjs --with-user-token
 *
 * Anything currently in homePage.awards is replaced (the marquee CSV is the
 * source of truth). The studio's existing placeholder rows go away.
 */
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname, resolve} from 'node:path'
import {getCliClient} from 'sanity/cli'

const here = dirname(fileURLToPath(import.meta.url))
const CSV_PATH = resolve(here, '../../data/awards.csv')

// Tiny CSV parser — handles quoted fields with embedded commas. Awards rows
// don't contain newlines inside fields, so a per-line parse is fine.
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') q = false
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out
}

const raw = readFileSync(CSV_PATH, 'utf8')
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0)
const header = parseCsvLine(lines[0])
const cols = Object.fromEntries(header.map((h, i) => [h.trim(), i]))
for (const required of ['description', 'client', 'award', 'year']) {
  if (cols[required] === undefined) {
    throw new Error(`CSV is missing required column: ${required}`)
  }
}

// Stable _key from (year, description, award) so re-running the seed produces
// the same keys — keeps Sanity history diffs small if the CSV is mostly stable.
function slugKey(...parts) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

const awards = lines.slice(1).map((line) => {
  const cells = parseCsvLine(line)
  const description = cells[cols.description].trim()
  const client = cells[cols.client].trim()
  const award = cells[cols.award].trim()
  const year = Number(cells[cols.year])
  return {
    _key: slugKey(String(year), description, award),
    _type: 'award',
    description,
    // Leave blank if the CSV cell is empty or a "?" placeholder — Sanity
    // string fields are happier with undefined than empty strings.
    ...(client && client !== '?' ? {client} : {}),
    ...(award ? {award} : {}),
    ...(Number.isFinite(year) ? {year} : {}),
  }
})

console.log(`Parsed ${awards.length} awards from ${CSV_PATH}`)
const needClient = awards.filter((a) => !a.client).length
if (needClient > 0) {
  console.log(`  (${needClient} rows have no client — left blank for the editor to fill)`)
}

const client = getCliClient({apiVersion: '2025-05-01'})
const res = await client.patch('homePage').set({awards}).commit()
console.log(`Replaced homePage.awards with ${awards.length} entries (rev ${res._rev}).`)
