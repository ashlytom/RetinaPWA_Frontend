"use client";

import { useState } from "react";

import Modal, { btnDanger, btnGhost, btnPrimary, inputCls } from "@/components/ui/Modal";
import type { AdminUser, Role, RolesResponse } from "@/services/admin";
import type { Permission } from "@/services/auth";

function useSubmit(onSubmit: () => Promise<unknown>, onDone: () => void) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return {
    err,
    pending,
    run: async (e: React.FormEvent) => {
      e.preventDefault();
      setErr(null);
      setPending(true);
      try {
        await onSubmit();
        onDone();
      } catch (x) {
        setErr(x instanceof Error ? x.message : "Failed.");
      } finally {
        setPending(false);
      }
    },
  };
}

function FormError({ msg }: { msg: string | null }) {
  return msg ? (
    <p role="alert" className="mt-3 text-sm text-alert-fg">
      {msg}
    </p>
  ) : null;
}

function Footer({ onClose, label, pending }: { onClose: () => void; label: string; pending: boolean }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button type="button" className={btnGhost} onClick={onClose}>
        Cancel
      </button>
      <button type="submit" className={btnPrimary} disabled={pending}>
        {label}
      </button>
    </div>
  );
}

export function ConfirmDialog({ title, body, action, danger = true, onClose, onConfirm }: {
  title: string; body: string; action: string; danger?: boolean; onClose: () => void; onConfirm: () => Promise<unknown>;
}) {
  const { err, pending, run } = useSubmit(onConfirm, onClose);
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={run}>
        <p className="text-sm text-muted">{body}</p>
        <FormError msg={err} />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={danger ? btnDanger : btnPrimary} disabled={pending}>{action}</button>
        </div>
      </form>
    </Modal>
  );
}

