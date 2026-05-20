"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import { revalidatePath } from "next/cache";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** e.g. `my-project` → `my-project-copy`, then `my-project-copy-2`, … */
async function nextCopySlug(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  table: string,
  slug: string,
) {
  const root = slug.replace(/(-copy)(-\d+)?$/, "") || slug;
  for (let i = 1; i < 50; i++) {
    const candidate = i === 1 ? `${root}-copy` : `${root}-copy-${i}`;
    const { count } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("slug", candidate);
    if (!count) return candidate;
  }
  return `${root}-copy-${Date.now()}`;
}

export async function duplicatePortfolio(id: string) {
  const { supabase } = await requireAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !row) throw new Error("Portfolio not found");

  const slug = await nextCopySlug(supabase, "portfolios", row.slug);
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
  const insert = {
    ...rest,
    slug,
    name: `${row.name} (copy)`,
    draft: true,
    featured: false,
  };

  const { data, error } = await supabase
    .from("portfolios")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/portfolios");
  return { id: data.id };
}

export async function duplicateArticle(id: string) {
  const { supabase } = await requireAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !row) throw new Error("Article not found");

  const slug = await nextCopySlug(supabase, "articles", row.slug);
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
  const insert = {
    ...rest,
    slug,
    title: `${row.title} (copy)`,
    draft: true,
    featured: false,
  };

  const { data, error } = await supabase
    .from("articles")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/articles");
  return { id: data.id };
}

export async function duplicateTestimonial(id: string) {
  const { supabase } = await requireAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !row) throw new Error("Testimonial not found");

  const slug = await nextCopySlug(supabase, "testimonials", row.slug);
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
  const insert = {
    ...rest,
    slug,
    display_name: `${row.display_name} (copy)`,
    draft: true,
    sort_order: (row.sort_order ?? 0) + 1,
  };

  const { data, error } = await supabase
    .from("testimonials")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
  return { id: data.id };
}

export async function duplicateCategory(id: string) {
  const { supabase } = await requireAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("portfolio_categories")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !row) throw new Error("Category not found");

  const slug = await nextCopySlug(supabase, "portfolio_categories", row.slug);
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
  const insert = {
    ...rest,
    slug,
    name: `${row.name} (copy)`,
  };

  const { data, error } = await supabase
    .from("portfolio_categories")
    .insert(insert)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  return { id: data.id };
}

export async function savePortfolio(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  let slug = String(formData.get("slug") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");
  if (!slug) slug = slugify(name);

  const row = {
    slug,
    name,
    client_name: String(formData.get("client_name") || "").trim() || null,
    client_industry: String(formData.get("client_industry") || "").trim() || null,
    client_logo: String(formData.get("client_logo") || "").trim() || null,
    post_summary: String(formData.get("post_summary") || "").trim() || null,
    project_overview: String(formData.get("project_overview") || "").trim() || null,
    main_image: String(formData.get("main_image") || "").trim() || null,
    thumbnail_image: String(formData.get("thumbnail_image") || "").trim() || null,
    project_images:
      String(formData.get("project_images") || "")
        .split(/[\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join("; ") || null,
    category_slugs: String(formData.get("category_slugs") || "").trim() || null,
    featured: formData.get("featured") === "on",
    draft: formData.get("draft") === "on",
    archived: formData.get("archived") === "on",
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("portfolios").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/portfolios");
    revalidatePath(`/admin/portfolios/${id}`);
    return { id };
  }

  const { data, error } = await supabase.from("portfolios").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/portfolios");
  return { id: data.id };
}

export async function deletePortfolio(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("portfolios").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/portfolios");
}

export async function saveArticle(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  let slug = String(formData.get("slug") || "").trim();
  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Title is required");
  if (!slug) slug = slugify(title);

  const row = {
    slug,
    title,
    post_summary: String(formData.get("post_summary") || "").trim() || null,
    post_body: String(formData.get("post_body") || "").trim() || null,
    main_image: String(formData.get("main_image") || "").trim() || null,
    thumbnail_image: String(formData.get("thumbnail_image") || "").trim() || null,
    category_slug: String(formData.get("category_slug") || "").trim() || null,
    author_slug: String(formData.get("author_slug") || "").trim() || null,
    featured: formData.get("featured") === "on",
    draft: formData.get("draft") === "on",
    archived: formData.get("archived") === "on",
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("articles").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/articles");
    return { id };
  }

  const { data, error } = await supabase.from("articles").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/articles");
  return { id: data.id };
}

export async function deleteArticle(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/articles");
}

export async function saveTestimonial(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  let slug = String(formData.get("slug") || "").trim();
  const display_name = String(formData.get("display_name") || "").trim();
  const quote = String(formData.get("quote") || "").trim();
  const logo_url = String(formData.get("logo_url") || "").trim();
  if (!display_name || !quote || !logo_url) {
    throw new Error("Name, quote, and logo are required");
  }
  if (!slug) slug = slugify(display_name);

  const row = {
    slug,
    display_name,
    quote,
    logo_url,
    sort_order: parseInt(String(formData.get("sort_order") || "0"), 10) || 0,
    draft: formData.get("draft") === "on",
    archived: formData.get("archived") === "on",
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("testimonials").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/testimonials");
    return { id };
  }

  const { data, error } = await supabase.from("testimonials").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
  return { id: data.id };
}

export async function deleteTestimonial(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  let slug = String(formData.get("slug") || "").trim();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");
  if (!slug) slug = slugify(name);

  const row = { slug, name, updated_at: new Date().toISOString() };

  if (id) {
    const { error } = await supabase.from("portfolio_categories").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/categories");
    return { id };
  }

  const { data, error } = await supabase
    .from("portfolio_categories")
    .insert(row)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  return { id: data.id };
}

export async function deleteCategory(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("portfolio_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
}
