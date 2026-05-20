"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTestimonial, duplicateTestimonial, saveTestimonial } from "../actions/cms";
import { DuplicateButton } from "./DuplicateButton";
import { ImageField } from "./ImageField";

export type TestimonialRow = {
  id: string;
  slug: string;
  display_name: string;
  quote: string;
  logo_url: string;
  sort_order: number;
  draft: boolean;
  archived: boolean;
};

export function TestimonialForm({ item }: { item?: TestimonialRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState(item?.logo_url ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("logo_url", logoUrl);

    startTransition(async () => {
      try {
        const { id } = await saveTestimonial(fd);
        router.push(`/admin/testimonials/${id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {item?.id ? <input type="hidden" name="id" value={item.id} /> : null}
      {error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Name *</label>
          <input
            name="display_name"
            defaultValue={item?.display_name}
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Slug</label>
          <input
            name="slug"
            defaultValue={item?.slug}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Sort order</label>
          <input
            name="sort_order"
            type="number"
            defaultValue={item?.sort_order ?? 0}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <ImageField label="Client logo *" name="logo_url" value={logoUrl} onChange={setLogoUrl} />

      <div>
        <label className="block text-sm font-medium">Quote *</label>
        <textarea
          name="quote"
          rows={4}
          defaultValue={item?.quote}
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="draft" defaultChecked={item?.draft} />
          Draft
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="archived" defaultChecked={item?.archived} />
          Archived
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {item?.id ? (
          <>
            <DuplicateButton
              duplicate={() => duplicateTestimonial(item.id)}
              redirectTo={(id) => `/admin/testimonials/${id}`}
            />
            <button
              type="button"
              disabled={pending}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
              onClick={() => {
                if (!confirm("Delete this testimonial?")) return;
                startTransition(async () => {
                  await deleteTestimonial(item.id);
                  router.push("/admin/testimonials");
                  router.refresh();
                });
              }}
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}
