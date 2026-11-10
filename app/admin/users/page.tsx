"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog, CreateUserDialog, LimitDialog, PasswordDialog, UserRolesDialog } from "@/components/admin/dialogs";
import { card, ErrorBanner, fmt, PageTitle, useAdminData } from "@/components/admin/shared";
import { btnDanger, btnGhost, btnPrimary } from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { createUser, forceLogout, listRoles, listUsers, setUserRoles, updateUser, type AdminUser } from "@/services/admin";
import { can, getUser, type SessionUser } from "@/services/auth";

type Dialog =
  | { kind: "create" }
  | { kind: "password" | "limit" | "roles"; user: AdminUser }
  | { kind: "confirm"; title: string; body: string; action: string; run: () => Promise<unknown> }
  | null;

export default function UsersPage() {
  const users = useAdminData(listUsers);
  const roles = useAdminData(listRoles);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  useEffect(() => setMe(getUser()), []);

  const canRoles = can(me, "roles:manage");
  const close = () => setDialog(null);
  const list = roles.data?.roles ?? [];

  return (
    <>
      <PageTitle title="Users">
        <button className={btnPrimary} onClick={() => setDialog({ kind: "create" })} disabled={!roles.data}>Add user</button>
      </PageTitle>
      <ErrorBanner message={users.error ?? roles.error} />

      <ul className="space-y-3">
        {(users.data ?? []).map((u) => (
          <li key={u.id} className={card}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">{u.username}</span>
              {u.id === me?.id && <span className="text-xs text-muted">(you)</span>}
              <StatusBadge tone={u.is_active ? "ok" : "alert"}>{u.is_active ? "Active" : "Disabled"}</StatusBadge>
              {u.roles.map((r) => (
                <span key={r} className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[11px]">{r}</span>
              ))}
              {u.has_active_session && <span className="text-xs text-ok-fg">● Signed in now</span>}
            </div>
            <dl className="mt-2 grid gap-x-6 gap-y-1 font-mono text-xs text-muted sm:grid-cols-3">
              <div>Devices: <span className="text-ink">{u.device_count} / {u.max_devices}</span></div>
              <div>Last sign-in: <span className="text-ink">{fmt(u.last_login_at)}</span></div>
              <div>Created: <span className="text-ink">{fmt(u.created_at)}</span></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {canRoles && <button className={btnGhost} onClick={() => setDialog({ kind: "roles", user: u })}>Roles</button>}
              {u.id !== me?.id && (
                <button
                  className={u.is_active ? btnDanger : btnGhost}
                  onClick={() =>
                    u.is_active
                      ? setDialog({ kind: "confirm", title: "Disable account?", body: `${u.username} will be signed out and unable to sign in until re-enabled.`, action: "Disable", run: () => updateUser(u.id, { is_active: false }) })
                      : void users.act(() => updateUser(u.id, { is_active: true })).catch(() => undefined)
                  }
                >
                  {u.is_active ? "Disable" : "Enable"}
                </button>
              )}
              <button
                className={btnGhost}
                disabled={!u.has_active_session}
                onClick={() => setDialog({ kind: "confirm", title: "Force sign-out?", body: `${u.username}'s current session will end immediately.`, action: "Sign out user", run: () => forceLogout(u.id) })}
              >
                Force sign-out
              </button>
              <button className={btnGhost} onClick={() => setDialog({ kind: "limit", user: u })}>Device limit</button>
              <button className={btnGhost} onClick={() => setDialog({ kind: "password", user: u })}>Reset password</button>
            </div>
          </li>
        ))}
      </ul>

      {dialog?.kind === "create" && (
        <CreateUserDialog roles={list} canPickRoles={canRoles} onClose={close} onSubmit={(b) => users.act(() => createUser(b))} />
      )}
      {dialog?.kind === "roles" && (
        <UserRolesDialog user={dialog.user} roles={list} onClose={close} onSubmit={(ids) => users.act(() => setUserRoles(dialog.user.id, ids).then(roles.reload))} />
      )}
      {dialog?.kind === "password" && <PasswordDialog user={dialog.user} onClose={close} onSubmit={(pw) => users.act(() => updateUser(dialog.user.id, { password: pw }))} />}
      {dialog?.kind === "limit" && <LimitDialog user={dialog.user} onClose={close} onSubmit={(n) => users.act(() => updateUser(dialog.user.id, { max_devices: n }))} />}
      {dialog?.kind === "confirm" && (
        <ConfirmDialog title={dialog.title} body={dialog.body} action={dialog.action} onClose={close} onConfirm={() => users.act(dialog.run)} />
      )}
    </>
  );
}
