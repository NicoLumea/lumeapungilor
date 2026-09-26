import { supabase } from "@/integrations/supabase/client";

type AuthErrorPayload = {
  error?: string;
  code?: string;
  retryAfterSeconds?: number;
};

export class PublicAuthError extends Error {
  readonly code: string | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(payload: AuthErrorPayload) {
    super(payload.error ?? "Autentificarea nu este disponibilă momentan.");
    this.name = "PublicAuthError";
    this.code = payload.code;
    this.retryAfterSeconds = payload.retryAfterSeconds;
  }
}

export async function protectedSignIn(email: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const payload = (await response.json()) as AuthErrorPayload & {
    ok?: boolean;
    accessToken?: string;
    refreshToken?: string;
  };
  if (!response.ok || !payload.ok || !payload.accessToken || !payload.refreshToken) {
    throw new PublicAuthError(payload);
  }
  const { error } = await supabase.auth.setSession({
    access_token: payload.accessToken,
    refresh_token: payload.refreshToken,
  });
  if (error) throw new PublicAuthError({ error: "Autentificarea nu a putut fi finalizată." });
}

export async function protectedPasswordReset(email: string): Promise<string> {
  const response = await fetch("/api/auth/password-reset", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const payload = (await response.json()) as AuthErrorPayload & { ok?: boolean; message?: string };
  if (!response.ok || !payload.ok) throw new PublicAuthError(payload);
  return (
    payload.message ??
    "Dacă există un cont pentru această adresă, vei primi un e-mail cu instrucțiuni."
  );
}
