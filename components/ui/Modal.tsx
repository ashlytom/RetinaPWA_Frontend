"use client";

import { useEffect, type ReactNode } from "react";

import { IconX } from "@/components/common/Icons";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-line bg-card p-5 shadow-card"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-subtle hover:text-ink"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export const inputCls =
  "w-full rounded border border-line-strong bg-card px-3 py-2.5 text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";
export const btnPrimary =
  "rounded bg-primary px-4 py-2.5 font-semibold text-primary-on transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
export const btnGhost =
  "rounded border border-line-strong bg-card px-3 py-2 text-sm font-medium hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60";
export const btnDanger =
  "rounded border border-alert-line bg-alert-bg px-3 py-2 text-sm font-medium text-alert-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";
