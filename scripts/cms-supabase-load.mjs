/**
 * Load CMS rows from Supabase (when SUPABASE_SERVICE_ROLE_KEY is set).
 * Uses PostgREST fetch (no realtime/WebSocket — safe in Node build scripts).
 */

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
    "Created On": r.created_at || "",
    "Updated On": r.updated_at || "",
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

async function restGet(baseUrl, key, path) {
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path}: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

export async function loadCmsFromSupabaseIfConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const [cats, portfolios, articles, testimonials] = await Promise.all([
      restGet(url, key, "portfolio_categories?select=slug,name&order=name"),
      restGet(url, key, "portfolios?select=*&order=updated_at.desc"),
      restGet(url, key, "articles?select=*&order=published_on.desc"),
      restGet(url, key, "testimonials?select=*&order=sort_order"),
    ]);

    const categoryMap = new Map();
    for (const c of cats) {
      categoryMap.set(c.slug, c.name);
    }

    console.log("[merge-cms] Using Supabase CMS data");
    return {
      categoryMap,
      portfolios: portfolios.map(portfolioToCsv),
      articles: articles.map(articleToCsv),
      testimonials: testimonials.map(testimonialToCsv),
    };
  } catch (err) {
    console.warn("[merge-cms] Supabase load failed, falling back to CSV:", err.message);
    return null;
  }
}
