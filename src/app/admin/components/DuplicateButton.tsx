"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  label?: string;
  duplicate: () => Promise<{ id: string }>;
  redirectTo: (id: string) => string;
};

export function DuplicateButton({ label = "Duplicate", duplicate, redirectTo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
      onClick={() => {
        startTransition(async () => {
          const { id } = await duplicate();
          router.push(redirectTo(id));
          router.refresh();
        });
      }}
    >
      {pending ? "Duplicating…" : label}
    </button>
  );
}
