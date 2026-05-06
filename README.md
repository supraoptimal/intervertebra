# Inter Vertebra — Spine ERAS Compliance Tracker

A single-page web app for auditing per-patient compliance with the ERAS
(Enhanced Recovery After Surgery) protocol for lumbar fusion surgery. Built
for a small team of orthopaedic surgeons in a Hong Kong public hospital, as
a proof-of-concept research/audit tool.

- Local-only — data lives in the browser via IndexedDB. No backend, no auth.
- Mobile-first — usable at the bedside on a phone, also fine on a desktop.
- Installable PWA, offline-capable.
- Deployed at <https://geneleung.org/eras/> (Vercel, base path `/eras/`).

> **Not a clinical decision support system.** This is an audit/research tool.
> Do not enter any patient-identifiable information. Use a de-identified
> internal reference number only.

## Stack

- Vite + React (JavaScript)
- Tailwind CSS
- React Router v6
- `idb` for IndexedDB
- Recharts for the dashboard
- `vite-plugin-pwa` for PWA / offline

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:5173/eras/> in a browser.

To build:

```bash
npm run build
npm run preview
```

## Deploying to Vercel

The app is configured with `base: '/eras/'` in `vite.config.js`, so the
production bundle expects to be served from `…/eras/`.

For deployment under `geneleung.org/eras/`, either:

1. **Standalone Vercel project** — set `Output Directory` to `dist`. Configure
   a rewrite so all sub-paths fall back to `index.html` (Vercel does this for
   `vite` projects automatically). Then mount at `/eras/` via your
   primary site's rewrites.

2. **As a sub-app of the portfolio** — `vercel.json` in the umbrella project
   should rewrite `/eras/(.*)` to the deployed Vite output.

Either way, the `basename` in `BrowserRouter` (`/eras`) and Vite's `base`
must match.

## Data model

Records live in IndexedDB (database `inter-vertebra`, version 1) across four
object stores:

- **`patients`** — keyed by UUID. Each record holds metadata (case number,
  surgeon initials, procedure type, surgery date, age band, sex, notes,
  timestamps) plus a `complianceItems` map keyed by item id, each entry
  having `{ status: 'yes' | 'no' | 'na' | 'pending', timestamp, comment }`.
- **`items`** — ERAS item definitions. Keyed by stable slug id (e.g.
  `preop-education`). Includes `phase`, `shortLabel`, `description`,
  `evidenceLevel`, `order`, and `disabled` flag. Disabled items are excluded
  from compliance calculations but historical entries on them are preserved.
- **`procedures`** — list of allowed `procedureType` values.
- **`meta`** — singleton key/value pairs (e.g. seeded timestamp).

Compliance rate is `yes / (yes + no)` per patient or per item. N/A and
Pending are excluded from the denominator.

## Adding new ERAS items or procedure types

In-app: open **Settings → ERAS items → + Add item** (or **Procedure types**).
New items get an auto-generated stable id like `custom-foo-1abc234`. Items
can be edited, reordered, disabled, or deleted.

To change the *defaults* used for fresh installs, edit
[`src/data/erasItems.js`](src/data/erasItems.js). The seed list is only used
when IndexedDB is empty (first run, or after **Reset all data**); existing
installs are not retroactively updated.

## Privacy

- The case-number field validates against common Hong Kong ID number patterns
  and shows a warning if a real-looking identifier is entered.
- A persistent banner on the patient detail page reminds users not to enter
  identifiable information.
- The About page documents the local-only storage model and recommends
  regular JSON backups.

## Source attribution

The default 22-item bundle is drawn from:

> Debono B, Wainwright TW, Wang MY, et al. *Consensus statement for
> perioperative care in lumbar spinal fusion: Enhanced Recovery After Surgery
> (ERAS) Society recommendations.* The Spine Journal. 2021;21(5):729–752.

## Licence

Internal use, no licence stated. Contact the author for reuse.
