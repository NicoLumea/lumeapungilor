export const GUEST_ACCESS_KEY = "lp-guest-access";

export function hasGuestAccess(): boolean {
  return typeof window !== "undefined" && window.sessionStorage.getItem(GUEST_ACCESS_KEY) === "granted";
}

export function grantGuestAccess(): void {
  window.sessionStorage.setItem(GUEST_ACCESS_KEY, "granted");
}

export function clearGuestAccess(): void {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(GUEST_ACCESS_KEY);
}
