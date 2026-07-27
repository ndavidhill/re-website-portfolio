/**
 * Set gallery images to their natural (intrinsic) shape by switching the cell
 * aspect ratio to "auto" and clearing any manual override. The front end then
 * derives each cell's shape from the asset's own dimensions
 * (CaseStudyBody -> naturalRatio), so no ratio is ever typed by hand.
 *
 * Safe by default: prints a dry-run and writes nothing unless --commit is given,
 * and only touches one case study unless --all is given.
 *
 * Run (dry-run, one study):
 *   npx sanity exec scripts/galleryNaturalShape.ts --with-user-token -- mistranslations
 * Apply it:
 *   npx sanity exec scripts/galleryNaturalShape.ts --with-user-token -- mistranslations --commit
 * Every case study:
 *   npx sanity exec scripts/galleryNaturalShape.ts --with-user-token -- --all --commit
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2023-01-01'})

const argv = process.argv.slice(2)
const commit = argv.includes('--commit')
const all = argv.includes('--all')
const slug = argv.find((a) => !a.startsWith('--'))

if (!slug && !all) {
  console.error('Pass a case-study slug (e.g. "mistranslations") or --all.')
  process.exit(1)
}

type Img = {
  _key: string
  aspectRatio?: string
  customAspectRatio?: string
  natural?: number
}
type Gallery = {_key: string; images?: Img[]}
type Doc = {_id: string; slug?: string; galleries?: Gallery[]}

async function run() {
  const filter = all ? '' : ' && slug.current == $slug'
  const docs: Doc[] = await client.fetch(
    `*[_type == "caseStudy"${filter}]{
      _id,
      "slug": slug.current,
      "galleries": body[_type == "galleryBlock"]{
        _key,
        "images": images[]{
          _key,
          aspectRatio,
          customAspectRatio,
          "natural": asset->metadata.dimensions.aspectRatio
        }
      }
    }`,
    all ? {} : {slug},
  )

  if (!docs.length) {
    console.log(all ? 'No case studies found.' : `No case study with slug "${slug}".`)
    return
  }

  let patched = 0
  for (const doc of docs) {
    const kind = doc._id.startsWith('drafts.') ? 'draft    ' : 'published'
    const galleries = doc.galleries ?? []
    // An image needs changing if it carries a manual ratio that isn't already "auto".
    const targets: Array<{block: string; img: string; from: string; natural?: number}> = []
    for (const g of galleries) {
      for (const img of g.images ?? []) {
        const manual = img.customAspectRatio || img.aspectRatio
        if (manual && manual !== 'auto') {
          targets.push({block: g._key, img: img._key, from: manual, natural: img.natural})
        }
      }
    }

    if (!targets.length) {
      console.log(`${kind} ${doc.slug ?? doc._id}: already natural, skipping.`)
      continue
    }

    console.log(
      `${kind} ${doc.slug ?? doc._id}: ${targets.length} image(s) → natural\n` +
        targets
          .map(
            (t) =>
              `    ${t.from.padEnd(6)} → auto` +
              (t.natural ? ` (${t.natural.toFixed(3)})` : ' (no dimensions!)'),
          )
          .join('\n'),
    )

    if (!commit) continue

    let patch = client.patch(doc._id)
    for (const t of targets) {
      const at = `body[_key=="${t.block}"].images[_key=="${t.img}"]`
      patch = patch.set({[`${at}.aspectRatio`]: 'auto'}).unset([`${at}.customAspectRatio`])
    }
    await patch.commit()
    patched++
  }

  if (!commit) {
    console.log('\nDry run — nothing written. Re-run with --commit to apply.')
  } else {
    console.log(patched ? `\nDone. Patched ${patched} document(s).` : '\nNothing to do.')
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
