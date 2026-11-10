"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IconAperture, IconAlertOctagon, IconCheck, IconInfo, IconLogOut } from "@/components/common/Icons";
import ThemeToggle from "@/components/common/ThemeToggle";
import ImageUpload from "@/components/image-upload/ImageUpload";
import Report from "@/components/report/Report";
import { AuthError } from "@/services/api";
import { can, getUser, hasSession, logout, type SessionUser } from "@/services/auth";
import { refreshMe } from "@/services/me";
import { analyzeImage } from "@/services/prediction";
import type { PredictionResponse } from "@/types/prediction";

const STEPS = [
  { n: 1, title: "Upload", sub: "Fundus photograph" },
  { n: 2, title: "Analyse", sub: "Five-model ensemble" },
  { n: 3, title: "Report", sub: "Referral assessment" },
];

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  useEffect(() => {
    if (!hasSession()) return void router.replace("/login");
    const apply = (u: SessionUser | null) => {
      setUser(u);
      // Someone who can administer but not screen belongs in the admin console.
      if (u && !can(u, "screening:use") && u.can_admin) return void router.replace("/admin");
      setReady(true);
    };
    const cached = getUser();
    if (cached) apply(cached);
    // Pick up any role changes made since sign-in (and fill in a missing or outdated saved user).
    refreshMe()
      .then((u) => (u ? apply(u) : cached ? undefined : router.replace("/login")))
      .catch(() => router.replace("/login"));
  }, [router]);

  async function signOut() {
    await logout();
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

  const step = result ? 3 : loading ? 2 : 1;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-on">
            <IconAperture className="h-5 w-5" />
          </span>
          <span className="font-semibold tracking-tight">Retina DR Screening</span>
          <span className="hidden rounded border border-warn-line bg-warn-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warn-fg sm:inline">
            Research prototype · not a medical device
          </span>
          <div className="ml-auto flex items-center gap-2">
            {user && <span className="hidden font-mono text-xs text-muted md:inline">{user.username}</span>}
            {user?.can_admin && (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center rounded border border-line-strong bg-card px-3 text-sm font-medium hover:bg-subtle"
              >
                Admin console
              </Link>
            )}
            <ThemeToggle />
            <button
              onClick={signOut}
              className="inline-flex h-9 items-center gap-1.5 rounded border border-line-strong bg-card px-3 text-sm font-medium hover:bg-subtle"
            >
              <IconLogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sr-only sm:hidden">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
        <div role="note" className="flex gap-3 rounded-lg border border-warn-line bg-warn-bg p-3 text-warn-fg print:hidden">
          <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs leading-5">
            <strong className="font-semibold uppercase tracking-wider">Research prototype.</strong> For investigational
            evaluation only. Not a medical device and not a clinical diagnosis. Results need review by a qualified
            clinician.
          </p>
        </div>

        <nav aria-label="Progress" className="print:hidden">
          <ol className="grid grid-cols-3 gap-2">
            {STEPS.map((s) => {
              const active = s.n === step;
              const done = s.n < step;
              return (
                <li
                  key={s.n}
                  aria-current={active ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 sm:p-3 ${
                    active ? "border-primary bg-subtle" : "border-line bg-card"
                  } ${!active && !done ? "opacity-60" : ""}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      active || done ? "bg-primary text-primary-on" : "bg-subtle text-muted"
                    }`}
                  >
                    {done ? <IconCheck className="h-4 w-4" /> : s.n}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{s.title}</span>
                    <span className="hidden truncate font-mono text-[11px] text-muted sm:block">{s.sub}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        {!can(user, "screening:use") ? (
          <section role="alert" className="rounded-lg border border-warn-line bg-warn-bg p-5 text-warn-fg">
            <h1 className="text-lg font-semibold">No access to screening</h1>
            <p className="mt-1 text-sm">Your account does not have permission to use the screening tool. Ask an administrator to assign you a role that includes it.</p>
          </section>
        ) : result ? (
          <Report result={result} onReset={() => setResult(null)} />
        ) : (
          <>
            <ImageUpload disabled={loading} onSubmit={run} />
            {error && (
              <div role="alert" className="flex gap-3 rounded-lg border border-alert-line bg-alert-bg p-3 text-sm text-alert-fg">
                <IconAlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
