import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminNav } from "../../AdminNav";
import { ArticleForm } from "../../components/ArticleForm";

export default async function NewArticlePage() {
  await requireAdmin();
  return (
    <main>
      <AdminNav active="/admin/articles" />
      <h1 className="mb-6 text-2xl font-semibold">New article</h1>
      <ArticleForm />
    </main>
  );
}
