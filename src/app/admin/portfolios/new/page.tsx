import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminNav } from "../../AdminNav";
import { PortfolioForm } from "../../components/PortfolioForm";

export default async function NewPortfolioPage() {
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase
    .from("portfolio_categories")
    .select("slug, name")
    .order("name");

  return (
    <main>
      <AdminNav active="/admin/portfolios" />
      <h1 className="mb-6 text-2xl font-semibold">New portfolio project</h1>
      <PortfolioForm categories={categories ?? []} />
    </main>
  );
}
