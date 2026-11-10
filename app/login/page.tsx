"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IconAlertOctagon, IconAperture, IconEye, IconEyeOff, IconInfo } from "@/components/common/Icons";
import ThemeToggle from "@/components/common/ThemeToggle";
import { getUser, hasSession, login, takeNotice } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (hasSession()) router.replace(getUser()?.can_admin ? "/admin" : "/");
    else setNotice(takeNotice());
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(username.trim(), password);
      router.replace(user.can_admin ? "/admin" : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded border border-line-strong bg-card px-3 py-2.5 text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-10">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <div role="note" className="flex gap-3 rounded-lg border border-warn-line bg-warn-bg p-3 text-warn-fg">
        <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="text-xs leading-5">
          <p className="font-semibold uppercase tracking-wider">Investigational device notice</p>
          <p>Research prototype access only. Not for patient use or definitive clinical diagnosis.</p>
        </div>
      </div>

      <section className="rounded-lg border border-line bg-card p-6 shadow-card sm:p-8">
        <header className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-on">
            <IconAperture className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Retina DR Screening</h1>
          <p className="mt-1 text-sm text-muted">Sign in to continue</p>
        </header>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {notice && !error && (
            <p role="status" className="flex gap-3 rounded border border-warn-line bg-warn-bg p-3 text-sm text-warn-fg">
              <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
              {notice}
            </p>
          )}
          {error && (
            <div
              role="alert"
              className="flex gap-3 rounded border border-alert-line bg-alert-bg p-3 text-sm text-alert-fg"
            >
              <IconAlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">Sign-in failed</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <label className="block text-sm font-semibold">
            Username
            <input
              className={`${field} mt-1.5 font-mono text-sm font-normal`}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm font-semibold">
            Password
            <span className="relative mt-1.5 block">
              <input
                className={`${field} pr-11 font-normal`}
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
              >
                {showPw ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          <p className="rounded border border-line bg-subtle p-3 text-xs leading-5 text-muted">
            <strong className="font-semibold text-ink">Security policy:</strong> 5 consecutive failed attempts lock
            sign-in for that account for 15 minutes.
          </p>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-primary px-4 py-3 font-semibold text-primary-on transition hover:bg-primary-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
