import type { PredictionResponse } from "@/types/prediction";

const AGREEMENT_TEXT: Record<string, string> = {
  high: "The five models agree closely on this image.",
  typical: "The five models show a typical level of disagreement.",
  low: "The five models disagree more than usual. Give this result less weight.",
};

export default function Report({ result, onReset }: { result: PredictionResponse; onReset: () => void }) {
  const a = result.assessment;

  return (
    <div className="space-y-6">
      {result.status === "ungradable" || !a ? (
        <section className="rounded-xl border border-amber-400 bg-amber-50 p-5 dark:bg-amber-950">
          <h2 className="text-lg font-semibold">Image could not be graded</h2>
          <p className="mt-1 text-sm">{result.message ?? "The image is not suitable for analysis."}</p>
          <p className="mt-2 text-sm">Please retake the photograph and try again.</p>
        </section>
      ) : (
        <>
          <section
            className={`rounded-xl border p-5 ${
              a.referable
                ? "border-red-400 bg-red-50 dark:bg-red-950"
                : "border-emerald-400 bg-emerald-50 dark:bg-emerald-950"
            }`}
          >
            <p className="text-sm font-medium uppercase tracking-wide">Referral flag</p>
            <h2 className="mt-1 text-2xl font-bold">
              {a.referable ? "Referable DR indicated" : "Referable DR not indicated"}
            </h2>
            <p className="mt-2 text-sm">
              Severity estimate: <strong>Grade {a.grade} – {a.label}</strong>
            </p>
            {!a.referable && (
              <p className="mt-2 text-sm">
                This does not rule out disease. The model under-detects some moderate cases, especially on
                images unlike its training data.
              </p>
            )}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
              <h3 className="font-semibold">Model agreement</h3>
              <p className="mt-1 text-sm">
                {a.model_agreement ? AGREEMENT_TEXT[a.model_agreement] : "Not available."}
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-600 dark:text-slate-400">
                <dt>Raw score</dt>
                <dd>{a.score.toFixed(2)}</dd>
                <dt>Fold spread</dt>
                <dd>{a.uncertainty?.toFixed(3) ?? "–"}</dd>
              </dl>
              {a.details.fold_scores && (
                <p className="mt-2 text-xs text-slate-500">
                  Individual scores: {a.details.fold_scores.map((s) => s.toFixed(2)).join(", ")}
                </p>
              )}
            </div>

            {result.preprocessed_preview && (
              <div className="rounded-xl border border-slate-300 p-4 dark:border-slate-700">
                <h3 className="font-semibold">Image as analysed</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.preprocessed_preview}
                  alt="Cropped and padded image used by the model"
                  className="mt-2 w-full max-w-60 rounded-lg"
                />
                <p className="mt-1 text-xs text-slate-500">Cropped and padded to a square before scoring.</p>
              </div>
            )}
          </section>
        </>
      )}

      <section className="rounded-xl border border-slate-300 p-4 text-sm dark:border-slate-700">
        <h3 className="font-semibold">Model information</h3>
        <p className="mt-1">
          {result.model.name} · version {result.model.version}
        </p>
        <p className="text-xs text-slate-500">
          {result.prediction_id} · {new Date(result.created_at).toLocaleString()} · {result.processing_time_ms} ms
        </p>
        <h4 className="mt-3 font-medium">Limitations</h4>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {result.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <p className="rounded-lg bg-slate-100 p-3 text-sm font-medium dark:bg-slate-800">{result.disclaimer}</p>

      <button
        onClick={onReset}
        className="w-full rounded-lg border border-slate-300 px-4 py-3 font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
      >
        Analyse another image
      </button>
    </div>
  );
}
