# Content migration — Prismic → Sanity

Selective migration of the current re.design site (Prismic repo `reagency`) into
the new Sanity project (`ju4przbj`, dataset `production`). Companion to
`PROJECT.md`. Scripts live in `studio/migration/`.

## Source (confirmed, public API)

- API base: `https://reagency.cdn.prismic.io/api/v2` — **public, no token**
- Live counts (current master ref): **68 `work`, 53 `article`, 26 `author`**
  (lower than PROJECT.md's 161/85/27 — that audit was pre-cull / included archived)
- `work.uid` / `article.uid` = slug. `author` has **no uid** (slug generated from name).
- Images served from `images.prismic.io/reagency/…`.

## Approach (decisions locked)

- **Pull all** → build a triage index → you mark keep/skip.
- **Full transform**: map Prismic slices → Sanity body blocks + new schema fields,
  not just metadata.
- **Pilot** 2–3 picks end-to-end before the bulk run.
- **Division of labour**: Claude writes every script + spec and runs the read-only
  pull. **You run** anything that writes to Sanity (`npx sanity exec` /
  `sanity dataset import`) — your shell holds the Sanity login, the agent's doesn't.

## Phases

- [x] **0 — Recon & spec** *(Claude)* — work/article/author models inspected,
      `studio/migration/MAPPING.md` written, `pull.mjs` written. ✓
- [x] **1 — Pull** *(Claude, read-only)* — `pull.mjs` pulled **68 work, 53 article,
      26 author** → `studio/migration/raw/*.json` + `_meta.json`. ✓
- [x] **2 — Triage + selection** *(done)* — `build-index.mjs` → triage gallery;
      selection captured in `selection.json`: **24 work + 5 articles** (all slugs
      validated against the snapshot).
- [x] **3 — Transform** *(done)* — `transform.mjs` → `out/docs.ndjson`:
      **5 authors, 24 case studies, 5 articles**, zero warnings. RichText→
      PortableText, slice→block mapping, disciplines, accordion, native videos.
- [x] **4 — Image pipeline folded into import** — assets use the `_sanityAsset`
      (`image@<url>` / `file@<url>`) syntax, so `sanity dataset import` fetches +
      uploads them automatically. No separate upload script needed.
- [ ] **5 — Pilot** *(you run, both verify)* — `out/pilot.ndjson` ready
      (tourism-australia, domain-refresh, commbank + thejollofkitchen + author,
      69 assets). Import, verify on site, iterate.
- [ ] **6 — Bulk** *(you run)* — run validated pipeline on the full kept set;
      authors created on-demand + de-duped; `sanity dataset import`.
- [ ] **7 — QA & curate** *(you)* — finalise `disciplines`, `tagline`, `gridImages`,
      `featured`/`order`; spot-check bodies; publish.

## Open decisions (resolve during Phase 0/3)

1. **Disciplines** — Prismic tags are free-form; won't map 1:1 to the 8-value
   schema list. → translation table in `MAPPING.md` (or expand the schema list).
2. **Article inline images** — `article.body` Portable Text has no image support;
   Prismic articles have image slices. → extend `portableText` with inline images,
   or accept lossy article bodies.
3. **Rich text fidelity** — anything outside the restrained set (h2/h3, bold,
   italic, link, bullets) is dropped on convert.
4. **`related_work`** — dropped; related work is auto-derived on the frontend
   (per PROJECT.md "things to resist").

## Tooling notes

- Scripts mirror the existing `studio/seed/` pattern: ESM `.mjs`, `getCliClient`
  for writes, run via `npx sanity exec studio/migration/<script>.mjs --with-user-token`.
- Raw Prismic snapshot committed under `studio/migration/raw/` for reproducibility.
- Imports use NDJSON (`sanity dataset import`) where possible; reference wiring via
  `getCliClient` patches (as in `seed/wireHomeClients.mjs`).
