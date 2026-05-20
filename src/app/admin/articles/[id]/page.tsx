import { requireAdmin } from "@/lib/admin/require-admin";
import { notFound } from "next/navigation";
import { AdminNav } from "../../AdminNav";
import { ArticleForm } from "../../components/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: item } = await supabase.from("articles").select("*").eq("id", id).single();
  if (!item) notFound();

  return (
    <main>
      <AdminNav active="/admin/articles" />
      <h1 className="mb-6 text-2xl font-semibold">Edit: {item.title}</h1>
      <ArticleForm item={item} />
    </main>
  );
}
