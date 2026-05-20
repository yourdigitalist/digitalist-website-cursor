import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminNav } from "../../AdminNav";
import { CategoryForm } from "../../components/CategoryForm";

export default async function NewCategoryPage() {
  await requireAdmin();
  return (
    <main>
      <AdminNav active="/admin/categories" />
      <h1 className="mb-6 text-2xl font-semibold">New category</h1>
      <CategoryForm />
    </main>
  );
}
