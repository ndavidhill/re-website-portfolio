# Field & slice mapping — Prismic `reagency` → Sanity

Source models confirmed by inspecting live docs (master ref `aZZcsxYAAC0AMBYu`).
Sanity target schemas in `studio/schemas/`.

---

## `work` → `caseStudy`

Prismic `work` top-level fields: `title`, `sub_title`, `title_size`, `excerpt`,
`industry_category`, `work_type_categories[]`, `thumbnail_image`,
`small_thumbnail_image`, `thumbnail`, `related_work[]`, `forthcoming`, `seo_image`,
`body[]` (slices). `uid` = slug, `tags` typically `["Case Study"]`.

| Sanity `caseStudy` field | Source | Notes |
|---|---|---|
| `title` | `data.title` (rich text → plain) | strip formatting |
| `slug.current` | `uid` | as-is |
| `client` | derive from `title` / `industry_category` | **needs review** — Prismic has no explicit client field; often the title *is* the client. Default `client = title`; fix in Studio. |
| `year` | first 4-digit year in `data` or publish date | fallback: current year; flag for Studio |
| `summary` | `data.excerpt` | required by schema |
| `tagline` | `data.sub_title` | work-index line |
| `disciplines[]` | `work_type_categories[]` + `tags_module.tags` | via discipline map below |
| `heroImage` | first `work_-_full_width_image.image`, else `seo_image`, else `thumbnail_image` | required → must resolve to something |
| `thumbnailImage` | `small_thumbnail_image` ?? `thumbnail_image` ?? `thumbnail` | |
| `gridImages[]` | seed from `thumbnail_image` + first 1–3 body images | placeholder; final curation in Studio |
| `descriptionAccordion[]` | each `work_-_label___content_breakout` → `{title: label_title, body: content→plain}` | |
| `body[]` | body slices → blocks (table below) | |
| `seoTitle` / `seoDescription` | SEO fields if present, else title/excerpt | |
| `featured` / `order` | `false` / unset | set in Studio |
| `externalUrl` | n/a | set in Studio if needed |
| ~~`related_work`~~ | dropped | auto-derived on frontend |

### `work` body slice → block

| Prismic slice | Sanity block | Mapping |
|---|---|---|
| `work_-_full_width_image` | `mediaBlock` | `layout: 'full'`, `images: [image]`, alt from image |
| `half_image_block` | `mediaBlock` | `layout: 'pair'`, `images: items[].image` (expect 2) |
| `work_-_carousel_1` | `galleryBlock` | `images: items[].image`, `columns: 3` |
| `work_-_video_block__embed_` | `videoBlock` | `url: video_embed` (extract src), `audioControl: false` |
| `work_-_paragraph_breakout` | Portable Text | `content` rich text → blocks |
| `work_-_introduction_block` | Portable Text (h2) | `heading` → single h2 block |
| `work_-_label___content_breakout` | → `descriptionAccordion` (not body) | see above |
| `tags_module` | → `disciplines` (not body) | see above |

---

## `article` → `article`

Prismic `article` fields: `title`, `author` (relation), `date` (ISO), `excerpt`,
`category`, `thumbnail`, `featured_thumbnail`, `theme`, `text_theme`, `body[]`.
`uid` = slug.

| Sanity `article` field | Source | Notes |
|---|---|---|
| `title` | `title` | |
| `slug.current` | `uid` | |
| `excerpt` | `excerpt` | |
| `authors[]` | resolve `author` relation → Sanity author ref | dedupe; create author on demand |
| `publishedAt` | `date` | ISO datetime |
| `coverImage` | `featured_thumbnail` ?? `thumbnail` | |
| `tags[]` | `category` (single → array) | or leave for fresh taxonomy (PROJECT.md) |
| `body` | slices → Portable Text | **decision (2)** below |
| `seoTitle` / `seoDescription` | defaults from title/excerpt | |

### `article` body slice → Portable Text

| Prismic slice | Mapping |
|---|---|
| `text_content` | `content` rich text → PT blocks |
| `image_block` | inline image block — **requires extending `portableText`** (decision 2) |
| `image_carousel` | inline images — same caveat; flatten to N inline images |

---

## `author` → `author`

Prismic `author` fields: `name`, `title` only. No uid, bio, photo, or links.

| Sanity `author` field | Source | Notes |
|---|---|---|
| `name` | `name` | |
| `slug.current` | slugify(`name`) | Prismic authors have no uid |
| `role` | `title` | |
| `photo` / `bio` / `links` | — | empty; fill in Studio |

Some `author.name` values are multi-person ("A, B and C") — keep verbatim; the
editor can split later if desired.

---

## Discipline translation map (DRAFT — confirm in Phase 3)

Prismic `work_type_categories` / tag values seen → schema `disciplines` value:

| Prismic value (examples) | → schema value |
|---|---|
| Brand ID, Brand Identity, Identity | `brand-identity` |
| Strategy, Brand Strategy | `strategy` |
| Digital Product, Product, App | `digital-product` |
| Web Design, Website, Web | `website` |
| Campaign, Advertising | `campaign` |
| Packaging | `packaging` |
| Motion, Animation | `motion` |
| Editorial, Content, TOV, Copywriting | `editorial` |
| UX/UI, Experience, Brand Experience | `digital-product` *(or expand list)* |

Unmapped values are dropped + logged for review. If too many fall through, expand
the `disciplines` list in `studio/schemas/caseStudy.ts` instead of force-fitting.

## Rich text → Portable Text rules

Prismic RichText nodes → Sanity blocks, restrained to the schema's allowed set:
- `paragraph` → `normal`; `heading2`→`h2`, `heading3`→`h3` (h1/h4+ demoted to h2/h3)
- `strong`→`strong`, `em`→`em`; hyperlinks → `link` annotation (`href`, external `newTab`)
- `list-item`/`o-list-item` → `bullet` list items
- images/embeds inside rich text → handled per body-slice rules (or dropped in
  article bodies until `portableText` is extended)
- anything else → plain text (formatting dropped)
