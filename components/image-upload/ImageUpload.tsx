"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png"];

interface Props {
  disabled?: boolean;
  onSubmit: (file: File) => void;
}

export default function ImageUpload({ disabled, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return setPreviewUrl(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(f: File | undefined) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setError("Please choose a JPG or PNG image.");
    if (f.size > MAX_BYTES) return setError("Image is larger than 10 MB.");
    setError(null);
    setFile(f);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0]);
        }}
        className={`flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging ? "border-teal-500 bg-teal-50 dark:bg-teal-950" : "border-slate-300 dark:border-slate-700"
        }`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Selected fundus image" className="max-h-64 rounded-lg object-contain" />
        ) : (
          <p className="text-slate-600 dark:text-slate-400">Drag a fundus photograph here, or choose a file</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          {file ? "Choose a different image" : "Choose image"}
        </button>
        {file && <p className="mt-2 text-xs text-slate-500">{file.name}</p>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!file || disabled}
        onClick={() => file && onSubmit(file)}
        className="w-full rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "Analysing…" : "Analyse image"}
      </button>
    </div>
  );
}
