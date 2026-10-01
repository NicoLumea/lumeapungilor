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

export function normalizeRecoveryCode(value: string): string | null {
  const code = value.trim();
  return /^[0-9]{6}$/.test(code) ? code : null;
}
