/**
 * Load CMS rows from Supabase (when SUPABASE_SERVICE_ROLE_KEY is set).
 * Returns CSV-shaped rows for merge-cms.mjs.
 */
import { createClient } from "@supabase/supabase-js";

function boolDb(v) {
  return v ? "true" : "false";
}

function portfolioToCsv(r) {
  return {
    Slug: r.slug,
    Name: r.name,
    "Client Name": r.client_name || "",
    "Client Industry": r.client_industry || "",
    "Client Logo": r.client_logo || "",
    "Post Summary": r.post_summary || "",
    "Project Overview": r.project_overview || "",
    "Main Image": r.main_image || "",
    "Thumbnail image": r.thumbnail_image || "",
    "Project Imges": r.project_images || "",
    "Porfolio Category": r.category_slugs || "",
    "Featured?": boolDb(r.featured),
    Archived: boolDb(r.archived),
    Draft: boolDb(r.draft),
    "Published On": r.published_on || "",
  };
}

function articleToCsv(r) {
  return {
    Slug: r.slug,
    Name: r.title,
    "Post Summary": r.post_summary || "",
    "Post Body": r.post_body || "",
    "Main Image": r.main_image || "",
    "Thumbnail image": r.thumbnail_image || "",
    "Featured?": boolDb(r.featured),
    Archived: boolDb(r.archived),
    Draft: boolDb(r.draft),
    Category: r.category_slug || "",
    Author: r.author_slug || "",
    "Published On": r.published_on || "",
  };
}

function testimonialToCsv(r) {
  return {
    Slug: r.slug,
    Name: r.display_name,
    Quote: r.quote,
    Logo: r.logo_url,
    Order: String(r.sort_order ?? 0),
    Archived: boolDb(r.archived),
    Draft: boolDb(r.draft),
  };
}

export async function loadCmsFromSupabaseIfConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const [cats, portfolios, articles, testimonials] = await Promise.all([
    sb.from("portfolio_categories").select("slug, name").order("name"),
    sb.from("portfolios").select("*").order("published_on", { ascending: false }),
    sb.from("articles").select("*").order("published_on", { ascending: false }),
    sb.from("testimonials").select("*").order("sort_order", { ascending: true }),
  ]);

  if (cats.error || portfolios.error || articles.error || testimonials.error) {
    console.warn("[merge-cms] Supabase load failed, falling back to CSV");
    return null;
  }

  const categoryMap = new Map();
  for (const c of cats.data || []) {
    categoryMap.set(c.slug, c.name);
  }

  console.log("[merge-cms] Using Supabase CMS data");
  return {
    categoryMap,
    portfolios: (portfolios.data || []).map(portfolioToCsv),
    articles: (articles.data || []).map(articleToCsv),
    testimonials: (testimonials.data || []).map(testimonialToCsv),
  };
}
