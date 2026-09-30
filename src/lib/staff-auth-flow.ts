export const STAFF_DESTINATION_STORAGE_KEY = "lumea-staff-auth-destination";
export const ADMIN_DASHBOARD = "/n7q4-v2m9";
export const EMPLOYEE_DASHBOARD = "/staff";

function pathOnly(destination: string): string {
  return new URL(destination, "https://lumea-pungilor.invalid").pathname;
}

export function sanitizeInternalDestination(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 1 || value.length > 1000) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (
    value.includes("\\") ||
    [...value].some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    }) ||
    /%(?:2f|5c)/i.test(value)
  )
    return null;

  try {
    const parsed = new URL(value, "https://lumea-pungilor.invalid");
    if (parsed.origin !== "https://lumea-pungilor.invalid") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function isStaffDestination(value: unknown): boolean {
  const destination = sanitizeInternalDestination(value);
  if (!destination) return false;
  const path = pathOnly(destination);
  return (
    path === EMPLOYEE_DASHBOARD ||
    path.startsWith(`${EMPLOYEE_DASHBOARD}/`) ||
    path === ADMIN_DASHBOARD ||
    path.startsWith(`${ADMIN_DASHBOARD}/`) ||
    path === "/admin" ||
    path.startsWith("/admin/")
  );
}

export function resolvePostAuthDestination(requested: unknown, roles: readonly string[]): string {
  const destination = sanitizeInternalDestination(requested);
  const path = destination ? pathOnly(destination) : null;
  const ownerOrAdmin = roles.includes("owner") || roles.includes("admin");
  const employee = ownerOrAdmin || roles.includes("employee");

  if (ownerOrAdmin) {
    if (
      destination &&
      path &&
      (path === ADMIN_DASHBOARD ||
        path.startsWith(`${ADMIN_DASHBOARD}/`) ||
        path === EMPLOYEE_DASHBOARD ||
        path.startsWith(`${EMPLOYEE_DASHBOARD}/`))
    ) {
      return destination;
    }
    return ADMIN_DASHBOARD;
  }

  if (employee) {
    if (
      destination &&
      path &&
      (path === EMPLOYEE_DASHBOARD || path.startsWith(`${EMPLOYEE_DASHBOARD}/`))
    ) {
      return destination;
    }
    return EMPLOYEE_DASHBOARD;
  }

  if (destination && !isStaffDestination(destination)) return destination;
  return "/cont";
}
