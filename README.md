# Digitalist website (Cursor + Vercel)

This repo wraps your **Webflow export** with **Next.js** so we can add `/admin`, Supabase, and a CMS merge step later—without rebuilding the public design in React.

## What’s in the repo

| Path | Purpose |
|------|--------|
| [`public/`](public/) | Static Webflow site: HTML, `css/`, `js/`, `images/` (served as-is; URLs match the export). |
| [`webflow/`](webflow/) | Full mirror of the export (HTML, assets, and [`webflow/CMS/`](webflow/CMS/) CSVs) for scripts and future build-time merging. |
| [`src/app/`](src/app/) | Next.js App Router (minimal for now; homepage is the static Webflow file). |

## Local dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — `/` rewrites to `/index.html` (same content as the Webflow `index.html`).

## Git + GitHub

Remote: [github.com/yourdigitalist/digitalist-website-cursor](https://github.com/yourdigitalist/digitalist-website-cursor)

```bash
git add -A
git status
git commit -m "Initial Next.js + Webflow export scaffold"
git push -u origin main
```

Use **GitHub Desktop** or Cursor’s Source Control panel the same way; ensure GitHub authentication (HTTPS or SSH) is set up on your machine.

## Vercel

1. Import this repo in the [Vercel dashboard](https://vercel.com/new).
2. Framework preset: **Next.js** (default).
3. Deploy — no environment variables required yet.

## CMS merge (Stage 1)

Before `dev` / `build`, the script `scripts/merge-cms.mjs` runs automatically. It reads **`webflow/*.html`** (templates) and **`webflow/CMS/*.csv`**, then writes merged HTML into **`public/`**.

**Currently merged:** `index.html` — home testimonials (swiper) + featured portfolio grid (with category chips).

To run only the merge:

```bash
npm run merge-cms
```

Edit content in **`webflow/CMS/`** (or re-export from Webflow into that folder), then run `merge-cms` again so `public/` updates.

## Next steps (progressive)

1. **Extend merge** — `portfolio.html`, `services.html`, `read.html`, and collection detail templates (`detail_*.html`) using the same pattern.
2. **Supabase** — tables + seed from CSV; merge reads DB instead of CSV (Stage 2).
3. **`/admin`** — simple auth + forms; publish triggers rebuild or revalidation.
