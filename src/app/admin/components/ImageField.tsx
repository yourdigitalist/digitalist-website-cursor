"use client";

import { useRef, useState } from "react";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (url: string) => void;
};

export function ImageField({ label, name, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="max-h-40 rounded border border-zinc-200 object-contain"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-1 top-1 rounded bg-white/90 px-2 py-0.5 text-xs shadow"
          >
            Remove
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <input
          type="url"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or upload below"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload image"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
