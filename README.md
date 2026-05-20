# Digitalist website (Cursor + Vercel)

This repo wraps your **Webflow export** with **Next.js** so we can add `/admin`, Supabase, and a CMS merge step—without rebuilding the public design in React.

## What’s in the repo

| Path | Purpose |
|------|--------|
| [`public/`](public/) | Static Webflow site: HTML, `css/`, `js/`, `images/` (served as-is; URLs match the export). |
| [`webflow/`](webflow/) | Full mirror of the export (HTML, assets, and [`webflow/CMS/`](webflow/CMS/) CSVs) for build-time merging. |
| [`src/app/`](src/app/) | Next.js App Router (`/admin`, middleware). |

## Local dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — `/` rewrites to `/index.html` (same content as the Webflow `index.html`).

Copy [`.env.example`](.env.example) to `.env.local` and add your Supabase keys when using `/admin` or `seed:supabase`. Add **Resend** keys for the contact form (see **Contact form** below).

## Contact form (Resend)

The **Start Project** form on [`public/contact.html`](public/contact.html) posts to **`/api/contact`**, which sends email via [Resend](https://resend.com).

| Variable | Where |
|----------|--------|
| `RESEND_API_KEY` | Resend → API Keys (server-only) |
| `RESEND_FROM` | Verified sender, e.g. `Digitalist <onboarding@resend.dev>` for tests, or your domain after DNS verification |
| `CONTACT_TO_EMAIL` | Optional. Inbox that receives submissions (defaults to `marina@yourdigitalist.com`) |

Set the same variables on **Vercel → Environment Variables** for production.

With **`onboarding@resend.dev`**, Resend may restrict who you can send **to** until you verify a domain—verify `yourdigitalist.com` (or add the domain Resend gives you) for full production use.

## Git + GitHub

Remote: [github.com/yourdigitalist/digitalist-website-cursor](https://github.com/yourdigitalist/digitalist-website-cursor)

## Vercel

1. Import this repo in the [Vercel dashboard](https://vercel.com/new).
2. Framework preset: **Next.js** (default).
3. Add environment variables (Supabase for `/admin`, Resend for the contact form — see sections below), then deploy.

## CMS merge (Stage 1)

Before `dev` / `build`, `scripts/merge-cms.mjs` runs automatically. It reads **`webflow/*.html`** and **`webflow/CMS/*.csv`**, then writes merged HTML into **`public/`**.

**Merged pages:** `index.html`, `portfolio.html`, `services.html`, `read.html`, and **`detail_portfolio.html`** (embeds CSV data as JSON; `public/js/cms-portfolio-detail.js` fills the page from `?slug=`). **`detail_good-reads.html`** is still a template until article detail merge is added.

```bash
npm run merge-cms
```

## Supabase (project `exyqeotxncuzqeadreid` only)

Schema, RLS, and `is_admin()` are applied on **this project only** (ref `exyqeotxncuzqeadreid`). Tables: `portfolio_categories`, `portfolios`, `testimonials`, `articles`, `admin_allowlist`.

### Environment variables (Vercel + `.env.local`)

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://exyqeotxncuzqeadreid.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Local only** for seeding; never expose to the browser |

### Auth + redirects

1. Supabase → **Authentication** → **Providers** → **Email** — enable it (required for password sign-in).
2. Create your admin user: **Authentication → Users → Add user** — set **email** and **password** (same email as in `admin_allowlist`).
3. **URL configuration**: set **Site URL** to your app (e.g. `https://your-project.vercel.app` or `http://localhost:3000`). Redirect URLs can include `http://localhost:3000/**` and your production URL for future flows (e.g. password reset emails).

### Admin allowlist

Only emails listed in **`admin_allowlist`** can use the dashboard after sign-in. Add or change rows in the **Table Editor** for the account you use (e.g. `marina@yourdigitalist.com`).

### Seed database from Webflow CSVs (one-off)

```bash
export NEXT_PUBLIC_SUPABASE_URL=https://exyqeotxncuzqeadreid.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
npm run seed:supabase
```

### `/admin`

- [http://localhost:3000/admin/login](http://localhost:3000/admin/login) — email + password sign-in.
- [http://localhost:3000/admin](http://localhost:3000/admin) — **CMS dashboard**: edit portfolios, articles, testimonials, and categories with forms and image upload (Supabase Storage bucket `cms-media`).

**Publishing to the live site:** `merge-cms` reads from **Supabase** when `SUPABASE_SERVICE_ROLE_KEY` is set (add it to Vercel build env). Otherwise it falls back to `webflow/CMS/*.csv`. After editing in admin, trigger a **redeploy** (or run `npm run merge-cms` locally) so `public/*.html` updates.

## Next steps (progressive)

1. **Article detail** — merge `detail_good-reads.html` by `slug` (portfolio detail is done via CSV + client hydrate).
2. **Build from Supabase** — extend `merge-cms.mjs` to prefer Supabase when env is set.
3. **In-app editors** — replace Table Editor links with forms + Server Actions.
