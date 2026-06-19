import { requireAdmin } from "@/lib/admin/require-admin";
import Link from "next/link";
import { AdminNav } from "../AdminNav";
import { PortfoliosSortableList } from "../components/PortfoliosSortableList";

export default async function PortfoliosListPage() {
  const { supabase } = await requireAdmin();
  const { data: rows } = await supabase
    .from("portfolios")
    .select("id, slug, name, main_image, featured, draft, archived, sort_order")
    .order("sort_order", { ascending: true });

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
      <PortfoliosSortableList items={rows ?? []} />
    </main>
  );
}
