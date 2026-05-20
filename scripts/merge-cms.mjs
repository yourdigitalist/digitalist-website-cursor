/**
 * Build-time merge: read Webflow HTML from `webflow/`, hydrate CMS lists from CSVs in `webflow/CMS/`, write to `public/`.
 * Source templates stay in `webflow/`; deployed site uses `public/`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import { parse } from "csv-parse/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WEBFLOW = path.join(ROOT, "webflow");
const PUBLIC = path.join(ROOT, "public");
const CMS = path.join(WEBFLOW, "CMS");

function readCsv(fileName) {
  const p = path.join(CMS, fileName);
  if (!fs.existsSync(p)) {
    console.warn(`[merge-cms] Missing CSV: ${p}`);
    return [];
  }
  const raw = fs.readFileSync(p, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });
}

function isTruthyCsv(val) {
  if (val == null || val === "") return false;
  const s = String(val).toLowerCase();
  return s === "true" || s === "yes" || s === "1";
}

function loadCategoryMap() {
  const rows = readCsv(
    "Digitalist - Portfolio Categories - 65950c2cb486e312b0cb23c1.csv",
  );
  const map = new Map();
  for (const row of rows) {
    if (!row.Slug) continue;
    map.set(row.Slug.trim(), row.Name?.trim() || row.Slug);
  }
  return map;
}

function loadTestimonials() {
  const rows = readCsv(
    "Digitalist - Testimonials - 697740fff0f553a06edb4057.csv",
  );
  const sorted = rows
    .filter((r) => !isTruthyCsv(r.Archived) && !isTruthyCsv(r.Draft))
    .filter((r) => r.Slug && !String(r.Slug).includes("-copy"))
    .filter((r) => r.Quote && r.Logo)
    .sort((a, b) => {
      const oa = parseInt(a.Order, 10) || 999;
      const ob = parseInt(b.Order, 10) || 999;
      return oa - ob;
    });
  const seen = new Set();
  const deduped = [];
  for (const r of sorted) {
    const key = (r.Name || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }
  return deduped;
}

function loadFeaturedPortfolios() {
  const rows = readCsv(
    "Digitalist - Portfolios - 65950bfde87a28467fc3f42e.csv",
  );
  return rows
    .filter((r) => !isTruthyCsv(r.Archived) && !isTruthyCsv(r.Draft))
    .filter((r) => isTruthyCsv(r["Featured?"]))
    .filter((r) => r.Slug && r.Name);
}

function mergeIndexHtml(categoryBySlug) {
  const src = path.join(WEBFLOW, "index.html");
  const out = path.join(PUBLIC, "index.html");
  const html = fs.readFileSync(src, "utf8");
  const $ = load(html, { decodeEntities: false });

  // --- Testimonials (home swiper) ---
  const $tWrap = $(".swiper.testimonial.w-dyn-list .swiper-wrapper.w-dyn-items");
  if ($tWrap.length) {
    const testimonials = loadTestimonials();
    const $tTemplate = $tWrap.children(".w-dyn-item").first().clone();
    $tWrap.empty();
    for (const row of testimonials) {
      const $item = $tTemplate.clone();
      const $img = $item.find("img.client-logo-testimonial");
      $img.attr("src", row.Logo);
      $img.attr("alt", row.Name || "");
      $img.removeClass("w-dyn-bind-empty");
      const $quote = $item.find("p.testimonial-quote");
      $quote.text((row.Quote || "").replace(/\s+/g, " ").trim());
      $quote.removeClass("w-dyn-bind-empty");
      const $name = $item.find("p.testimonial-name");
      $name.text(row.Name || "");
      $name.removeClass("w-dyn-bind-empty");
      $tWrap.append($item);
    }
  }

  // --- Featured work grid (outer list only; inner category chips) ---
  const $pOuter = $(
    ".collection-list-wrapper-4.w-dyn-list > .collection-list-6.w-dyn-items",
  ).first();
  if ($pOuter.length) {
    const portfolios = loadFeaturedPortfolios();
    const $pTemplate = $pOuter.children(".w-dyn-item").first().clone();
    const $innerItemsTemplate = $pTemplate
      .find(".collection-list-wrapper-5.w-dyn-list .collection-list-2.w-dyn-items")
      .first()
      .children(".portfolio-tags.w-dyn-item")
      .first()
      .clone();

    $pOuter.empty();

    for (const row of portfolios) {
      const $item = $pTemplate.clone();
      const mainImage = row["Main Image"] || row["Thumbnail image"] || "";
      const $linkImg = $item.find("a.link-box img.image-31");
      const $link = $item.find("a.link-box").first();
      const $titleLink = $item.find("a.heading-4.text-link").first();

      if (mainImage) {
        $linkImg.attr("src", mainImage);
        $linkImg.attr("alt", row.Name || "");
        $linkImg.removeClass("w-dyn-bind-empty");
      }
      const detailHref = `detail_portfolio.html?slug=${encodeURIComponent(row.Slug)}`;
      $link.attr("href", detailHref);
      $titleLink.attr("href", detailHref);
      $titleLink.text(row.Name || "");
      $titleLink.removeClass("w-dyn-bind-empty");

      const $innerList = $item.find(
        ".collection-list-wrapper-5.w-dyn-list .collection-list-2.w-dyn-items",
      );
      $innerList.empty();
      const cats = (row["Porfolio Category"] || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const slug of cats) {
        const $tag = $innerItemsTemplate.clone();
        const label = categoryBySlug.get(slug) || slug;
        const $p = $tag.find("p.portfolio-category");
        $p.text(label);
        $p.removeClass("w-dyn-bind-empty");
        $tag.removeClass("w-dyn-bind-empty");
        $innerList.append($tag);
      }

      $item.find(".w-dyn-bind-empty").removeClass("w-dyn-bind-empty");
      $pOuter.append($item);
    }

    const $empty = $pOuter
      .parent()
      .closest(".collection-list-wrapper-4.w-dyn-list")
      .find(".w-dyn-empty")
      .first();
    if (portfolios.length && $empty.length) {
      $empty.remove();
    }
  }

  fs.writeFileSync(out, $.root().html(), "utf8");
  console.log("[merge-cms] Wrote public/index.html");
}

function main() {
  const categoryBySlug = loadCategoryMap();
  mergeIndexHtml(categoryBySlug);
  console.log("[merge-cms] Done.");
}

main();
