"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteArticle, duplicateArticle, saveArticle } from "../actions/cms";
import { DuplicateButton } from "./DuplicateButton";
import { ImageField } from "./ImageField";

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  post_summary: string | null;
  post_body: string | null;
  main_image: string | null;
  thumbnail_image: string | null;
  category_slug: string | null;
  author_slug: string | null;
  featured: boolean;
  draft: boolean;
  archived: boolean;
};

export function ArticleForm({ item }: { item?: ArticleRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState(item?.main_image ?? "");
  const [thumbImage, setThumbImage] = useState(item?.thumbnail_image ?? "");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("main_image", mainImage);
    fd.set("thumbnail_image", thumbImage);

    startTransition(async () => {
      try {
        const { id } = await saveArticle(fd);
        router.push(`/admin/articles/${id}`);
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
          <label className="block text-sm font-medium">Title *</label>
          <input
            name="title"
            defaultValue={item?.title}
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
          <label className="block text-sm font-medium">Category slug</label>
          <input
            name="category_slug"
            defaultValue={item?.category_slug ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Author slug</label>
          <input
            name="author_slug"
            defaultValue={item?.author_slug ?? ""}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <ImageField label="Featured image" name="main_image" value={mainImage} onChange={setMainImage} />
      <ImageField label="Thumbnail" name="thumbnail_image" value={thumbImage} onChange={setThumbImage} />

      <div>
        <label className="block text-sm font-medium">Summary</label>
        <textarea
          name="post_summary"
          rows={3}
          defaultValue={item?.post_summary ?? ""}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Body (HTML)</label>
        <textarea
          name="post_body"
          rows={14}
          defaultValue={item?.post_body ?? ""}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={item?.featured} />
          Featured
        </label>
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
              duplicate={() => duplicateArticle(item.id)}
              redirectTo={(id) => `/admin/articles/${id}`}
            />
            <button
              type="button"
              disabled={pending}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
              onClick={() => {
                if (!confirm("Delete this article?")) return;
                startTransition(async () => {
                  await deleteArticle(item.id);
                  router.push("/admin/articles");
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
