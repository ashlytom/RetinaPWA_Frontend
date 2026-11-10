import { authFetch } from "./api";
import type { Permission } from "./auth";

export interface AdminUser {
  id: number;
  username: string;
  roles: string[];
  is_active: boolean;
  max_devices: number;
  device_count: number;
  has_active_session: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface AdminDevice {
  id: number;
  user_id: number;
  username: string;
  device_id_short: string;
  user_agent: string;
  first_seen_at: string;
  last_seen_at: string;
  last_ip: string;
  revoked_at: string | null;
  is_current_session: boolean;
}

export interface AdminLogin {
  id: number;
  at: string;
  username: string;
  device_id_short: string;
  ip: string;
  user_agent: string;
  success: boolean;
  reason: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  permissions: Permission[];
  user_count: number;
}

export interface RolesResponse {
  roles: Role[];
  permissions: { key: Permission; label: string }[];
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await authFetch(`/admin${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const d = j.detail;
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? d.map((x) => x.msg).join("; ") : `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const send = <T = void>(method: string, path: string, body?: unknown) =>
  call<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export const listUsers = () => call<AdminUser[]>("/users");
export const listDevices = () => call<AdminDevice[]>("/devices");
export const listLogins = (failuresOnly: boolean) => call<AdminLogin[]>(`/logins?limit=200${failuresOnly ? "&failures_only=true" : ""}`);
export const listRoles = () => call<RolesResponse>("/roles");

export const createUser = (b: { username: string; password: string; roles: string[]; max_devices?: number }) =>
  send<AdminUser>("POST", "/users", b);
export const updateUser = (id: number, b: Partial<{ is_active: boolean; max_devices: number; password: string }>) =>
  send<AdminUser>("PATCH", `/users/${id}`, b);
export const setUserRoles = (id: number, role_ids: number[]) => send<AdminUser>("PUT", `/users/${id}/roles`, { role_ids });
export const forceLogout = (id: number) => send("POST", `/users/${id}/logout`);

export const revokeDevice = (id: number) => send("POST", `/devices/${id}/revoke`);
export const restoreDevice = (id: number) => send("POST", `/devices/${id}/restore`);

export const createRole = (b: { name: string; description: string; permissions: Permission[] }) => send<Role>("POST", "/roles", b);
export const updateRole = (id: number, b: Partial<{ name: string; description: string; permissions: Permission[] }>) =>
  send<Role>("PATCH", `/roles/${id}`, b);
export const deleteRole = (id: number) => send("DELETE", `/roles/${id}`);
