type DatabaseError = {
  code?: string;
  message?: string;
  status?: number;
};

export function adminErrorMessage(error: unknown, action: string): string {
  const failure = error && typeof error === "object" ? (error as DatabaseError) : {};
  if (import.meta.env?.DEV) {
    console.error(`[admin] ${action} failed`, {
      code: failure.code,
      status: failure.status,
      message: failure.message,
    });
  }
  if (failure.status === 401 || failure.code === "PGRST301") {
    return "Sesiunea a expirat. Autentifică-te din nou și reîncearcă.";
  }
  if (failure.status === 403 || failure.code === "42501") {
    return "Nu ai permisiunea necesară. Verifică rolul de administrator și sesiunea MFA.";
  }
  if (failure.code === "PGRST202" || failure.code === "42883") {
    return "Operațiunea nu este instalată în Supabase. Aplică migrările bazei de date.";
  }
  if (failure.code === "23505") return "Există deja o înregistrare cu aceeași adresă sau cod.";
  if (failure.code === "23503") return "Această înregistrare este folosită în altă parte.";
  if (failure.code === "23514" || failure.code === "22023") {
    return "Datele introduse nu respectă regulile de validare. Verifică formularul.";
  }
  if (failure.message?.includes("Failed to fetch") || failure.message?.includes("NetworkError")) {
    return "Conexiunea cu Supabase a eșuat. Verifică rețeaua și reîncearcă.";
  }
  return `${action} nu a reușit. Reîncearcă sau contactează administratorul tehnic.`;
}
