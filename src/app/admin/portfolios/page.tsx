import { requireAdmin } from "@/lib/admin/require-admin";
import Link from "next/link";
import { AdminNav } from "../AdminNav";

export default async function PortfoliosListPage() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("portfolios")
    .select("id, slug, name, main_image, featured, draft, archived")
    .order("updated_at", { ascending: false });

  return (
    <main>
      <AdminNav active="/admin/portfolios" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Portfolios</h1>
        <Link
          href="/admin/portfolios/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          + New project
        </Link>
      </div>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {(rows ?? []).map((r) => (
          <li key={r.id}>
            <Link
              href={`/admin/portfolios/${r.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50"
            >
              {r.main_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.main_image}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-14 w-20 shrink-0 rounded bg-zinc-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name}</p>
                <p className="truncate text-sm text-zinc-500">{r.slug}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1 text-xs">
                {r.featured ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                    Featured
                  </span>
                ) : null}
                {r.draft ? (
                  <span className="rounded bg-zinc-200 px-2 py-0.5">Draft</span>
                ) : null}
                {r.archived ? (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">
                    Archived
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
