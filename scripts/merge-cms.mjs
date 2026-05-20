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

/** All published portfolio items (for portfolio + services pages). */
function loadPublishedPortfolios() {
  const rows = readCsv(
    "Digitalist - Portfolios - 65950bfde87a28467fc3f42e.csv",
  );
  return rows
    .filter((r) => !isTruthyCsv(r.Archived) && !isTruthyCsv(r.Draft))
    .filter((r) => r.Slug && r.Name)
    .sort((a, b) => {
      const da = Date.parse(a["Published On"] || a["Created On"] || "") || 0;
      const db = Date.parse(b["Published On"] || b["Created On"] || "") || 0;
      return db - da;
    });
}

function loadPublishedArticles() {
  const rows = readCsv(
    "Digitalist - Articles - 657bb758af4d44e56a434824.csv",
  );
  return rows
    .filter((r) => !isTruthyCsv(r.Archived) && !isTruthyCsv(r.Draft))
    .filter((r) => r.Slug && r.Name)
    .sort((a, b) => {
      const da = Date.parse(a["Published On"] || a["Created On"] || "") || 0;
      const db = Date.parse(b["Published On"] || b["Created On"] || "") || 0;
      return db - da;
    });
}

/** Minimal fields for client-side `detail_portfolio.html?slug=` hydration. */
function buildPortfolioDetailPayloadRows() {
  return loadPublishedPortfolios().map((row) => ({
    slug: String(row.Slug || "").trim(),
    name: String(row.Name || "").trim(),
    clientLogo: String(row["Client Logo"] || "").trim(),
    clientName: String(row["Client Name"] || "").trim(),
    clientIndustry: String(row["Client Industry"] || "").trim(),
    date: String(row.Date || "").trim(),
    mainImage: String(
      row["Main Image"] || row["Thumbnail image"] || "",
    ).trim(),
    postSummary: String(row["Post Summary"] || "")
      .replace(/\s+/g, " ")
      .trim(),
    projectOverviewHtml: row["Project Overview"] || "",
    categorySlugs: String(row["Porfolio Category"] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
    galleryUrls: String(row["Project Imges"] || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
  }));
}

function portfolioDetailHref(slug) {
  return `detail_portfolio.html?slug=${encodeURIComponent(slug)}`;
}

function articleDetailHref(slug) {
  return `detail_good-reads.html?slug=${encodeURIComponent(slug)}`;
}

/** Category chips: works for index/portfolio (wrapper-5) and services (portfolio-category-wrapper). */
function fillPortfolioCategoryChips($item, row, categoryBySlug, $innerTagTemplate) {
  const $innerList = $item
    .find(
      ".collection-list-wrapper-5.w-dyn-list .collection-list-2.w-dyn-items, .portfolio-category-wrapper.w-dyn-list .collection-list-2.w-dyn-items",
    )
    .first();
  if (!$innerList.length) return;
  $innerList.empty();
  const cats = (row["Porfolio Category"] || "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const slug of cats) {
    const $tag = $innerTagTemplate.clone();
    const label = categoryBySlug.get(slug) || slug;
    const $cat = $tag.find(".portfolio-category");
    $cat.text(label);
    $cat.removeClass("w-dyn-bind-empty");
    $tag.removeClass("w-dyn-bind-empty");
    $innerList.append($tag);
  }
}

/** Index-style card: image + title links in link-box / heading-4.text-link. */
function hydrateCompactPortfolioCard($item, row, categoryBySlug, $innerTagTemplate) {
  const mainImage = row["Main Image"] || row["Thumbnail image"] || "";
  const href = portfolioDetailHref(row.Slug);
  const $linkImg = $item.find("a.link-box img.image-31");
  const $link = $item.find("a.link-box").first();
  const $titleLink = $item.find("a.heading-4.text-link").first();
  if (mainImage && $linkImg.length) {
    $linkImg.attr("src", mainImage);
    $linkImg.attr("alt", row.Name || "");
    $linkImg.removeClass("w-dyn-bind-empty");
  }
  if ($link.length) $link.attr("href", href);
  if ($titleLink.length) {
    $titleLink.attr("href", href);
    $titleLink.text(row.Name || "");
    $titleLink.removeClass("w-dyn-bind-empty");
  }
  fillPortfolioCategoryChips($item, row, categoryBySlug, $innerTagTemplate);
  $item.find(".w-dyn-bind-empty").removeClass("w-dyn-bind-empty");
}

/** Portfolio page card: same as compact + optional Post Summary paragraph. */
function hydratePortfolioPageCard(
  $item,
  row,
  categoryBySlug,
  $innerTagTemplate,
  { includeSummary } = {},
) {
  hydrateCompactPortfolioCard($item, row, categoryBySlug, $innerTagTemplate);
  if (includeSummary) {
    const summary = (row["Post Summary"] || "").replace(/\s+/g, " ").trim();
    const $p = $item.find("p.paragraph.portfolio");
    if ($p.length && summary) {
      $p.text(summary);
      $p.removeClass("w-dyn-bind-empty");
    }
  }
}

/** Services “See some of our work” card layout. */
function hydrateServicesPortfolioCard(
  $,
  $item,
  row,
  categoryBySlug,
  $innerTagTemplate,
) {
  const mainImage = row["Main Image"] || row["Thumbnail image"] || "";
  const href = portfolioDetailHref(row.Slug);
  const $img = $item.find("img.portfolio-image-featured");
  if (mainImage && $img.length) {
    $img.attr("src", mainImage);
    $img.attr("alt", row.Name || "");
    $img.removeClass("w-dyn-bind-empty");
  }
  const $wrap = $item.find(".portfolio-image-wrapper-2");
  if ($wrap.length && !$wrap.find("> a").length && $img.length) {
    const $a = $("<a></a>").attr("href", href).addClass("w-inline-block");
    $img.wrap($a);
  }
  const $h4 = $item.find("h4.heading-4.blog-titles");
  if ($h4.length) {
    $h4.empty();
    $h4.append(
      $("<a></a>")
        .attr("href", href)
        .addClass("w-inline-block")
        .text(row.Name || ""),
    );
    $h4.removeClass("w-dyn-bind-empty");
  }
  const desc = (row["Post Summary"] || "").replace(/\s+/g, " ").trim();
  const $desc = $item.find("p.portfolio-description");
  if ($desc.length) {
    $desc.text(desc);
    $desc.removeClass("w-dyn-bind-empty");
  }
  fillPortfolioCategoryChips($item, row, categoryBySlug, $innerTagTemplate);
  $item.find(".w-dyn-bind-empty").removeClass("w-dyn-bind-empty");
}

function removeDynEmptyIfHasItems($, $itemsContainer) {
  if (!$itemsContainer.children().length) return;
  const $empty = $itemsContainer
    .parent()
    .closest(".w-dyn-list")
    .find(".w-dyn-empty")
    .first();
  if ($empty.length) $empty.remove();
}

function writeHtml(fileName, mutate) {
  const src = path.join(WEBFLOW, fileName);
  const out = path.join(PUBLIC, fileName);
  const html = fs.readFileSync(src, "utf8");
  const $ = load(html, { decodeEntities: false });
  mutate($);
  fs.writeFileSync(out, $.root().html(), "utf8");
  console.log(`[merge-cms] Wrote public/${fileName}`);
}

function mergeIndexHtml(categoryBySlug) {
  writeHtml("index.html", ($) => {
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

    const $pOuter = $(
      ".collection-list-wrapper-4.w-dyn-list > .collection-list-6.w-dyn-items",
    ).first();
    if ($pOuter.length) {
      const portfolios = loadFeaturedPortfolios();
      const $pTemplate = $pOuter.children(".w-dyn-item").first().clone();
      const $innerItemsTemplate = $pTemplate
        .find(
          ".collection-list-wrapper-5.w-dyn-list .collection-list-2.w-dyn-items",
        )
        .first()
        .children(".portfolio-tags.w-dyn-item")
        .first()
        .clone();
      $pOuter.empty();
      for (const row of portfolios) {
        const $item = $pTemplate.clone();
        hydrateCompactPortfolioCard(
          $item,
          row,
          categoryBySlug,
          $innerItemsTemplate,
        );
        $pOuter.append($item);
      }
      removeDynEmptyIfHasItems($, $pOuter);
    }
  });
}

function mergePortfolioHtml(categoryBySlug) {
  writeHtml("portfolio.html", ($) => {
    const $pOuter = $(
      ".collection-list-wrapper-4.w-dyn-list .collection-list-6.portfolio-page.w-dyn-items",
    ).first();
    if (!$pOuter.length) return;
    const portfolios = loadPublishedPortfolios();
    const $pTemplate = $pOuter.children(".collection-item-6.w-dyn-item").first().clone();
    const $innerItemsTemplate = $pTemplate
      .find(
        ".collection-list-wrapper-5.w-dyn-list .collection-list-2.w-dyn-items",
      )
      .first()
      .children(".portfolio-tags.w-dyn-item")
      .first()
      .clone();
    $pOuter.empty();
    for (const row of portfolios) {
      const $item = $pTemplate.clone();
      hydratePortfolioPageCard($item, row, categoryBySlug, $innerItemsTemplate, {
        includeSummary: true,
      });
      $pOuter.append($item);
    }
    removeDynEmptyIfHasItems($, $pOuter);
  });
}

function mergeServicesHtml(categoryBySlug) {
  writeHtml("services.html", ($) => {
    const $pOuter = $(
      ".collection-list-wrapper.portfolio.w-dyn-list .collection-list.portfolio.w-dyn-items",
    ).first();
    if (!$pOuter.length) return;
    const portfolios = loadPublishedPortfolios();
    const $pTemplate = $pOuter
      .children(".collection-item.portfolio.w-dyn-item")
      .first()
      .clone();
    const $innerItemsTemplate = $pTemplate
      .find(".portfolio-category-wrapper.w-dyn-list .collection-list-2.w-dyn-items")
      .first()
      .children(".portfolio-tags.w-dyn-item")
      .first()
      .clone();
    $pOuter.empty();
    for (const row of portfolios) {
      const $item = $pTemplate.clone();
      hydrateServicesPortfolioCard(
        $,
        $item,
        row,
        categoryBySlug,
        $innerItemsTemplate,
      );
      $pOuter.append($item);
    }
    removeDynEmptyIfHasItems($, $pOuter);
  });
}

function mergeReadHtml() {
  writeHtml("read.html", ($) => {
    const $list = $(
      ".collection-list-wrapper.w-dyn-list .collection-list.w-dyn-items",
    ).first();
    if (!$list.length) return;
    const articles = loadPublishedArticles();
    const $tpl = $list.children(".collection-item.w-dyn-item").first().clone();
    $list.empty();
    for (const row of articles) {
      const $item = $tpl.clone();
      const imgUrl = row["Main Image"] || row["Thumbnail image"] || "";
      const href = articleDetailHref(row.Slug);
      if (imgUrl) {
        const $img = $item.find("img.blog-images");
        $img.attr("src", imgUrl);
        $img.attr("alt", row.Name || "");
        $img.removeClass("w-dyn-bind-empty");
      }
      $item.find("h4.blog-titles").text(row.Name || "").removeClass("w-dyn-bind-empty");
      const sum = (row["Post Summary"] || "").replace(/\s+/g, " ").trim();
      $item.find("p.blog-description").text(sum).removeClass("w-dyn-bind-empty");
      $item.find("a.button-read-more").attr("href", href);
      $item.find(".w-dyn-bind-empty").removeClass("w-dyn-bind-empty");
      $list.append($item);
    }
    removeDynEmptyIfHasItems($, $list);
  });
}

function mergeDetailPortfolioHtml(categoryBySlug) {
  writeHtml("detail_portfolio.html", ($) => {
    const payload = {
      categories: Object.fromEntries(categoryBySlug),
      items: buildPortfolioDetailPayloadRows(),
    };
    const $json = $("<script></script>")
      .attr("type", "application/json")
      .attr("id", "__cms_portfolio_detail")
      .text(JSON.stringify(payload));
    $("body").append($json);
    $("body").append(
      '<script src="js/cms-portfolio-detail.js" defer></script>',
    );
  });
}

function main() {
  const categoryBySlug = loadCategoryMap();
  mergeIndexHtml(categoryBySlug);
  mergePortfolioHtml(categoryBySlug);
  mergeServicesHtml(categoryBySlug);
  mergeReadHtml();
  mergeDetailPortfolioHtml(categoryBySlug);
  console.log("[merge-cms] Done.");
}

main();
