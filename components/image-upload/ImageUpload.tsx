"use client";

import { useEffect, useRef, useState } from "react";

import { IconAlertTriangle, IconCamera, IconImagePlus, IconInfo } from "@/components/common/Icons";

import CameraCapture from "./CameraCapture";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png"];

const GUIDANCE = [
  { title: "Field & centring", text: "Macula- or optic-disc-centred, with the fovea and optic disc boundary visible." },
  { title: "Focus & illumination", text: "Sharp vessels and even lighting. Blur or strong flash artefacts can make an image ungradable." },
  { title: "Clear media", text: "Cataract, corneal scars or eyelash shadows covering much of the field reduce reliability." },
];

interface Props {
  disabled?: boolean;
  onSubmit: (file: File) => void;
}

function formatSize(b: number) {
  return b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

export default function ImageUpload({ disabled, onSubmit }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dims, setDims] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [canStream, setCanStream] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nativeCamRef = useRef<HTMLInputElement>(null);

  // Live preview needs getUserMedia (HTTPS or localhost). Otherwise fall back to the device's own camera app.
  useEffect(() => {
    setCanStream(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  useEffect(() => {
    setDims(null);
    if (!file) return setPreviewUrl(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => setDims(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function choose(f: File | undefined) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) return setError("Please choose a JPG or PNG image.");
    if (f.size > MAX_BYTES) return setError("Image is larger than 10 MB.");
    setError(null);
    setFile(f);
  }

  function reset() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Select a fundus photograph</h1>
        <p className="mt-1 text-sm text-muted">
          Upload a colour retinal photograph for automated diabetic retinopathy screening.
        </p>

        {cameraOpen ? (
          <CameraCapture
            onClose={() => setCameraOpen(false)}
            onCapture={(f) => {
              setCameraOpen(false);
              choose(f);
            }}
          />
        ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) choose(e.dataTransfer.files[0]);
          }}
          className={`mt-5 flex min-h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition ${
            dragging ? "border-primary bg-subtle" : "border-line-strong"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-subtle text-primary-ink">
            <IconImagePlus className="h-6 w-6" />
          </span>
          <p className="mt-3 text-base">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="font-semibold text-primary-ink underline underline-offset-2 disabled:opacity-50"
            >
              {file ? "Choose a different file" : "Choose a fundus file"}
            </button>{" "}
            <span className="text-muted">or drag and drop here</span>
          </p>
          <p className="mt-1 text-xs text-muted">JPG or PNG, up to 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <input
            ref={nativeCamRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <div className="my-4 flex w-full max-w-xs items-center gap-3 text-xs uppercase tracking-wider text-muted" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            onClick={() => (canStream ? setCameraOpen(true) : nativeCamRef.current?.click())}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded border border-line-strong bg-card px-4 py-2.5 text-sm font-semibold hover:bg-subtle disabled:opacity-50"
          >
            <IconCamera className="h-4 w-4" />
            Take a photo with the camera
          </button>
        </div>
        )}

        {error && (
          <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-alert-fg">
            <IconAlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {file && previewUrl && (
          <div className="mt-5 rounded-lg border border-line bg-subtle p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Selected image</h2>
              <button type="button" onClick={reset} disabled={disabled} className="font-mono text-xs text-alert-fg underline disabled:opacity-50">
                Remove
              </button>
            </div>
            <div className="mt-3 flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Selected fundus image" className="h-28 w-28 shrink-0 rounded border border-line object-cover" />
              <dl className="grid min-w-0 flex-1 grid-cols-2 content-start gap-2 text-xs">
                <div className="col-span-2 min-w-0">
                  <dt className="uppercase tracking-wider text-muted">File</dt>
                  <dd className="truncate font-mono text-sm">{file.name}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider text-muted">Size</dt>
                  <dd className="font-mono text-sm">{formatSize(file.size)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider text-muted">Resolution</dt>
                  <dd className="font-mono text-sm">{dims ?? "…"}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-start gap-2 text-xs text-muted">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Only JPG and PNG are accepted. Other formats (for example DICOM or TIFF) and files over 10 MB are rejected.</p>
        </div>

        <button
          type="button"
          disabled={!file || disabled}
          onClick={() => file && onSubmit(file)}
          className="mt-5 w-full rounded bg-primary px-4 py-3 font-semibold text-primary-on transition hover:bg-primary-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
        >
          {disabled ? "Analysing…" : "Analyse image"}
        </button>
      </section>

      <section className="rounded-lg border border-line bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">Photograph requirements</h2>
        <p className="mt-1 text-sm text-muted">Image quality strongly affects reliability.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {GUIDANCE.map((g) => (
            <div key={g.title} className="rounded-lg border border-line bg-subtle p-4">
              <h3 className="text-sm font-semibold">{g.title}</h3>
              <p className="mt-1 text-sm leading-5 text-muted">{g.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
