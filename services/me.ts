import { authFetch } from "./api";
import { saveUser, type SessionUser } from "./auth";

/** Re-read the signed-in user's roles and permissions so the UI tracks changes made by an administrator. */
export async function refreshMe(): Promise<SessionUser | null> {
  const res = await authFetch("/auth/me");
  if (!res.ok) return null;
  const u: SessionUser = await res.json();
  saveUser(u);
  return u;
}
