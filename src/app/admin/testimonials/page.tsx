import { requireAdmin } from "@/lib/admin/require-admin";
import Link from "next/link";
import { AdminNav } from "../AdminNav";

export default async function TestimonialsListPage() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("testimonials")
    .select("id, slug, display_name, logo_url, sort_order, draft")
    .order("sort_order", { ascending: true });

  return (
    <main>
      <AdminNav active="/admin/testimonials" />
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Testimonials</h1>
        <Link
          href="/admin/testimonials/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          + New testimonial
        </Link>
      </div>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {(rows ?? []).map((r) => (
          <li key={r.id}>
            <Link
              href={`/admin/testimonials/${r.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.logo_url} alt="" className="h-10 w-16 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.display_name}</p>
                <p className="text-xs text-zinc-500">Order: {r.sort_order}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
