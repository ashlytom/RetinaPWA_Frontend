import { IconAlertTriangle } from "./Icons";

/** Persistent caution bar, fixed to the bottom of every screen. */
export default function SafetyBanner() {
  return (
    <div
      role="note"
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-9 items-center gap-2 bg-[var(--banner-bg)] px-4 py-1.5 text-[11px] font-medium leading-4 text-[var(--banner-fg)] print:hidden"
    >
      <IconAlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn" />
      <p>
        <strong className="font-semibold">CAUTION:</strong> Investigational screening tool. Does not diagnose or rule
        out diabetic retinopathy or other retinal disease. Clinical evaluation required.
      </p>
    </div>
  );
}
