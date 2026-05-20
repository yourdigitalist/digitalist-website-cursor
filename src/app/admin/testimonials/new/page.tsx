import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminNav } from "../../AdminNav";
import { TestimonialForm } from "../../components/TestimonialForm";

export default async function NewTestimonialPage() {
  await requireAdmin();
  return (
    <main>
      <AdminNav active="/admin/testimonials" />
      <h1 className="mb-6 text-2xl font-semibold">New testimonial</h1>
      <TestimonialForm />
    </main>
  );
}
