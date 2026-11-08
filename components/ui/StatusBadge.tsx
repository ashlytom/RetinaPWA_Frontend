import type { ReactNode } from "react";

export type Tone = "ok" | "warn" | "alert";

const TONE: Record<Tone, string> = {
  ok: "border-ok-line bg-ok-bg text-ok-fg",
  warn: "border-warn-line bg-warn-bg text-warn-fg",
  alert: "border-alert-line bg-alert-bg text-alert-fg",
};
const DOT: Record<Tone, string> = { ok: "bg-ok", warn: "bg-warn", alert: "bg-alert" };

export default function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${TONE[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} aria-hidden />
      {children}
    </span>
  );
}

export function CodeTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-ink">
      {children}
    </span>
  );
}
