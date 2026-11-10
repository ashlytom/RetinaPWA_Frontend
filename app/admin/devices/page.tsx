"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/admin/dialogs";
import { card, ErrorBanner, fmt, PageTitle, shortAgent, useAdminData } from "@/components/admin/shared";
import { btnDanger, btnGhost } from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { listDevices, restoreDevice, revokeDevice, type AdminDevice } from "@/services/admin";

export default function DevicesPage() {
  const devices = useAdminData(listDevices);
  const [target, setTarget] = useState<AdminDevice | null>(null);

  return (
    <>
      <PageTitle title="Devices" />
      <ErrorBanner message={devices.error} />
      <ul className="space-y-3">
        {devices.data?.length === 0 && <li className="text-sm text-muted">No devices registered yet.</li>}
        {(devices.data ?? []).map((d) => (
          <li key={d.id} className={card}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">{d.username}</span>
              <span className="font-mono text-xs text-muted">#{d.device_id_short}</span>
              <StatusBadge tone={d.revoked_at ? "alert" : "ok"}>{d.revoked_at ? "Revoked" : "Allowed"}</StatusBadge>
              {d.is_current_session && <span className="text-xs text-ok-fg">● In use now</span>}
            </div>
            <p className="mt-1 text-sm">{shortAgent(d.user_agent)}</p>
            <dl className="mt-1 grid gap-x-6 gap-y-1 font-mono text-xs text-muted sm:grid-cols-3">
              <div>First seen: <span className="text-ink">{fmt(d.first_seen_at)}</span></div>
              <div>Last seen: <span className="text-ink">{fmt(d.last_seen_at)}</span></div>
              <div>Last IP: <span className="text-ink">{d.last_ip || "–"}</span></div>
            </dl>
            <div className="mt-3">
              {d.revoked_at ? (
                <button className={btnGhost} onClick={() => void devices.act(() => restoreDevice(d.id)).catch((e) => devices.setError(e.message))}>
                  Restore access
                </button>
              ) : (
                <button className={btnDanger} onClick={() => setTarget(d)}>Revoke device</button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {target && (
        <ConfirmDialog
          title="Revoke this device?"
          body={`It will be signed out and blocked from signing in again. This frees one of ${target.username}'s device slots.`}
          action="Revoke device"
          onClose={() => setTarget(null)}
          onConfirm={() => devices.act(() => revokeDevice(target.id))}
        />
      )}
    </>
  );
}
