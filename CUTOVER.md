# Domain cutover runbook — re.design → new Vercel project

Steps to move the production domain to the new website. Two parties are involved:
**us** (Vercel project owners) and **M&C Saatchi Global IT** (Hernani Morais), who
controls DNS and implements record changes via a Change Request. Companion to
`PROJECT.md` and `MIGRATION.md`.

**Estimated hands-on time:** ~20–30 min in the cutover window, plus a short
verification wait.
**Recommended window:** low-traffic period (e.g. early morning / weekend).

---

## 1. The situation (read first — this is not a normal DNS cutover)

- The **new** site is a Next.js app on **Vercel**, in *our* project `web`
  (org `team_UHbnMenOjX4VAmoSEBNmefJQ`). It is built and deployed; we test it on
  its `*.vercel.app` URL before cutover.
- The **current live** site is **also on Vercel**, under a **different account
  owned by the agency** that built it. DNS already points at Vercel:
  - `re.design` → A `76.76.21.21`
  - `www.re.design` → CNAME `cname.vercel-dns.com`
  - (apex currently 301/308-redirects to `www.re.design`)
- The domain is **registered with Gandi** (confirmed by WHOIS — registrant is
  M&C Saatchi Worldwide Ltd via a `@contact.gandi.net` privacy proxy — and by
  Hernani Morais, M&C Saatchi Global IT).
- **DNS is hosted at DigiCert DNS.** The authoritative nameservers are
  `ns10–15.digicertdns.com/.net`. It is **not** AWS Route 53. (⚠️ Hernani's
  23 Jul 2026 email said "DNS Made Easy," but WHOIS is authoritative and shows
  DigiCert DNS — reconcile this with IT before anyone edits the zone; whoever makes
  the change must be in the **DigiCert DNS** zone, not DNS Made Easy.)
- **We do not have direct DNS access.** DNS record changes are made by M&C Saatchi
  Global IT. Hernani will implement changes once we give him the exact records: he
  raises a **Change Request** in their Global IT ticketing system and seeks
  **emergency approval** so it can go in quickly, rather than waiting for the regular
  Change Advisory Board (CAB), which meets Thursday evenings AEST.

Because DNS already resolves to Vercel, **cutover does not involve changing any
A/CNAME records.** Cutover means **claiming the domain onto our Vercel project**,
which Vercel does once we prove control of the DNS via a `_vercel` TXT record — a
record that IT must add on our behalf.

### ⚠️ The TXT record IS the go-live switch

When we add `re.design` to our Vercel project, Vercel will ask for a TXT record at
`_vercel.re.design` because the domain is in use on the agency's account. **As soon
as Vercel detects that TXT record and confirms ownership, it moves the domain to
our project and our site goes live — and the agency's deployment stops serving it.**

Because IT owns DNS, **that TXT record is added by Hernani via the Change Request**,
not by us. So the go-live moment depends on his CR being approved and him being
available in the window. **Do not hand IT the TXT value until we are in the cutover
window and have QA'd the new build.** Vercel's UI calls this "verification" and says
you can remove the record afterward — true, but for this domain the verification
step *is* the cutover, not a harmless preliminary.

### You do NOT need to configure any redirects

All old→new URL redirects (culled/renamed case studies, retired sections like
`/about`, `/careers`, `/contact`, `/think`) are built into the app
(`web/next.config.ts`) and already deployed. They apply automatically the moment
the domain is on our project. Full map in the Appendix, for spot-checking only.

---

## 2. Prerequisites

- [ ] **Vercel** access to our project `web` (add domains, edit env vars).
- [ ] **M&C Saatchi Global IT on standby** (Hernani Morais) to add the `_vercel`
      TXT record in DigiCert DNS. He raises a Change Request with emergency
      approval, so give him advance notice of the window — the CR must be approved
      and he must be available at cutover for the go-live to land on schedule.
- [ ] The current production **`*.vercel.app` URL** for project `web`
      (Vercel → Project `web` → Domains) — to QA the new site pre-cutover.
- [ ] **Agency coordination.** We do **not** have access to the agency's Vercel
      account. Notify them of the cutover window and that their deployment will
      stop serving `re.design` once we claim it. Confirm whether they need to
      keep a copy running, and agree a contact for the unlikely rollback.
- [ ] Have IT screenshot / export the current **DigiCert DNS** zone (all records)
      for reference. **We will not change A/CNAME/MX/TXT/NS/SOA at cutover** — IT
      only *adds* the temporary `_vercel` TXT record.

---

## 3. Decide the primary hostname (www vs apex)

The live site currently serves **`www.re.design`** as primary (apex redirects to
www), so search engines have indexed the `www` host. To avoid changing the
canonical host at the same time as the platform, **recommend keeping `www.re.design`
as primary**, with the apex redirecting to it (Vercel does this automatically once
both are added and `www` is set as primary).

- If keeping www primary: set `NEXT_PUBLIC_SITE_URL = https://www.re.design`.
- If we deliberately move to the bare apex instead: set
  `NEXT_PUBLIC_SITE_URL = https://re.design` and make the apex primary. (This
  changes every canonical URL, so only do it as a conscious SEO decision.)

---

## 4. Pre-cutover (do these BEFORE touching the TXT record)

1. **Set the canonical URL env var.** Vercel → Project `web` → Settings →
   Environment Variables → add for **Production**:
   `NEXT_PUBLIC_SITE_URL = https://www.re.design` (per §3).

