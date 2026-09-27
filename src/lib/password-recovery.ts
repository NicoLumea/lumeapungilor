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

export function hasRecoveryMarker(url: string): boolean {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const type = query.get("type") ?? hash.get("type");
  return (
    type === "recovery" ||
    query.has("code") ||
    (hash.has("access_token") && hash.has("refresh_token"))
  );
}

export function hasRecoveryError(url: string): boolean {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  return parsed.searchParams.has("error") || hash.has("error");
}
