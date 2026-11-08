"use client";

import { useState } from "react";

import ImageUpload from "@/components/image-upload/ImageUpload";
import Report from "@/components/report/Report";
import { analyzeImage } from "@/services/prediction";
import type { PredictionResponse } from "@/types/prediction";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  async function run(file: File) {
    setLoading(true);
    setError(null);
    try {
      setResult(await analyzeImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Diabetic retinopathy screening</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Research prototype. Not a medical device and not a diagnosis.
        </p>
      </header>

      {result ? (
        <Report result={result} onReset={() => setResult(null)} />
      ) : (
        <>
          <ImageUpload disabled={loading} onSubmit={run} />
          {error && (
            <p role="alert" className="rounded-lg border border-red-400 bg-red-50 p-3 text-sm dark:bg-red-950">
              {error}
            </p>
          )}
        </>
      )}
    </main>
  );
}
