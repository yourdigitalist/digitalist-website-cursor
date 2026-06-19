"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePortfolio, duplicatePortfolio, savePortfolio } from "../actions/cms";
import { DuplicateButton } from "./DuplicateButton";
import { GalleryImagesField } from "./GalleryImagesField";
import { ImageField } from "./ImageField";

export type PortfolioRow = {
  id: string;
  slug: string;
  name: string;
  client_name: string | null;
  client_industry: string | null;
  client_logo: string | null;
  post_summary: string | null;
  project_overview: string | null;
  main_image: string | null;
  thumbnail_image: string | null;
  project_images: string | null;
  category_slugs: string | null;
  featured: boolean;
  draft: boolean;
  archived: boolean;
};

type Category = { slug: string; name: string };

export function PortfolioForm({
  item,
  categories,
}: {
  item?: PortfolioRow;
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientLogo, setClientLogo] = useState(item?.client_logo ?? "");
  const [mainImage, setMainImage] = useState(item?.main_image ?? "");
  const [thumbImage, setThumbImage] = useState(item?.thumbnail_image ?? "");
  const selected = new Set(
    (item?.category_slugs || "")
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean),
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("client_logo", clientLogo);
    fd.set("main_image", mainImage);
    fd.set("thumbnail_image", thumbImage);
    const cats = categories
      .filter((c) => fd.get(`cat_${c.slug}`) === "on")
      .map((c) => c.slug);
    fd.set("category_slugs", cats.join("; "));

    startTransition(async () => {
      try {
        const { id } = await savePortfolio(fd);
        router.push(`/admin/portfolios/${id}`);
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
        <Field label="Project name *" name="name" defaultValue={item?.name} required />
        <Field label="URL slug" name="slug" defaultValue={item?.slug} placeholder="auto-from-name" />
        <Field label="Client name" name="client_name" defaultValue={item?.client_name ?? ""} />
        <Field label="Client industry" name="client_industry" defaultValue={item?.client_industry ?? ""} />
      </div>

      <ImageField label="Client logo" name="client_logo" value={clientLogo} onChange={setClientLogo} />
      <ImageField label="Main image" name="main_image" value={mainImage} onChange={setMainImage} />
      <ImageField label="Thumbnail" name="thumbnail_image" value={thumbImage} onChange={setThumbImage} />

      <GalleryImagesField name="project_images" defaultValue={item?.project_images} />

      <div>
        <label className="block text-sm font-medium text-zinc-700">Short summary</label>
        <textarea
          name="post_summary"
          rows={3}
          defaultValue={item?.post_summary ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">About this project (HTML)</label>
        <textarea
          name="project_overview"
          rows={10}
          defaultValue={item?.project_overview ?? ""}
          className="w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm"
        />
      </div>

      <fieldset className="rounded border border-zinc-200 p-4">
        <legend className="px-1 text-sm font-medium">Categories</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={`cat_${c.slug}`}
                defaultChecked={selected.has(c.slug)}
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="featured" defaultChecked={item?.featured} />
          Featured on home
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
              duplicate={() => duplicatePortfolio(item.id)}
              redirectTo={(id) => `/admin/portfolios/${id}`}
            />
            <button
              type="button"
              disabled={pending}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700"
              onClick={() => {
                if (!confirm("Delete this portfolio item?")) return;
                startTransition(async () => {
                  await deletePortfolio(item.id);
                  router.push("/admin/portfolios");
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

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
