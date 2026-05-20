import { requireAdmin } from "@/lib/admin/require-admin";
import Link from "next/link";
import { AdminNav } from "../AdminNav";

export default async function CategoriesListPage() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("portfolio_categories")
    .select("id, slug, name")
    .order("name");

  return (
    <main>
      <AdminNav active="/admin/categories" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Portfolio categories</h1>
        <Link
          href="/admin/categories/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          + New category
        </Link>
      </div>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {(rows ?? []).map((r) => (
          <li key={r.id}>
            <Link
              href={`/admin/categories/${r.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
            >
              <span className="font-medium">{r.name}</span>
              <span className="text-sm text-zinc-500">{r.slug}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
