import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return (
      <main>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel (or{" "}
          <code>.env.local</code>) for this project.
        </p>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || !isAdmin) {
    redirect("/admin/login?error=forbidden");
  }

  const [portfolios, articles, testimonials, categories] = await Promise.all([
    supabase.from("portfolios").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("testimonials").select("id", { count: "exact", head: true }),
    supabase
      .from("portfolio_categories")
      .select("id", { count: "exact", head: true }),
  ]);

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="text-sm text-zinc-600">Signed in as {user.email}</p>
        </div>
        <LogoutButton />
      </div>
      <p className="mt-6 text-sm text-zinc-600">
        Database: Supabase project{" "}
        <code className="rounded bg-zinc-200 px-1">exyqeotxncuzqeadreid</code>{" "}
        only. Row counts below (seed from CSV if empty).
      </p>
      <ul className="mt-6 space-y-3">
        <li className="rounded border border-zinc-200 bg-white p-4">
          <strong>Portfolios</strong> — {portfolios.count ?? 0} rows
          <div className="mt-2">
            <Link
              href="https://supabase.com/dashboard/project/exyqeotxncuzqeadreid/editor"
              className="text-sm text-blue-700 underline"
            >
              Open in Supabase Table Editor
            </Link>
          </div>
        </li>
        <li className="rounded border border-zinc-200 bg-white p-4">
          <strong>Articles</strong> — {articles.count ?? 0} rows
        </li>
        <li className="rounded border border-zinc-200 bg-white p-4">
          <strong>Testimonials</strong> — {testimonials.count ?? 0} rows
        </li>
        <li className="rounded border border-zinc-200 bg-white p-4">
          <strong>Portfolio categories</strong> — {categories.count ?? 0} rows
        </li>
      </ul>
      <p className="mt-8 text-sm text-zinc-600">
        Local seed:{" "}
        <code className="rounded bg-zinc-200 px-1">
          npm run seed:supabase
        </code>{" "}
        (requires <code>SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
        <code>.env.local</code>).
      </p>
      <p className="mt-4 text-sm">
        <Link href="/index.html" className="text-zinc-600 underline">
          ← Site home
        </Link>
      </p>
    </main>
  );
}
