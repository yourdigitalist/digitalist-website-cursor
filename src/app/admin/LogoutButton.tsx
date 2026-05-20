"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
      onClick={async () => {
        setPending(true);
        try {
          const supabase = createSupabaseBrowser();
          await supabase.auth.signOut();
        } finally {
          router.push("/admin/login");
          router.refresh();
        }
      }}
    >
      Sign out
    </button>
  );
}
