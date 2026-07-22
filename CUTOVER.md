# Domain cutover runbook — re.design → new Vercel build

Instructions for the IT/infrastructure team to point the production domain at the
new website and retire the old one. Companion to `PROJECT.md` and `MIGRATION.md`.

**Estimated hands-on time:** ~30–45 min at cutover, plus DNS propagation wait.
**Recommended window:** low-traffic period (e.g. early morning / weekend).

---

## 1. What's changing

- The new site is a Next.js app hosted on **Vercel** (project `web`).
- The old site (Prismic CMS + custom frontend) stays **live and untouched** until
  we confirm the new one is healthy, then is decommissioned after ~2 weeks.
- We are only changing **DNS** — where `re.design` points. No content moves at
  cutover; that already happened in Sanity.

### You do NOT need to configure any redirects

All old→new URL redirects (culled case studies, renamed projects, retired
sections like `/about`, `/careers`, `/contact`, `/think`) are **built into the
application** (`web/next.config.ts`) and are already deployed on Vercel. They
travel with the deployment and apply automatically the moment the domain points
at Vercel. Do not recreate them at the registrar, CDN, or in any proxy. The full
map is in the Appendix for reference/spot-checking only.

---

## 2. Prerequisites — access & info to gather first

- [ ] **Vercel** access to the team that owns project `web`
      (org `team_UHbnMenOjX4VAmoSEBNmefJQ`), with permission to add domains and
      edit environment variables.
- [ ] **DNS management** access for `re.design` in **AWS Route 53** (the hosted
      zone for the domain), with permission to edit records.
- [ ] The current **production `*.vercel.app` URL** for project `web`
      (Vercel → Project `web` → Domains). Use this to test the live build
      *before* touching DNS.
- [ ] Confirm which hostnames are in public use: **apex `re.design`**, **`www`**,
      or both. Decide the primary (recommend apex `re.design`, with `www`
      redirecting to it — Vercel does this automatically once both are added).
- [ ] In the Route 53 hosted zone, record the **current records** for `re.design`
      and `www` (A / AAAA / CNAME / Alias) as-is, so we have an exact rollback
      target. Screenshot the zone. **Leave MX, TXT (SPF/DKIM/domain-verification),
      NS and SOA records untouched** — those are email and delegation, unrelated
      to the website cutover.

---

## 3. Pre-cutover (T-48h to T-24h)

1. **Lower the DNS TTL.** In Route 53, edit the current website records for
   `re.design` (and `www` if used) and set TTL to **300s (5 min)**. This shortens
   propagation and speeds rollback if needed. Do this at least a full old-TTL
   period ahead (if the old TTL was 24h, lower it 24h+ before cutover). Note: if
   the apex is currently an **Alias** record (Alias has no editable TTL — it
   follows the target), the low-TTL step only applies to plain A/CNAME records.

2. **Set the canonical URL in Vercel** so SEO metadata uses the real domain:
   - Vercel → Project `web` → **Settings → Environment Variables**
   - Add for the **Production** environment:
     `NEXT_PUBLIC_SITE_URL = https://re.design`
   - This must be a Production redeploy to take effect (step 4 below), so add it
     now and it will apply on the next deploy.

3. **Smoke-test the new build on its `*.vercel.app` URL** (not the live domain):
   - Home, `/work`, a case study, `/info`, `/play` all load.
   - Images render (served from `cdn.sanity.io`).
   - No console errors; site is responsive on mobile.

---

## 4. Cutover (low-traffic window)

Do these in order.

1. **Add the domain in Vercel.** Vercel → Project `web` → **Settings → Domains** →
   add `re.design` (and `www.re.design` if in use). Vercel will display the exact
   DNS records it wants — **use the values Vercel shows**, as they are
   authoritative. For Route 53 they will be:

   | Route 53 record   | Type    | Value (confirm in Vercel dashboard) |
   |-------------------|---------|--------------------------------------|
   | `re.design` (apex)| `A`     | `76.76.21.21`                        |
   | `www.re.design`   | `CNAME` | `cname.vercel-dns.com`               |

   > **Route 53 specifics:** the apex (`re.design`) must be a plain **A record** to
   > `76.76.21.21`. Do **not** use a Route 53 *Alias* here — Alias only targets AWS
   > resources (CloudFront/ELB/S3), and Vercel is external, so it won't work. Leave
   > "Alias" toggled **off** and enter the IP directly. `www` is a standard CNAME.

2. **Update the records in Route 53** to the values from step 1 (edit the existing
   website A/CNAME records in the hosted zone, or create them if absent). **Remove
   or overwrite the old website records** that pointed at the previous host so
   nothing conflicts. Do not touch MX / TXT / NS / SOA.

