export type AppRole = "customer" | "employee" | "admin" | "owner";
export type AccessLevel = "customer" | "staff" | "admin" | "owner";

export const ROLE_LABEL: Record<AppRole, string> = {
  customer: "Client",
  employee: "Angajat",
  admin: "Administrator",
  owner: "Proprietar",
};

export function effectiveRole(roles: readonly AppRole[]): AppRole {
  if (roles.includes("owner")) return "owner";
  if (roles.includes("admin")) return "admin";
  if (roles.includes("employee")) return "employee";
  return "customer";
}

export function hasAccess(
  authenticated: boolean,
  roles: readonly AppRole[],
  level: AccessLevel,
): boolean {
  if (!authenticated) return false;
  const role = effectiveRole(roles);
  if (level === "customer") return true;
  if (level === "staff") return role === "employee" || role === "admin" || role === "owner";
  if (level === "admin") return role === "admin" || role === "owner";
  return role === "owner";
}
