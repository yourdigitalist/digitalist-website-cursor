import Link from "next/link";

const links = [
  { href: "/admin/portfolios", label: "Portfolios" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/categories", label: "Categories" },
];

export function AdminNav({ active }: { active?: string }) {
  return (
    <nav className="mb-8 flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-4">
      <Link
        href="/admin"
        className={`rounded px-3 py-1.5 text-sm ${active === "home" ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-200"}`}
      >
        Dashboard
      </Link>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded px-3 py-1.5 text-sm ${active === l.href ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-200"}`}
        >
          {l.label}
        </Link>
      ))}
      <Link
        href="/index.html"
        className="ml-auto text-sm text-zinc-500 underline"
      >
        View site
      </Link>
    </nav>
  );
}
