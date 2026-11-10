"use client";

import { useState } from "react";

import { ConfirmDialog, RoleDialog } from "@/components/admin/dialogs";
import { card, ErrorBanner, PageTitle, useAdminData } from "@/components/admin/shared";
import { btnDanger, btnGhost, btnPrimary } from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { createRole, deleteRole, listRoles, updateRole, type Role } from "@/services/admin";

type Dialog = { kind: "edit"; role: Role | null } | { kind: "delete"; role: Role } | null;

export default function RolesPage() {
  const roles = useAdminData(listRoles);
  const [dialog, setDialog] = useState<Dialog>(null);
  const catalog = roles.data?.permissions ?? [];
  const label = (k: string) => catalog.find((c) => c.key === k)?.label ?? k;

  return (
    <>
      <PageTitle title="Roles">
        <button className={btnPrimary} onClick={() => setDialog({ kind: "edit", role: null })} disabled={!roles.data}>New role</button>
      </PageTitle>
      <p className="text-sm text-muted">
        A role is a named set of permissions. Assign roles to users on the Users page; a user&apos;s permissions are the
        combination of all their roles.
      </p>
      <ErrorBanner message={roles.error} />

      <ul className="space-y-3">
        {(roles.data?.roles ?? []).map((r) => (
          <li key={r.id} className={card}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">{r.name}</span>
              {r.is_system && <StatusBadge tone="warn">Built-in</StatusBadge>}
              <span className="text-xs text-muted">{r.user_count} {r.user_count === 1 ? "user" : "users"}</span>
            </div>
            {r.description && <p className="mt-1 text-sm text-muted">{r.description}</p>}
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {r.permissions.length === 0 && <li className="text-xs text-muted">No permissions</li>}
              {r.permissions.map((p) => (
                <li key={p} title={label(p)} className="rounded border border-line bg-subtle px-1.5 py-0.5 font-mono text-[11px]">{p}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.name !== "admin" && <button className={btnGhost} onClick={() => setDialog({ kind: "edit", role: r })}>Edit</button>}
              {r.name === "admin" && <span className="text-xs text-muted">The admin role always has every permission and cannot be changed.</span>}
              {!r.is_system && <button className={btnDanger} onClick={() => setDialog({ kind: "delete", role: r })}>Delete</button>}
            </div>
          </li>
        ))}
      </ul>

      {dialog?.kind === "edit" && (
        <RoleDialog
          role={dialog.role}
          catalog={catalog}
          onClose={() => setDialog(null)}
          onSubmit={(b) => roles.act(() => (dialog.role ? updateRole(dialog.role.id, b) : createRole(b)))}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title={`Delete role "${dialog.role.name}"?`}
          body="This cannot be undone. A role that is still assigned to users cannot be deleted."
          action="Delete role"
          onClose={() => setDialog(null)}
          onConfirm={() => roles.act(() => deleteRole(dialog.role.id))}
        />
      )}
    </>
  );
}