2. **Redeploy production** so the env var is baked in: Vercel → Project `web` →
   Deployments → redeploy latest production (or push a commit to `main`).

3. **QA the new build on its `*.vercel.app` URL** (not the live domain):
   - Home, `/work`, a case study, `/info`, `/play` all load.
   - Images render (from `cdn.sanity.io`); no console errors; mobile looks right.
   - This is the QA that matters, because rollback is limited (see §7).

4. **Confirm the agency is ready** for the window.

---

## 5. Cutover (low-traffic window)

1. **Add the domain in Vercel.** Vercel → Project `web` → Settings → Domains →
   add `www.re.design` **and** `re.design`. Set the primary per §3 (recommend
   `www`). Vercel will report the domain is in use on another account and show a
   **TXT challenge** for `_vercel.re.design`.

2. **Hand the TXT record to IT** — this triggers the go-live action. Give Hernani
   the **exact** values for his Change Request:
   - **Type:** TXT
   - **Name / Host:** `_vercel` (fully `_vercel.re.design`)
   - **Value:** the **exact** string Vercel shows (looks like
     `vc-domain-verify=re.design,<token>`). Copy it verbatim.
   - **TTL:** 300s.

   IT adds it in the DigiCert DNS zone once the emergency CR is approved. Coordinate
   live — the moment it propagates and Vercel verifies, the site is live.

3. **Verify in Vercel.** Vercel polls automatically; you can also click Refresh /
   Verify. Once it detects the TXT record, it attaches the domain to our project
   and provisions the TLS certificate. The domain shows **"Valid Configuration"**.
   **At this point the new site is live on `re.design`.**

4. **A/CNAME records:** no change needed — they already point at Vercel. Only
   touch them if Vercel explicitly flags a record as needing an update.

5. **Have IT remove the `_vercel` TXT record** once Vercel confirms verification
   (optional but tidy — a second small change for Hernani).

---

## 6. Post-cutover verification

- [ ] `https://www.re.design` loads the **new** site over HTTPS (valid cert).
- [ ] `http://…` and the apex `re.design` redirect to `https://www.re.design`
      (or the chosen primary).
- [ ] Redirect spot-checks (should 301/308, no 404):
  - `/about` → `/info`  ·  `/contact` → `/info`  ·  `/think` → `/` (home)
  - `/work/optus` → `/work/optus-refresh`  ·  `/work/a2-milk` → `/work`
- [ ] `/sitemap.xml` and `/robots.txt` load and reference the primary host.
- [ ] Page source: `<link rel="canonical">` and OG image URLs use the primary
      host (confirms `NEXT_PUBLIC_SITE_URL` took effect).
- [ ] Contact form / email links work.

Quick check from a terminal:

```bash
for u in / /about /contact /think /work/optus /work/a2-milk; do
  echo "== $u =="; curl -sI "https://www.re.design$u" | grep -iE '^HTTP|^location'
done
```

---

## 7. Rollback (limited — plan to forward-fix instead)

Because the agency owns the previous Vercel account, we **cannot** simply
re-point DNS to restore the old site — DNS already points at Vercel, and once we
claim the domain the agency's deployment no longer serves it. Options, in order of
preference:

1. **Forward-fix.** If something's wrong, fix and redeploy our Vercel project. This
   is the primary plan — hence the thorough pre-cutover QA in §4.
2. **Full rollback (needs the agency).** To return the domain to the old site, the
   **agency must re-add `re.design` to their Vercel project and re-verify ownership**
   (their own TXT challenge). This is slower and depends on their availability, so
   have their contact on standby during the window.

There is no data loss risk — this is a routing change only.

---

## 8. Decommission (after ~2 weeks of stable operation)

- [ ] Confirm traffic, errors, and Search Console coverage are stable.
- [ ] Coordinate with the agency to shut down the old Vercel project and settle any
      hosting/CMS (Prismic) billing that's no longer needed.
- [ ] Restore a normal TTL on any records we lowered (only the `_vercel` TXT was
      added; if it wasn't removed in §5.5, ask IT to remove it now).

---

## 9. Search Console (cutover day)

- [ ] Confirm the `re.design` property still verifies in Google Search Console
      (DNS TXT verification is unaffected). If the property is `www`, keep it.
- [ ] Submit the sitemap for the primary host, e.g.
      `https://www.re.design/sitemap.xml`.
- [ ] Monitor coverage / 404s over the following weeks.

---

## Appendix — redirect map (reference only; already live in the app)

Source of truth: `web/next.config.ts`. Served by Vercel for our deployment — **no
IT action.** All emit HTTP 308 (treated as 301).

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

**Culled case studies** — these `/work/<slug>` URLs 301 to the `/work` index (44):
a2-milk, actionaid, arise, bango, bare-witness, cognyte, crohns-colitis-uk, dext,
dhre, durasein, east-west-rail, ethos-urban, everydayrewards, fifa, fora, fyta,
g42, heritage, ignition, kenwood, ma-financial-group, majorplayers,
manchester-united, national-breast-cancer-foundation, onegreenway,
oppo-brand-experience, optus-employer-brand, optus-retail, skyscanner,
skyscanner-brand-experience, snap-send-solve, stylus, sydney-design-festival,
sydneyworldpride, telecommunications, test-page, the-global-fund, true-north,
unsw, versus-arthritis, virgin-atlantic, we-know-telcos, woolworths1, youngpoet.

Case studies that kept their slug (~20) resolve at the same `/work/<slug>` path and
need no redirect.
