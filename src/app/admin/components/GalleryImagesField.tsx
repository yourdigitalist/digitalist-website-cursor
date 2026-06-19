"use client";

import { useRef, useState } from "react";

function parseUrls(raw: string | null | undefined): string[] {
  return (raw || "")
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type Props = {
  name: string;
  defaultValue?: string | null;
};

export function GalleryImagesField({ name, defaultValue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState(() => parseUrls(defaultValue));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUrls((prev) => [...prev, data.url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function addManualUrl() {
    const url = manualUrl.trim();
    if (!url) return;
    setUrls((prev) => [...prev, url]);
    setManualUrl("");
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-zinc-700">Gallery images</label>
        <p className="text-xs text-zinc-500">
          Upload multiple images or paste URLs. Shown full-width below the project description.
        </p>
      </div>

      <input type="hidden" name={name} value={urls.join("; ")} />

      {urls.length ? (
        <ul className="space-y-3">
          {urls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="flex items-start gap-3 rounded border border-zinc-200 bg-zinc-50 p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="max-h-28 w-40 shrink-0 rounded object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs text-zinc-600">{url}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() =>
                      setUrls((prev) => {
                        const next = [...prev];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        return next;
                      })
                    }
                    className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={i === urls.length - 1}
                    onClick={() =>
                      setUrls((prev) => {
                        const next = [...prev];
                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                        return next;
                      })
                    }
                    className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-xs disabled:opacity-40"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="rounded border border-red-200 bg-white px-2 py-0.5 text-xs text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">No gallery images yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          type="url"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="Paste image URL…"
          className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addManualUrl}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Add URL
        </button>
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
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (!files?.length) return;
          void (async () => {
            for (const file of Array.from(files)) {
              await uploadFile(file);
            }
          })();
          e.target.value = "";
        }}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
