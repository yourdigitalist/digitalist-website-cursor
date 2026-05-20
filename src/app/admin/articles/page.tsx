import { requireAdmin } from "@/lib/admin/require-admin";
import Link from "next/link";
import { AdminNav } from "../AdminNav";

export default async function ArticlesListPage() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("articles")
    .select("id, slug, title, main_image, draft, archived")
    .order("updated_at", { ascending: false });

  return (
    <main>
      <AdminNav active="/admin/articles" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <Link
          href="/admin/articles/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          + New article
        </Link>
      </div>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {(rows ?? []).map((r) => (
          <li key={r.id}>
            <Link
              href={`/admin/articles/${r.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50"
            >
              {r.main_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.main_image} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
              ) : (
                <div className="h-14 w-20 shrink-0 rounded bg-zinc-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="truncate text-sm text-zinc-500">{r.slug}</p>
              </div>
              {r.draft ? (
                <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs">Draft</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