function RoleChecks({ roles, selected, onToggle }: { roles: Role[]; selected: Set<number>; onToggle: (id: number) => void }) {
  return (
    <div className="space-y-2">
      {roles.map((r) => (
        <label key={r.id} className="flex cursor-pointer items-start gap-3 rounded border border-line bg-subtle p-3">
          <input type="checkbox" className="mt-1" checked={selected.has(r.id)} onChange={() => onToggle(r.id)} />
          <span className="min-w-0">
            <span className="block font-mono text-sm font-semibold">{r.name}</span>
            <span className="block text-xs text-muted">{r.description || r.permissions.join(", ") || "No permissions"}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function CreateUserDialog({ roles, canPickRoles, onClose, onSubmit }: {
  roles: Role[]; canPickRoles: boolean; onClose: () => void;
  onSubmit: (b: { username: string; password: string; roles: string[]; max_devices?: number }) => Promise<unknown>;
}) {
  const memberId = roles.find((r) => r.name === "member")?.id;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [max, setMax] = useState("");
  const [sel, setSel] = useState<Set<number>>(new Set(memberId ? [memberId] : []));
  const toggle = (id: number) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const { err, pending, run } = useSubmit(
    () => {
      const names = canPickRoles ? roles.filter((r) => sel.has(r.id)).map((r) => r.name) : ["member"];
      if (!names.length) throw new Error("Choose at least one role.");
      return onSubmit({ username, password, roles: names, max_devices: max ? Number(max) : undefined });
    },
    onClose,
  );
  return (
    <Modal title="Add user" onClose={onClose}>
      <form onSubmit={run} className="space-y-3">
        <label className="block text-sm font-semibold">Username
          <input className={`${inputCls} mt-1 font-mono`} value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" required minLength={3} />
        </label>
        <label className="block text-sm font-semibold">Initial password
          <input className={`${inputCls} mt-1`} type="text" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" required minLength={12} />
          <span className="mt-1 block text-xs font-normal text-muted">At least 12 characters. Share it securely.</span>
        </label>
        <label className="block text-sm font-semibold">Device limit
          <input className={`${inputCls} mt-1`} type="number" min={1} max={20} placeholder="default" value={max} onChange={(e) => setMax(e.target.value)} />
        </label>
        {canPickRoles ? (
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Roles</legend>
            <RoleChecks roles={roles} selected={sel} onToggle={toggle} />
          </fieldset>
        ) : (
          <p className="text-xs text-muted">The new user gets the <strong>member</strong> role.</p>
        )}
        <FormError msg={err} />
        <Footer onClose={onClose} label="Create user" pending={pending} />
      </form>
    </Modal>
  );
}

export function UserRolesDialog({ user, roles, onClose, onSubmit }: {
  user: AdminUser; roles: Role[]; onClose: () => void; onSubmit: (ids: number[]) => Promise<unknown>;
}) {
  const [sel, setSel] = useState<Set<number>>(new Set(roles.filter((r) => user.roles.includes(r.name)).map((r) => r.id)));
  const toggle = (id: number) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const { err, pending, run } = useSubmit(() => {
    if (!sel.size) throw new Error("Choose at least one role.");
    return onSubmit([...sel]);
  }, onClose);
  return (
    <Modal title={`Roles for ${user.username}`} onClose={onClose}>
      <form onSubmit={run}>
        <RoleChecks roles={roles} selected={sel} onToggle={toggle} />
        <p className="mt-3 text-xs text-muted">Permissions are combined across roles. Changing roles signs the user out.</p>
        <FormError msg={err} />
        <Footer onClose={onClose} label="Save roles" pending={pending} />
      </form>
    </Modal>
  );
}

export function PasswordDialog({ user, onClose, onSubmit }: { user: AdminUser; onClose: () => void; onSubmit: (pw: string) => Promise<unknown> }) {
  const [pw, setPw] = useState("");
  const { err, pending, run } = useSubmit(() => onSubmit(pw), onClose);
  return (
    <Modal title={`Reset password for ${user.username}`} onClose={onClose}>
      <form onSubmit={run}>
        <label className="block text-sm font-semibold">New password
          <input className={`${inputCls} mt-1`} type="text" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="off" required minLength={12} />
        </label>
        <p className="mt-2 text-xs text-muted">Their current session ends immediately.</p>
        <FormError msg={err} />
        <Footer onClose={onClose} label="Set password" pending={pending} />
      </form>
    </Modal>
  );
}

export function LimitDialog({ user, onClose, onSubmit }: { user: AdminUser; onClose: () => void; onSubmit: (n: number) => Promise<unknown> }) {
  const [n, setN] = useState(String(user.max_devices));
  const { err, pending, run } = useSubmit(() => onSubmit(Number(n)), onClose);
  return (
    <Modal title={`Device limit for ${user.username}`} onClose={onClose}>
      <form onSubmit={run}>
        <label className="block text-sm font-semibold">Maximum devices
          <input className={`${inputCls} mt-1`} type="number" min={1} max={20} value={n} onChange={(e) => setN(e.target.value)} required />
        </label>
        <p className="mt-2 text-xs text-muted">Currently using {user.device_count}. Revoked devices do not count.</p>
        <FormError msg={err} />
        <Footer onClose={onClose} label="Save" pending={pending} />
      </form>
    </Modal>
  );
}

export function RoleDialog({ role, catalog, onClose, onSubmit }: {
  role: Role | null; catalog: RolesResponse["permissions"]; onClose: () => void;
  onSubmit: (b: { name: string; description: string; permissions: Permission[] }) => Promise<unknown>;
}) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [perms, setPerms] = useState<Set<Permission>>(new Set(role?.permissions ?? []));
  const toggle = (p: Permission) => setPerms((s) => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });
  const { err, pending, run } = useSubmit(() => onSubmit({ name, description, permissions: catalog.map((c) => c.key).filter((k) => perms.has(k)) }), onClose);
  return (
    <Modal title={role ? `Edit role: ${role.name}` : "New role"} onClose={onClose}>
      <form onSubmit={run} className="space-y-3">
        <label className="block text-sm font-semibold">Name
          <input className={`${inputCls} mt-1 font-mono`} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} disabled={!!role?.is_system} />
        </label>
        <label className="block text-sm font-semibold">Description
          <input className={`${inputCls} mt-1`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
        </label>
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Permissions</legend>
          <div className="space-y-2">
            {catalog.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-start gap-3 rounded border border-line bg-subtle p-3">
                <input type="checkbox" className="mt-1" checked={perms.has(c.key)} onChange={() => toggle(c.key)} />
                <span>
                  <span className="block font-mono text-sm font-semibold">{c.key}</span>
                  <span className="block text-xs text-muted">{c.label}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-xs text-muted">Changes apply immediately and sign out everyone holding this role.</p>
        <FormError msg={err} />
        <Footer onClose={onClose} label={role ? "Save role" : "Create role"} pending={pending} />
      </form>
    </Modal>
  );
}
