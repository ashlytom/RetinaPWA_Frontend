"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ImageUpload from "@/components/image-upload/ImageUpload";
import Report from "@/components/report/Report";
import { AuthError } from "@/services/api";
import { clearSession, hasSession } from "@/services/auth";
import { analyzeImage } from "@/services/prediction";
import type { PredictionResponse } from "@/types/prediction";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    if (!hasSession()) router.replace("/login");
    else setReady(true);
  }, [router]);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  async function run(file: File) {
    setLoading(true);
    setError(null);
    try {
      setResult(await analyzeImage(file));
    } catch (e) {
      if (e instanceof AuthError) return router.replace("/login");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Diabetic retinopathy screening</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Research prototype. Not a medical device and not a diagnosis.
          </p>
        </div>
        <button onClick={signOut} className="shrink-0 text-sm underline">
          Sign out
        </button>
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
