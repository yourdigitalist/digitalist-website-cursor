/**
 * One-off seed: CSV files in webflow/CMS → Supabase (project exyqeotxncuzqeadreid).
 *
 *   export NEXT_PUBLIC_SUPABASE_URL=https://exyqeotxncuzqeadreid.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret
 *   npm run seed:supabase
 *
 * Uses service role (bypasses RLS). Do not commit the key.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CMS = path.join(ROOT, "webflow", "CMS");

function readCsv(name) {
  const p = path.join(CMS, name);
  const raw = fs.readFileSync(p, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });
}

function boolCsv(v) {
  if (v == null || v === "") return false;
  const s = String(v).toLowerCase();
  return s === "true" || s === "yes" || s === "1";
}

function parseDateIso(s) {
  if (!s || !String(s).trim()) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then re-run.",
    );
    process.exit(1);
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const cats = readCsv(
    "Digitalist - Portfolio Categories - 65950c2cb486e312b0cb23c1.csv",
  );
  const catRows = cats
    .filter((r) => r.Slug && r.Name)
    .map((r) => ({ slug: r.Slug.trim(), name: r.Name.trim() }));

  const testimonials = readCsv(
    "Digitalist - Testimonials - 697740fff0f553a06edb4057.csv",
  );
  const tRows = testimonials
    .filter((r) => !boolCsv(r.Archived) && !boolCsv(r.Draft))
    .filter((r) => r.Slug && r.Quote && r.Logo)
    .map((r) => ({
      slug: r.Slug.trim(),
      display_name: (r.Name || "").trim(),
      quote: (r.Quote || "").trim(),
      logo_url: (r.Logo || "").trim(),
      sort_order: parseInt(r.Order, 10) || 0,
      archived: boolCsv(r.Archived),
      draft: boolCsv(r.Draft),
    }));

  const portfolios = readCsv(
    "Digitalist - Portfolios - 65950bfde87a28467fc3f42e.csv",
  );
  const pRows = portfolios
    .filter((r) => r.Slug && r.Name)
    .map((r) => ({
      slug: r.Slug.trim(),
      name: r.Name.trim(),
      client_name: (r["Client Name"] || "").trim() || null,
      client_industry: (r["Client Industry"] || "").trim() || null,
      client_logo: (r["Client Logo"] || "").trim() || null,
      post_summary: (r["Post Summary"] || "").trim() || null,
      project_overview: (r["Project Overview"] || "").trim() || null,
      main_image: (r["Main Image"] || "").trim() || null,
      thumbnail_image: (r["Thumbnail image"] || "").trim() || null,
      project_images: (r["Project Imges"] || "").trim() || null,
      category_slugs: (r["Porfolio Category"] || "").trim() || null,
      featured: boolCsv(r["Featured?"]),
      archived: boolCsv(r.Archived),
      draft: boolCsv(r.Draft),
      published_on: parseDateIso(r["Published On"]),
    }));

  const articles = readCsv(
    "Digitalist - Articles - 657bb758af4d44e56a434824.csv",
  );
  const aRows = articles
    .filter((r) => r.Slug && r.Name)
    .map((r) => ({
      slug: r.Slug.trim(),
      title: r.Name.trim(),
      post_summary: (r["Post Summary"] || "").trim() || null,
      post_body: (r["Post Body"] || "").trim() || null,
      main_image: (r["Main Image"] || "").trim() || null,
      thumbnail_image: (r["Thumbnail image"] || "").trim() || null,
      featured: boolCsv(r["Featured?"]),
      archived: boolCsv(r.Archived),
      draft: boolCsv(r.Draft),
      category_slug: (r.Category || "").trim() || null,
      author_slug: (r.Author || "").trim() || null,
      published_on: parseDateIso(r["Published On"]),
    }));

  async function upsert(table, rows, onConflict) {
    if (!rows.length) {
      console.log(`[seed] skip ${table} (0 rows)`);
      return;
    }
    const { error } = await sb.from(table).upsert(rows, { onConflict });
    if (error) {
      console.error(`[seed] ${table}`, error);
      process.exit(1);
    }
    console.log(`[seed] ${table}: ${rows.length} rows`);
  }

  (async () => {
    await upsert("portfolio_categories", catRows, "slug");
    await upsert("testimonials", tRows, "slug");
    await upsert("portfolios", pRows, "slug");
    await upsert("articles", aRows, "slug");
    console.log("[seed] Done.");
  })();
}

main();
