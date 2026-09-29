/**
 * Casual in-app lock for the control room.
 *
 * Only the SHA-256 hash of the password ships in the bundle — and this is
 * a polite gate for a dashboard, not real security (the hard wall is
 * Vercel Deployment Protection in front of the URL). To change the
 * password, set VITE_ACCESS_PASSWORD_HASH in the deploy environment to
 * the SHA-256 hex of the new password:
 *   node -e "console.log(require('crypto').createHash('sha256').update('NEW').digest('hex'))"
 */
const BAKED_HASH = "f252d35fc49a9f73d4029e74b72137e9969d2643cce35614036fce9ff35b5567";

const ENV_HASH = import.meta.env.VITE_ACCESS_PASSWORD_HASH as string | undefined;
export const PASSWORD_HASH = (ENV_HASH ?? BAKED_HASH).toLowerCase();

const KEY = "sh-unlocked";

export function isUnlocked(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setUnlocked(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode — gate stays for the session only */
  }
}

export function clearUnlocked(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export async function checkPassword(pw: string): Promise<boolean> {
  if (!crypto?.subtle) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === PASSWORD_HASH;
}
