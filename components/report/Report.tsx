import { IconAlertOctagon, IconAlertTriangle, IconCheck, IconInfo, IconPrinter, IconRefresh } from "@/components/common/Icons";
import StatusBadge, { CodeTag, type Tone } from "@/components/ui/StatusBadge";
import type { Assessment, PredictionResponse } from "@/types/prediction";

const AGREEMENT: Record<string, { tone: Tone; badge: string; text: string }> = {
  high: { tone: "ok", badge: "High agreement", text: "The five models agree closely on this image." },
  typical: { tone: "ok", badge: "Typical agreement", text: "The five models show a typical level of disagreement." },
  low: { tone: "warn", badge: "Low agreement", text: "The five models disagree more than usual. Give this result less weight." },
};

const GRADE_LABELS = ["None", "Mild", "Moderate", "Severe", "PDR"];
const card = "rounded-lg border border-line bg-card p-5 shadow-card";

/** Five-segment severity scale. Colour is paired with the numeric label, never used alone. */
function SeverityScale({ grade }: { grade: number }) {
  const seg = (i: number) => (i <= 1 ? "bg-ok" : i === 2 ? "bg-warn" : "bg-alert");
  return (
    <div role="img" aria-label={`Severity grade ${grade} of 4`} className="rounded-lg border border-line bg-card p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted">
        <span>Severity scale</span>
        <span className="font-mono font-semibold text-ink">Grade {grade} of 4</span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {GRADE_LABELS.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-sm ${i <= grade ? seg(i) : "bg-line"} ${i === grade ? "ring-2 ring-ink/30 ring-offset-1 ring-offset-card" : ""}`}
          />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-5 gap-1 text-center font-mono text-[10px] text-muted">
        {GRADE_LABELS.map((l, i) => (
          <span key={l} className={i === grade ? "font-semibold text-ink" : ""}>
            {i}
          </span>
        ))}
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] uppercase tracking-wider text-muted">
        <span>{GRADE_LABELS[0]}</span>
        <span>{GRADE_LABELS[4]}</span>
      </div>
    </div>
  );
}

/** One bar per fold model on the 0-4 grading axis, with threshold ticks. */
function FoldBars({ scores, thresholds }: { scores: number[]; thresholds?: number[] }) {
  const cutoff = thresholds?.[1]; // grade >= 2 (referable) boundary
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / 4) * 100))}%`;
  return (
    <div className="space-y-2.5">
      {scores.map((s, i) => {
        const refer = cutoff !== undefined && s >= cutoff;
        return (
          <div key={i} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2 font-mono text-xs">
            <span className="text-muted">Model {i + 1}</span>
            <div
              className="relative h-1.5 rounded-full bg-line"
              role="img"
              aria-label={`Model ${i + 1} score ${s.toFixed(2)}${refer ? ", above referral cutoff" : ""}`}
            >
              <div className={`h-full rounded-full ${refer ? "bg-alert" : "bg-ok"}`} style={{ width: pct(s) }} />
              {cutoff !== undefined && (
                <span className="absolute -top-1 h-3.5 w-0.5 bg-ink/60" style={{ left: pct(cutoff) }} aria-hidden />
              )}
            </div>
            <span className="text-right font-medium">{s.toFixed(2)}</span>
          </div>
        );
      })}
      {cutoff !== undefined && (
        <p className="flex items-center gap-2 pt-1 text-[11px] text-muted">
          <span className="inline-block h-3 w-0.5 bg-ink/60" aria-hidden />
          Referral cutoff {cutoff.toFixed(2)} (scale 0–4)
        </p>
      )}
    </div>
  );
}

function Verdict({ a }: { a: Assessment }) {
  const referable = a.referable;
  const tone: Tone = referable ? "alert" : "ok";
  const box = referable ? "border-alert-line bg-alert-bg" : "border-ok-line bg-ok-bg";
  const fg = referable ? "text-alert-fg" : "text-ok-fg";
  const Icon = referable ? IconAlertOctagon : IconCheck;
  return (
    <section className={`rounded-lg border p-5 sm:p-6 ${box}`} aria-labelledby="verdict">
      <div className="grid gap-5 md:grid-cols-[1fr_16rem] md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={tone}>{referable ? "Referable DR indicated" : "Referable DR not indicated"}</StatusBadge>
            <CodeTag>DR-{a.grade}</CodeTag>
          </div>
          <h2 id="verdict" className={`mt-3 flex items-start gap-2 text-2xl font-semibold tracking-tight sm:text-3xl ${fg}`}>
            <Icon className="mt-1 h-7 w-7 shrink-0" />
            {referable ? "Referable diabetic retinopathy indicated" : "Referable diabetic retinopathy not indicated"}
          </h2>
          <p className="mt-2 text-sm text-ink">
            Severity estimate: <strong>Grade {a.grade} – {a.label}</strong>.{" "}
            {referable
              ? "Specialist assessment is recommended."
              : "Follow your screening protocol; this is not a clearance."}
          </p>
        </div>
        <SeverityScale grade={a.grade} />
      </div>
      <p className="mt-4 flex gap-2 rounded border border-line bg-card p-3 text-xs leading-5 text-ink">
        <IconAlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
        <span>
          <strong>Important:</strong> a result that is not referable does not rule out disease. The model under-detects
          some moderate cases, especially on images unlike its training data.
        </span>
      </p>
    </section>
  );
}

export default function Report({ result, onReset }: { result: PredictionResponse; onReset: () => void }) {
  const a = result.assessment;
  const ag = a?.model_agreement ? AGREEMENT[a.model_agreement] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Screening assessment</h1>
        <p className="font-mono text-xs text-muted">
          {result.prediction_id} · {(result.processing_time_ms / 1000).toFixed(2)} s
        </p>
      </div>

      {result.status === "ungradable" || !a ? (
        <section className="rounded-lg border border-warn-line bg-warn-bg p-5 text-warn-fg">
          <StatusBadge tone="warn">Ungradable image</StatusBadge>
          <h2 className="mt-3 flex items-center gap-2 text-xl font-semibold">
            <IconAlertTriangle className="h-6 w-6 shrink-0" />
            Image could not be graded
          </h2>
          <p className="mt-2 text-sm">{result.message ?? "The image is not suitable for analysis."}</p>
          <p className="mt-1 text-sm">Please retake the photograph and try again.</p>
        </section>
      ) : (
        <>
          <Verdict a={a} />

          <div className="grid gap-6 md:grid-cols-2">
            {result.preprocessed_preview && (
              <section className={card}>
                <h3 className="font-semibold">Image as analysed</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.preprocessed_preview}
                  alt="Cropped and padded image used by the model"
                  className="mt-3 w-full rounded border border-line"
                />
                <p className="mt-2 text-xs text-muted">Cropped and padded to a square before scoring.</p>
              </section>
            )}

            <section className={card}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">Model agreement &amp; spread</h3>
                {ag && <StatusBadge tone={ag.tone}>{ag.badge}</StatusBadge>}
              </div>
              {ag && <p className="mt-1 text-sm text-muted">{ag.text}</p>}

              <div className="mt-4 rounded-lg border border-line bg-subtle p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-muted">Mean raw score</span>
                  <span className="font-mono text-2xl font-medium">{a.score.toFixed(2)}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted">
                  Fold spread {a.uncertainty !== null ? `±${a.uncertainty.toFixed(3)}` : "–"}
                </p>
              </div>

              {a.details.fold_scores && (
                <div className="mt-4">
                  <h4 className="mb-2 text-[11px] uppercase tracking-wider text-muted">Five-fold ensemble</h4>
                  <FoldBars scores={a.details.fold_scores} thresholds={a.details.thresholds} />
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <section className={card}>
        <h3 className="font-semibold">Model information</h3>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-2">
          {[
            ["Model", result.model.name],
            ["Version", result.model.version],
            ["Prediction ID", result.prediction_id],
            ["Timestamp", new Date(result.created_at).toLocaleString()],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-line py-1.5">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <h3 className="flex items-center gap-2 font-semibold">
          <IconInfo className="h-4 w-4 text-primary-ink" />
          Algorithmic limitations
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-5 text-muted">
          {result.limitations.map((l) => (
            <li key={l} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" aria-hidden />
              {l}
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-lg border border-line bg-subtle p-3 text-sm font-medium">{result.disclaimer}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 rounded border border-line-strong bg-card px-4 py-3 font-semibold hover:bg-subtle"
        >
          <IconPrinter className="h-4 w-4" />
          Print summary
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 font-semibold text-primary-on hover:bg-primary-hover active:translate-y-px"
        >
          <IconRefresh className="h-4 w-4" />
          Analyse another image
        </button>
      </div>
    </div>
  );
}
