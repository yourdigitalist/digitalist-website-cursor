import { requireAdmin } from "@/lib/admin/require-admin";
import { notFound } from "next/navigation";
import { AdminNav } from "../../AdminNav";
import { TestimonialForm } from "../../components/TestimonialForm";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: item } = await supabase.from("testimonials").select("*").eq("id", id).single();
  if (!item) notFound();

  return (
    <main>
      <AdminNav active="/admin/testimonials" />
      <h1 className="mb-6 text-2xl font-semibold">Edit testimonial</h1>
      <TestimonialForm item={item} />
    </main>
  );
}
