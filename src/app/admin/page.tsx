import { requireAdmin } from "@/lib/admin/require-admin";
import Link from "next/link";
import { AdminNav } from "./AdminNav";
import { LogoutButton } from "./LogoutButton";

export default async function AdminDashboardPage() {
  const { supabase, user } = await requireAdmin();

  const [portfolios, articles, testimonials, categories] = await Promise.all([
    supabase.from("portfolios").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("testimonials").select("id", { count: "exact", head: true }),
    supabase.from("portfolio_categories").select("id", { count: "exact", head: true }),
  ]);

  const sections = [
    {
      href: "/admin/portfolios",
      title: "Portfolios",
      count: portfolios.count ?? 0,
      desc: "Projects, images, categories, featured flag",
    },
    {
      href: "/admin/articles",
      title: "Articles",
      count: articles.count ?? 0,
      desc: "Blog posts for the Read page",
    },
    {
      href: "/admin/testimonials",
      title: "Testimonials",
      count: testimonials.count ?? 0,
      desc: "Homepage testimonial carousel",
    },
    {
      href: "/admin/categories",
      title: "Portfolio categories",
      count: categories.count ?? 0,
      desc: "Tags shown on portfolio cards",
    },
  ];

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Content</h1>
          <p className="text-sm text-zinc-600">Signed in as {user.email}</p>
        </div>
        <LogoutButton />
      </div>
      <AdminNav active="home" />
      <p className="mb-6 text-sm text-zinc-600">
        Edit content here like Webflow CMS. After saving, redeploy (or run{" "}
        <code className="rounded bg-zinc-200 px-1">npm run merge-cms</code> locally) so
        the public site picks up changes.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-lg font-medium">{s.title}</h2>
                <span className="text-sm text-zinc-500">{s.count} items</span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{s.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
