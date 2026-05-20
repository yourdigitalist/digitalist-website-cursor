/**
 * Generates SQL to seed Supabase from webflow/CMS CSVs (stdout).
 * Used for one-off imports via Supabase SQL editor or MCP.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const CMS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "webflow", "CMS");

function readCsv(name) {
  const raw = fs.readFileSync(path.join(CMS, name), "utf8");
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

function sqlStr(v) {
  if (v == null || v === "") return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlBool(v) {
  return v ? "true" : "false";
}

function sqlTs(iso) {
  return iso ? `${sqlStr(iso)}::timestamptz` : "NULL";
}

const cats = readCsv(
  "Digitalist - Portfolio Categories - 65950c2cb486e312b0cb23c1.csv",
).filter((r) => r.Slug && r.Name);

const testimonials = readCsv(
  "Digitalist - Testimonials - 697740fff0f553a06edb4057.csv",
).filter((r) => r.Slug && r.Quote && r.Logo);

const portfolios = readCsv(
  "Digitalist - Portfolios - 65950bfde87a28467fc3f42e.csv",
).filter((r) => r.Slug && r.Name);

const articles = readCsv(
  "Digitalist - Articles - 657bb758af4d44e56a434824.csv",
).filter((r) => r.Slug && r.Name);

const lines = ["BEGIN;"];

for (const r of cats) {
  lines.push(
    `INSERT INTO portfolio_categories (slug, name) VALUES (${sqlStr(r.Slug.trim())}, ${sqlStr(r.Name.trim())}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;`,
  );
}

for (const r of testimonials) {
  lines.push(
    `INSERT INTO testimonials (slug, display_name, quote, logo_url, sort_order, archived, draft) VALUES (${sqlStr(r.Slug.trim())}, ${sqlStr((r.Name || "").trim())}, ${sqlStr((r.Quote || "").trim())}, ${sqlStr((r.Logo || "").trim())}, ${parseInt(r.Order, 10) || 0}, ${sqlBool(boolCsv(r.Archived))}, ${sqlBool(boolCsv(r.Draft))}) ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, quote = EXCLUDED.quote, logo_url = EXCLUDED.logo_url, sort_order = EXCLUDED.sort_order, archived = EXCLUDED.archived, draft = EXCLUDED.draft, updated_at = now();`,
  );
}

for (const r of portfolios) {
  lines.push(
    `INSERT INTO portfolios (slug, name, client_name, client_industry, client_logo, post_summary, project_overview, main_image, thumbnail_image, project_images, category_slugs, featured, archived, draft, published_on) VALUES (${sqlStr(r.Slug.trim())}, ${sqlStr(r.Name.trim())}, ${sqlStr((r["Client Name"] || "").trim() || null)}, ${sqlStr((r["Client Industry"] || "").trim() || null)}, ${sqlStr((r["Client Logo"] || "").trim() || null)}, ${sqlStr((r["Post Summary"] || "").trim() || null)}, ${sqlStr((r["Project Overview"] || "").trim() || null)}, ${sqlStr((r["Main Image"] || "").trim() || null)}, ${sqlStr((r["Thumbnail image"] || "").trim() || null)}, ${sqlStr((r["Project Imges"] || "").trim() || null)}, ${sqlStr((r["Porfolio Category"] || "").trim() || null)}, ${sqlBool(boolCsv(r["Featured?"]))}, ${sqlBool(boolCsv(r.Archived))}, ${sqlBool(boolCsv(r.Draft))}, ${sqlTs(parseDateIso(r["Published On"]))}) ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, client_name = EXCLUDED.client_name, client_industry = EXCLUDED.client_industry, client_logo = EXCLUDED.client_logo, post_summary = EXCLUDED.post_summary, project_overview = EXCLUDED.project_overview, main_image = EXCLUDED.main_image, thumbnail_image = EXCLUDED.thumbnail_image, project_images = EXCLUDED.project_images, category_slugs = EXCLUDED.category_slugs, featured = EXCLUDED.featured, archived = EXCLUDED.archived, draft = EXCLUDED.draft, published_on = EXCLUDED.published_on, updated_at = now();`,
  );
}

for (const r of articles) {
  lines.push(
    `INSERT INTO articles (slug, title, post_summary, post_body, main_image, thumbnail_image, featured, archived, draft, category_slug, author_slug, published_on) VALUES (${sqlStr(r.Slug.trim())}, ${sqlStr(r.Name.trim())}, ${sqlStr((r["Post Summary"] || "").trim() || null)}, ${sqlStr((r["Post Body"] || "").trim() || null)}, ${sqlStr((r["Main Image"] || "").trim() || null)}, ${sqlStr((r["Thumbnail image"] || "").trim() || null)}, ${sqlBool(boolCsv(r["Featured?"]))}, ${sqlBool(boolCsv(r.Archived))}, ${sqlBool(boolCsv(r.Draft))}, ${sqlStr((r.Category || "").trim() || null)}, ${sqlStr((r.Author || "").trim() || null)}, ${sqlTs(parseDateIso(r["Published On"]))}) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, post_summary = EXCLUDED.post_summary, post_body = EXCLUDED.post_body, main_image = EXCLUDED.main_image, thumbnail_image = EXCLUDED.thumbnail_image, featured = EXCLUDED.featured, archived = EXCLUDED.archived, draft = EXCLUDED.draft, category_slug = EXCLUDED.category_slug, author_slug = EXCLUDED.author_slug, published_on = EXCLUDED.published_on, updated_at = now();`,
  );
}

lines.push("COMMIT;");
process.stdout.write(lines.join("\n"));
