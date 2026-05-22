# re.design — Website Rebuild

Context, migration plan, and content audit for the 2026 website rebuild. Drop this at the root of the new repo so Claude Code can read it across sessions.

---

## Project context

**Current site:** re.design — agency site built on Prismic CMS with a custom frontend.

**Drivers for the rebuild:**
- Design — want a simpler, cleaner look (homepage already designed in Figma)
- Maintenance — Prismic editor experience is clunky

**Decision:** Full re-platform off Prismic. New CMS + new Next.js frontend, built in parallel, cut over when ready.

**Stack:**
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind
- **CMS:** Sanity (free tier covers expected scale; mature editorial tooling; good import API; strong relational support for article/author)
- **Hosting:** Vercel (preview deploys for staging)
- **Build approach:** AI-assisted via Claude Code + Cursor, with Figma MCP for design-to-code on the homepage and per-component work

**Repo structure (monorepo):**
```
/web      → Next.js app
/studio   → Sanity Studio
PROJECT.md
```

**Design source of truth:** Figma file (Re Website 2026). Homepage designed; remaining templates to be designed during build.

---

## Content audit (from Prismic, current state)

Custom types and document counts in the existing Prismic repo:

| Type           | API ID         | Kind       | Count    |
|----------------|----------------|------------|----------|
| About Page     | about_page     | Single     | 1        |
| Article        | article        | Repeatable | 85       |
| Author         | author         | Repeatable | 27       |
| Careers Page   | careers_page   | Single     | 1        |
| Contact Page   | contact_page   | Single     | 1        |
| Footer         | footer         | Single     | 1        |
| Home Page      | home_page      | Single     | 1        |
| Main Menu      | main_menu      | Single     | 1        |
| Pages          | page           | Repeatable | 4        |
| Play Page      | play_page      | Single     | 1        |
| Site Options   | site_options   | Single     | 1        |
| Think Page     | think_page     | Single     | 1        |
| Work           | work           | Repeatable | 161      |
| Work Page      | work_page      | Single     | 1        |

**Relaunch content scope (post-cull):**
- ~10–15 case studies (down from 161)
- ~15 articles (down from 85)
- Authors: only those tied to retained articles
- All singletons retained (home, about, careers, contact, play, think, work index, main menu, footer, site options)

**Implication:** Migration is manual / re-authored, not scripted. No bulk import script needed.

---

## Migration plan

### Phase 1 — Content modelling (1–2 days)
Define Sanity schemas before any frontend work. Schemas drafted: `author`, `article`, `caseStudy`, plus shared block types (`mediaBlock`, `quoteBlock`, `statsBlock`, `galleryBlock`, `videoBlock`) and a restrained `portableText` config.

Still to draft: singletons for home, about, careers, contact, play, think index, work index, main menu, footer, site options.

Principle: fix what's clunky about Prismic here. Use field groups, helpful descriptions, validation limits, restricted choice lists. The schema is the editing experience.

### Phase 2 — Scaffolding (½ day)
```
npm create sanity@latest -- --template clean --create-project "re-design" --dataset production
npx create-next-app@latest web --typescript --tailwind --app
```
Drop schemas into `/studio/schemas`, register in `sanity.config.ts`, set up Sanity client + typed queries in `/web/lib/sanity.ts`. Generate TypeScript types from schemas.

### Phase 3 — Content cull + re-author (2–3 days)
- Pick the 10–15 case studies worth keeping. Re-author each directly into Sanity Studio using the new schema. Don't import; this is the chance to tighten copy and re-curate.
- Same for ~15 articles.
- Authors created on demand as articles are added.
- Singletons populated last (home, about, etc.).

### Phase 4 — Frontend build (1–2 weeks focused, 4–6 weeks evenings)

Build order — case-study-first, not homepage-first:
1. Layout, nav, footer
2. Case study page template (end-to-end, all block types)
3. Work index
4. Article template
5. Think index
6. Homepage (from Figma — highest design density, leave until momentum is up)
7. About, careers, contact, play
8. SEO, OG images, sitemap, robots

Use Figma MCP per-component, not for whole pages. Name Figma frames semantically (`HomeHero`, `CaseStudyCard`) — Claude Code uses those names.

### Phase 5 — Cutover
- Staging on Vercel preview URL throughout build
- Crawl old site (Screaming Frog free, 500 URL limit is fine post-cull)
- Build redirect map in `next.config.js` for changed URLs (old case study slugs → new, or → /work index if culled)
- Swap DNS during low-traffic window
- Keep old Prismic site live for 2 weeks as rollback

---

## Key decisions made

- **Sanity over Payload** — for editorial relations (article ↔ author) and zero infrastructure overhead
- **Sanity over Framer** — cost, plus wanting AI-built code ownership
- **Monorepo over two repos** — solo dev, simpler
- **Hybrid case study schema** — fixed meta fields + flexible block-based body, rather than rigid template or pure Portable Text
- **Restrained Portable Text** — body + h2 + h3 + bullets + bold/italic/link only, to prevent editor chaos
- **Manual re-authoring over scripted migration** — viable only because of aggressive content cull
- **Build case studies before homepage** — homepage is most design-bespoke, save for when patterns are established

---

## Things to resist

- Adding category fields alongside tags (editors won't maintain both)
- Hand-curated "related case studies" fields (auto-derive from disciplines on the frontend)
- Reading time / word count as schema fields (calculate on frontend)
- Hard-coding the homepage design to specific content (keep data generic, let design accommodate variable content)
- Importing all 161 case studies "just in case" (the cull is the point)
- Starting the build on the homepage

---

## Open questions for the build

- Final design direction for case study, article, and index templates (homepage designed; rest TBD)
- Whether to keep the Play page concept, and if so what it actually is
- Tag taxonomy for articles — derive from existing 85 articles' content, or start fresh
- Image strategy — Sanity's CDN handles transforms, but worth confirming sizes / formats in Next.js Image config
