"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { IconAlertOctagon } from "@/components/common/Icons";
import { AuthError } from "@/services/api";

export const card = "rounded-lg border border-line bg-card p-4 shadow-card";
export const fmt = (s: string | null) => (s ? new Date(s).toLocaleString() : "–");

export const REASONS: Record<string, string> = {
  bad_credentials: "Wrong username or password",
  locked_out: "Locked out (too many failures)",
  account_disabled: "Account disabled",
  device_revoked: "Device revoked",
  device_limit: "Device limit reached",
  replaced_previous_session: "Signed in; ended the previous session",
};

export function shortAgent(ua: string) {
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return ua ? `${browser}${os ? ` on ${os}` : ""}` : "Unknown";
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-alert-line bg-alert-bg p-3 text-sm text-alert-fg">
      <IconAlertOctagon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {children}
    </div>
  );
}

/** Load data for an admin page. A lapsed session sends the user to the login page. */
export function useAdminData<T>(fetcher: () => Promise<T>, key: unknown = null) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const handle = useCallback(
    (e: unknown) => {
      if (e instanceof AuthError) return router.replace("/login");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    },
    [router],
  );

  const reload = useCallback(async () => {
    try {
      setError(null);
      setData(await fetchRef.current());
    } catch (e) {
      handle(e);
    }
  }, [handle]);

  useEffect(() => {
    void reload();
  }, [reload, key]);

  /** Run a change, then refresh. Rethrows so a dialog can show the error inline. */
  async function act<R>(fn: () => Promise<R>): Promise<R> {
    setBusy(true);
    setError(null);
    try {
      const out = await fn();
      await reload();
      return out;
    } catch (e) {
      if (e instanceof AuthError) router.replace("/login");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  return { data, error, setError, reload, busy, act, handle };
}
