import { supabase } from "@/integrations/supabase/client";
import { PASSWORD_RESET_GENERIC_MESSAGE } from "@/lib/password-recovery";
import {
  isStaffDestination,
  sanitizeInternalDestination,
  STAFF_DESTINATION_STORAGE_KEY,
} from "@/lib/staff-auth-flow";
import { storageRemove, storageSet } from "@/lib/safe-storage";

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

export async function protectedSignIn(
  email: string,
  password: string,
  requestedDestination?: string,
): Promise<{ requiresStaffVerification: boolean; nextDestination: string }> {
  const safeDestination = sanitizeInternalDestination(requestedDestination) ?? "/cont";
  if (isStaffDestination(safeDestination)) {
    storageSet("session", STAFF_DESTINATION_STORAGE_KEY, safeDestination);
  }
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, destination: safeDestination }),
  });
  const payload = (await response.json()) as AuthErrorPayload & {
    ok?: boolean;
    accessToken?: string;
    refreshToken?: string;
    requiresStaffVerification?: boolean;
    nextDestination?: string;
  };
  if (!response.ok || !payload.ok || !payload.accessToken || !payload.refreshToken) {
    throw new PublicAuthError(payload);
  }
  const { error } = await supabase.auth.setSession({
    access_token: payload.accessToken,
    refresh_token: payload.refreshToken,
  });
  if (error) throw new PublicAuthError({ error: "Autentificarea nu a putut fi finalizată." });
  const requiresStaffVerification = payload.requiresStaffVerification === true;
  const nextDestination = sanitizeInternalDestination(payload.nextDestination) ?? "/cont";
  if (requiresStaffVerification) {
    storageSet("session", STAFF_DESTINATION_STORAGE_KEY, nextDestination);
  } else {
    storageRemove("session", STAFF_DESTINATION_STORAGE_KEY);
  }
  return { requiresStaffVerification, nextDestination };
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
  return payload.message ?? PASSWORD_RESET_GENERIC_MESSAGE;
}
