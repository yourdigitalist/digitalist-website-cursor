"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const err = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setMessage("Could not sign in. Is Supabase configured?");
    } finally {
      setPending(false);
    }
  }

  return (
    <main>
      <h1 className="text-2xl font-semibold">Admin sign in</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Email and password (Supabase Auth). Your email must be in the{" "}
        <code className="rounded bg-zinc-200 px-1">admin_allowlist</code> table
        to use the dashboard after you sign in.
      </p>
      <p className="mt-2 text-sm text-zinc-600">
        First time: create the user in Supabase →{" "}
        <strong>Authentication → Users → Add user</strong> (set email + password,
        or send invite and set a password).
      </p>
      {err === "config" && (
        <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          Supabase is not configured. Add{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code>.env.local</code>, then restart <code>npm run dev</code>.
        </p>
      )}
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
            placeholder="marina@yourdigitalist.com"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-base"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {message && (
        <p className="mt-4 text-sm text-red-700" role="alert">
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
