export type PrivilegedRole = "employee" | "admin" | "owner";

export const AUTHORIZATION_DENIED = "Nu ai permisiunea necesară pentru această acțiune.";

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

export async function hasPrivilegedAccess(
  userId: string,
  required: PrivilegedRole,
): Promise<boolean> {
  const roles = await rolesForUser(userId);
  return roleAllows(roles, required);
}
