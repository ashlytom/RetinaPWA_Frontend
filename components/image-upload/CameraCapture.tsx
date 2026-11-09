"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { IconAlertTriangle, IconCamera, IconRefresh, IconX } from "@/components/common/Icons";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type Facing = "environment" | "user";

function describeError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access was blocked. Allow camera permission for this site in your browser settings, then try again.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is in use by another app. Close it and try again.";
  return "The camera could not be started.";
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Live camera preview with a capture button. Produces a JPEG File and hands it to onCapture. */
export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<Facing>("environment");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canFlip, setCanFlip] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);
    stop();

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 2560 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => undefined);
        }
        setReady(true);
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1);
      } catch (e) {
        if (!cancelled) setError(describeError(e));
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, stop]);

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setError("Could not capture the image. Please try again.");
        stop();
        onCapture(new File([blob], `fundus-capture-${stamp()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-line bg-subtle">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <h2 className="text-sm font-semibold">Take a photograph</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close camera"
          className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-card hover:text-ink"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      {error ? (
        <div role="alert" className="flex gap-3 p-4 text-sm text-alert-fg">
          <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p>{error}</p>
            <button type="button" onClick={onClose} className="mt-2 font-semibold underline">
              Back to upload
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mx-auto aspect-[4/3] max-h-[60vh] w-full bg-black">
            <video ref={videoRef} playsInline muted autoPlay className="h-full w-full object-contain" />
            {ready && (
              <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="aspect-square h-[85%] rounded-full border-2 border-dashed border-white/60" />
              </div>
            )}
            {!ready && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">Starting camera…</p>
            )}
          </div>
          <p className="px-4 pt-3 text-xs text-muted">
            Centre the retina in the circle, keep the image sharp and evenly lit, then capture.
          </p>
          <div className="flex items-center justify-between gap-3 p-4">
            {canFlip ? (
              <button
                type="button"
                onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                className="inline-flex items-center gap-2 rounded border border-line-strong bg-card px-3 py-2.5 text-sm font-medium hover:bg-subtle"
              >
                <IconRefresh className="h-4 w-4" />
                Switch camera
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={capture}
              disabled={!ready}
              className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 font-semibold text-primary-on transition hover:bg-primary-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconCamera className="h-4 w-4" />
              Capture
            </button>
          </div>
        </>
      )}
    </div>
  );
}
