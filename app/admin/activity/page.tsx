"use client";

import { useState } from "react";

import { ErrorBanner, fmt, PageTitle, REASONS, useAdminData } from "@/components/admin/shared";
import StatusBadge from "@/components/ui/StatusBadge";
import { listLogins } from "@/services/admin";

export default function ActivityPage() {
  const [failuresOnly, setFailuresOnly] = useState(false);
  const logins = useAdminData(() => listLogins(failuresOnly), failuresOnly);

  return (
    <>
      <PageTitle title="Login activity">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={failuresOnly} onChange={(e) => setFailuresOnly(e.target.checked)} />
          Failed attempts only
        </label>
      </PageTitle>
      <ErrorBanner message={logins.error} />
      <ul className="space-y-2">
        {logins.data?.length === 0 && <li className="text-sm text-muted">No activity yet.</li>}
        {(logins.data ?? []).map((e) => (
          <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line bg-card px-4 py-3 text-sm">
            <StatusBadge tone={e.success ? "ok" : "alert"}>{e.success ? "Success" : "Failed"}</StatusBadge>
            <span className="font-mono font-semibold">{e.username}</span>
            <span className="font-mono text-xs text-muted">{fmt(e.at)}</span>
            <span className="font-mono text-xs text-muted">{e.ip}</span>
            <span className="font-mono text-xs text-muted">#{e.device_id_short || "–"}</span>
            {e.reason && <span className="text-xs">{REASONS[e.reason] ?? e.reason}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
