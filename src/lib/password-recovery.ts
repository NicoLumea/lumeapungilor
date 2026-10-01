export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "Dacă există un cont asociat acestei adrese de email, vei primi în scurt timp instrucțiuni pentru resetarea parolei.";

export function passwordValidationError(password: string, confirmation: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere.`;
  }
  if (password !== confirmation) return "Cele două parole nu coincid.";
  return null;
}

export type RecoveryCallback =
  | { kind: "implicit" }
  | { kind: "pkce" }
  | { kind: "error"; code: string | null; description: string | null }
  | { kind: "incomplete" }
  | { kind: "none" };

// Read the callback before the shared Supabase client initializes: the SDK
// removes successful callback parameters from the address bar itself.
export function readRecoveryCallback(url: string): RecoveryCallback {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const code = query.get("error_code") ?? hash.get("error_code");
  const description = query.get("error_description") ?? hash.get("error_description");
  if (query.has("error") || hash.has("error") || code || description) {
    return { kind: "error", code, description };
  }
  if (query.has("code")) return { kind: "pkce" };
  if (hash.has("access_token") && hash.has("refresh_token")) return { kind: "implicit" };
  if (query.get("type") === "recovery" || hash.get("type") === "recovery") {
    return { kind: "incomplete" };
  }
  return { kind: "none" };
}

export function recoveryCallbackConsumed(callback: RecoveryCallback, currentUrl: string): boolean {
  const parsed = new URL(currentUrl);
  if (callback.kind === "implicit") {
    return !new URLSearchParams(parsed.hash.replace(/^#/, "")).has("access_token");
  }
  if (callback.kind === "pkce") return !parsed.searchParams.has("code");
  return false;
}

export function recoveryErrorMessage(callback: RecoveryCallback): string {
  if (
    callback.kind === "error" &&
    (callback.code === "otp_expired" || /expir|already used/i.test(callback.description ?? ""))
  ) {
    return "Linkul de resetare a expirat sau a fost deja folosit. Solicită un link nou.";
  }
  if (callback.kind === "error") {
    return "Supabase nu a putut valida linkul de resetare. Solicită un link nou.";
  }
  if (callback.kind === "none") {
    return "Deschide linkul de resetare din cel mai recent email sau solicită unul nou.";
  }
  return "Linkul nu a stabilit o sesiune de recuperare. Solicită un link nou.";
}
