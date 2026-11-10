const KEY = "dr_device_id";
const VALID = /^[A-Za-z0-9_-]{16,128}$/;

function generate(): string {
  const c = globalThis.crypto;
  if (typeof c.randomUUID === "function") return c.randomUUID().replace(/-/g, "");
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * A random ID that identifies this browser. Created on first use and kept in localStorage.
 * Clearing site data creates a new ID, which the server counts as a new device.
 */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !VALID.test(id)) {
      id = generate();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return generate(); // storage blocked: this sign-in will register as a new device
  }
}
