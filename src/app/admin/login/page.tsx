"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const supabase = createSupabaseBrowser();
      const redirectTo = `${window.location.origin}/admin`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      setStatus("sent");
      setMessage("Check your email for the login link.");
    } catch {
      setStatus("error");
      setMessage("Could not start sign-in. Is Supabase configured?");
    }
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold">Admin sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Magic link only. Your email must be in the{" "}
        <code className="rounded bg-zinc-200 px-1">admin_allowlist</code> table
        in Supabase (project <strong>exyqeotxncuzqeadreid</strong> only).
      </p>
      {err === "forbidden" && (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          You are signed in, but this account is not allowed for admin. Add
          your email in Supabase → Table Editor →{" "}
          <code>admin_allowlist</code>.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-base"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Email me a link"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-4 text-sm ${status === "error" ? "text-red-700" : "text-zinc-700"}`}
        >
          {message}
        </p>
      )}
      <p className="mt-8 text-sm">
        <Link href="/index.html" className="text-zinc-600 underline">
          ← Back to site
        </Link>
      </p>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-600">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}
