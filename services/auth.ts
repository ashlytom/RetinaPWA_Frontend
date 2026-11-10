import { getDeviceId } from "./device";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const ACCESS = "dr_access";
const REFRESH = "dr_refresh";
const USER = "dr_user";

export type Permission = "screening:use" | "users:manage" | "devices:manage" | "audit:view" | "roles:manage";

export interface SessionUser {
  id: number;
  username: string;
  roles: string[];
  permissions: Permission[];
  can_admin: boolean;
}

export const can = (u: SessionUser | null, p: Permission) => u?.permissions?.includes(p) ?? false;

export function saveUser(u: SessionUser) {
  try {
    localStorage.setItem(USER, JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

interface Tokens {
  access_token: string;
  refresh_token: string;
  user?: SessionUser;
}

function store(t: Tokens) {
  try {
    localStorage.setItem(ACCESS, t.access_token);
    localStorage.setItem(REFRESH, t.refresh_token);
    if (t.user) localStorage.setItem(USER, JSON.stringify(t.user));
  } catch {
    /* storage unavailable: session lasts until reload */
  }
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS);
  } catch {
    return null;
  }
}

/**
 * For display and routing only. The server enforces permissions on every request.
 * A record saved by an older version of the app (no roles/permissions) is discarded rather than trusted.
 */
export function getUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u && Array.isArray(u.permissions) && Array.isArray(u.roles) && typeof u.can_admin === "boolean") return u as SessionUser;
    localStorage.removeItem(USER);
    return null;
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  try {
    return !!localStorage.getItem(REFRESH);
  } catch {
    return false;
  }
}

const NOTICE = "dr_notice";

/** A one-time message shown on the login page (for example, why the user was signed out). */
export function setNotice(msg: string) {
  try {
    sessionStorage.setItem(NOTICE, msg);
  } catch {
    /* ignore */
  }
}

export function takeNotice(): string | null {
  try {
    const m = sessionStorage.getItem(NOTICE);
    sessionStorage.removeItem(NOTICE);
    return m;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  } catch {
    /* ignore */
  }
}

export async function login(username: string, password: string): Promise<SessionUser> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, device_id: getDeviceId() }),
    });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(typeof j.detail === "string" ? j.detail : "Sign-in failed.");
  }
  const tokens: Tokens = await res.json();
  store(tokens);
  return tokens.user as SessionUser;
}

/** End the session on the server (best effort), then clear local state. */
export async function logout(): Promise<void> {
  const token = getAccessToken();
  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    } catch {
      /* offline: the server session will lapse on its own */
    }
  }
  clearSession();
}

let refreshing: Promise<boolean> | null = null;

/** Exchange the refresh token for a new pair. Concurrent callers share one request. */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      let refresh: string | null = null;
      try {
        refresh = localStorage.getItem(REFRESH);
      } catch {
        /* ignore */
      }
      if (!refresh) return false;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return false;
        store(await res.json());
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}
