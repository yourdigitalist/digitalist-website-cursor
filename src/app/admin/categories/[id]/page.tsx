import { requireAdmin } from "@/lib/admin/require-admin";
import { notFound } from "next/navigation";
import { AdminNav } from "../../AdminNav";
import { CategoryForm } from "../../components/CategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: item } = await supabase
    .from("portfolio_categories")
    .select("*")
    .eq("id", id)
    .single();
  if (!item) notFound();

  return (
    <main>
      <AdminNav active="/admin/categories" />
      <h1 className="mb-6 text-2xl font-semibold">Edit category</h1>
      <CategoryForm item={item} />
    </main>
  );
}
