"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCategory, saveCategory } from "../actions/cms";

export type CategoryRow = { id: string; slug: string; name: string };

export function CategoryForm({ item }: { item?: CategoryRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const { id } = await saveCategory(fd);
        router.push(`/admin/categories/${id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      {item?.id ? <input type="hidden" name="id" value={item.id} /> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div>
        <label className="block text-sm font-medium">Name *</label>
        <input
          name="name"
          defaultValue={item?.name}
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
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Save
        </button>
        {item?.id ? (
          <button
            type="button"
            disabled={pending}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
            onClick={() => {
              if (!confirm("Delete category?")) return;
              startTransition(async () => {
                await deleteCategory(item.id);
                router.push("/admin/categories");
                router.refresh();
              });
            }}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