3. **Trigger a Production redeploy** so `NEXT_PUBLIC_SITE_URL` (from §3.2) is baked
   in: Vercel → Project `web` → Deployments → redeploy latest production, **or**
   push any commit to `main`. (If the env var was already set before the most
   recent production deploy, this is a no-op — but redeploy to be safe.)

4. **Wait for DNS propagation + SSL.** Vercel auto-provisions the TLS certificate
   once DNS resolves to it. This usually completes within minutes but can take up
   to ~1h. The domain in Vercel → Domains will show **"Valid Configuration"** and
   a green padlock when ready.

---

## 5. Post-cutover verification

Run these once Vercel shows the domain valid:

- [ ] `https://re.design` loads the **new** site over HTTPS (valid certificate).
- [ ] `http://re.design` and `www.re.design` both **redirect** to
      `https://re.design` (or your chosen primary).
- [ ] Spot-check redirects (should 301/308 to the listed target, no 404):
  - `https://re.design/about` → `/info`
  - `https://re.design/contact` → `/info`
  - `https://re.design/think` → `/` (home)
  - `https://re.design/work/optus` → `/work/optus-refresh`
  - `https://re.design/work/a2-milk` → `/work` (culled → index)
- [ ] `https://re.design/sitemap.xml` and `/robots.txt` load and reference
      **`re.design`** URLs (confirms `NEXT_PUBLIC_SITE_URL` took effect).
- [ ] View-source on a couple of pages: the `<link rel="canonical">` and OG image
      URLs use `https://re.design`, not a `*.vercel.app` host.
- [ ] Any contact form / email links work.

Quick redirect check from a terminal:

```bash
for u in /about /contact /think /work/optus /work/a2-milk; do
  echo "== $u =="; curl -sI "https://re.design$u" | grep -iE '^HTTP|^location'
done
```

---

## 6. SEO / Search Console (same day)

- [ ] In **Google Search Console**, verify the `re.design` property still resolves
      (domain-level verification via DNS TXT is unaffected by the A/CNAME change).
- [ ] Submit the new sitemap: `https://re.design/sitemap.xml`.
- [ ] Keep the old property/records in GSC for monitoring 404s and redirect
      coverage over the following weeks.

---

## 7. Rollback plan

If the new site is broken and can't be fixed quickly:

1. At the DNS host, **restore the original records** captured in §2 (revert apex
   A/ALIAS and `www` to the old host's values).
2. Because TTL was lowered to 300s, the old site returns within minutes.
3. The old Prismic site was never touched, so it serves immediately.

No data is lost by rolling back — cutover is DNS-only.

---

## 8. Decommission (after ~2 weeks of healthy operation)

- [ ] Confirm traffic, error rates, and Search Console coverage are stable.
- [ ] Restore normal TTL (e.g. 3600s+) on the DNS records.
- [ ] Decommission the **old Prismic site** and its hosting.
- [ ] Cancel/downgrade the old hosting and (if no longer needed) the Prismic plan.

---

## Appendix — redirect map (reference only; already live in the app)

Source of truth: `web/next.config.ts`. These are served by Vercel for the new
deployment — **no action required from IT.** All emit HTTP 308 (treated as 301).

**Section / IA changes**

| Old URL              | New target |
|----------------------|------------|
| `/about`             | `/info`    |
| `/careers`           | `/info`    |
| `/contact`           | `/info`    |
| `/think`             | `/` (home) |
| `/think/<anything>`  | `/` (home) |

**Renamed case studies** (301 to preserve ranking)

| Old URL                              | New target                        |
|--------------------------------------|-----------------------------------|
| `/work/optus`                        | `/work/optus-refresh`             |
| `/work/swisscom`                     | `/work/swisscom-brand-experience` |
| `/work/franklin-templeton`           | `/work/franklitempleton`          |
| `/work/all-blacks-and-black-ferns`   | `/work/nzr`                       |

**Culled case studies** — the following `/work/<slug>` URLs 301 to the `/work`
index (44 total): a2-milk, actionaid, arise, bango, bare-witness, cognyte,
crohns-colitis-uk, dext, dhre, durasein, east-west-rail, ethos-urban,
everydayrewards, fifa, fora, fyta, g42, heritage, ignition, kenwood,
ma-financial-group, majorplayers, manchester-united,
national-breast-cancer-foundation, onegreenway, oppo-brand-experience,
optus-employer-brand, optus-retail, skyscanner, skyscanner-brand-experience,
snap-send-solve, stylus, sydney-design-festival, sydneyworldpride,
telecommunications, test-page, the-global-fund, true-north, unsw,
versus-arthritis, virgin-atlantic, we-know-telcos, woolworths1, youngpoet.

Case studies that kept their slug (~20) resolve at the same `/work/<slug>` path
on the new site and need no redirect.
