import { API_URL, clearSession, getAccessToken, refreshSession } from "./auth";

export class AuthError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
  }
}

/** fetch against the API with the bearer token; refreshes once on 401. */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${getAccessToken() ?? ""}` },
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401) {
      if (!(await refreshSession())) {
        clearSession();
        throw new AuthError();
      }
      res = await send();
      if (res.status === 401) {
        clearSession();
        throw new AuthError();
      }
    }
  } catch (e) {
    if (e instanceof AuthError) throw e;
    throw new Error("Could not reach the analysis service. Check your connection and try again.");
  }
  return res;
}
