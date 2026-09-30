import type { JwtPayload } from "@supabase/supabase-js";

export type PrivilegedRole = "employee" | "admin" | "owner";

export const AUTHORIZATION_DENIED = "Nu ai permisiunea necesară pentru această acțiune.";

export function sessionIdFromClaims(claims: JwtPayload | Record<string, unknown>): string | null {
  const value = claims["session_id"];
  return typeof value === "string" && value.length >= 8 ? value : null;
}

export async function rolesForUser(userId: string): Promise<string[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((entry) => entry.role as string);
}

export function roleAllows(roles: string[], required: PrivilegedRole): boolean {
  if (required === "owner") return roles.includes("owner");
  if (required === "admin") return roles.includes("admin") || roles.includes("owner");
  return roles.some((role) => role === "employee" || role === "admin" || role === "owner");
}

export async function hasVerifiedPrivilegedAccess(
  userId: string,
  claims: JwtPayload | Record<string, unknown>,
  required: PrivilegedRole,
): Promise<boolean> {
  const sessionId = sessionIdFromClaims(claims);
  if (!sessionId) return false;
  const roles = await rolesForUser(userId);
  if (!roleAllows(roles, required)) return false;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("staff_verified_sessions")
    .select("auth_session_id")
    .eq("auth_session_id", sessionId)
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return !!data;
}

export async function invalidatePrivilegedSessions(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("staff_verified_sessions").delete().eq("user_id", userId);
  await supabaseAdmin
    .from("staff_login_challenges")
    .update({ invalidated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null)
    .is("invalidated_at", null);
}
