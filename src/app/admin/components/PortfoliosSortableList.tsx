"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { reorderPortfolios } from "../actions/cms";

export type PortfolioListItem = {
  id: string;
  slug: string;
  name: string;
  main_image: string | null;
  featured: boolean;
  draft: boolean;
  archived: boolean;
  sort_order: number;
};

export function PortfoliosSortableList({ items: initial }: { items: PortfolioListItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  function handleDrop(dropIndex: number) {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      return;
    }

    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, moved);
    setItems(next);
    setDragIndex(null);

    startTransition(async () => {
      setError(null);
      try {
        await reorderPortfolios(next.map((item) => item.id));
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save order");
        setItems(initial);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-500">
        Drag the handle to reorder. Top items appear first on the portfolio page.
        {pending ? " Saving…" : null}
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {items.map((r, index) => (
          <li
            key={r.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(index);
            }}
            className={`flex items-center gap-2 ${dragIndex === index ? "opacity-50" : ""}`}
          >
            <button
              type="button"
              draggable
              aria-label={`Drag to reorder ${r.name}`}
              className="cursor-grab px-3 py-3 text-zinc-400 active:cursor-grabbing"
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
            >
              ⠿
            </button>
            <Link
              href={`/admin/portfolios/${r.id}`}
              className="flex min-w-0 flex-1 items-center gap-4 py-3 pr-4 hover:bg-zinc-50"
            >
              {r.main_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.main_image}
                  alt=""
                  className="h-14 w-20 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-14 w-20 shrink-0 rounded bg-zinc-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name}</p>
                <p className="truncate text-sm text-zinc-500">{r.slug}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1 text-xs">
                {r.featured ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">
                    Featured
                  </span>
                ) : null}
                {r.draft ? (
                  <span className="rounded bg-zinc-200 px-2 py-0.5">Draft</span>
                ) : null}
                {r.archived ? (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">
                    Archived
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
