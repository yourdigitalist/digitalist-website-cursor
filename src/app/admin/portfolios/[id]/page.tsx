import { requireAdmin } from "@/lib/admin/require-admin";
import { notFound } from "next/navigation";
import { AdminNav } from "../../AdminNav";
import { PortfolioForm } from "../../components/PortfolioForm";

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from("portfolios").select("*").eq("id", id).single(),
    supabase.from("portfolio_categories").select("slug, name").order("name"),
  ]);

  if (!item) notFound();

  return (
    <main>
      <AdminNav active="/admin/portfolios" />
      <h1 className="mb-6 text-2xl font-semibold">Edit: {item.name}</h1>
      <PortfolioForm item={item} categories={categories ?? []} />
    </main>
  );
}
