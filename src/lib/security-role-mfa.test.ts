import assert from "node:assert/strict";
import test from "node:test";
import { requiresStaffEmailVerification } from "./authorization.ts";
import { roleAllows, sessionIdFromClaims } from "./authorization.server.ts";
import { maskEmail, sessionIdFromAccessToken } from "./staff-mfa.server.ts";
import {
  ADMIN_DASHBOARD,
  EMPLOYEE_DASHBOARD,
  resolvePostAuthDestination,
  sanitizeInternalDestination,
} from "./staff-auth-flow.ts";

test("enforces the role hierarchy without granting employee admin access", () => {
  assert.equal(roleAllows(["employee"], "employee"), true);
  assert.equal(roleAllows(["employee"], "admin"), false);
  assert.equal(roleAllows(["employee"], "owner"), false);
  assert.equal(roleAllows(["admin"], "employee"), true);
  assert.equal(roleAllows(["admin"], "admin"), true);
  assert.equal(roleAllows(["admin"], "owner"), false);
  assert.equal(roleAllows(["owner"], "employee"), true);
  assert.equal(roleAllows(["owner"], "admin"), true);
  assert.equal(roleAllows(["owner"], "owner"), true);
  assert.equal(roleAllows(["customer"], "employee"), false);
});

test("requires the additional email challenge only for effective Employee accounts", () => {
  assert.equal(requiresStaffEmailVerification(["employee"]), true);
  assert.equal(requiresStaffEmailVerification(["admin"]), false);
  assert.equal(requiresStaffEmailVerification(["owner"]), false);
  assert.equal(requiresStaffEmailVerification(["employee", "admin"]), false);
  assert.equal(requiresStaffEmailVerification(["employee", "owner"]), false);
  assert.equal(requiresStaffEmailVerification(["customer"]), false);
});

test("accepts only a server-verifiable session identifier", () => {
  assert.equal(sessionIdFromClaims({ session_id: "session-1234" }), "session-1234");
  assert.equal(sessionIdFromClaims({ session_id: 1234 }), null);
  assert.equal(sessionIdFromClaims({}), null);
});

test("extracts the session binding from an access token without exposing credentials", () => {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ session_id: "session-5678" })).toString("base64url");
  assert.equal(sessionIdFromAccessToken(`${header}.${payload}.signature`), "session-5678");
  assert.equal(sessionIdFromAccessToken("not-a-token"), null);
});

test("masks staff email addresses in the verification screen", () => {
  assert.equal(maskEmail("birou@company.ro"), "b***@company.ro");
  assert.equal(maskEmail("invalid"), "***");
});

test("rejects external, protocol-relative, encoded-slash and malformed redirect targets", () => {
  assert.equal(sanitizeInternalDestination("https://example.com"), null);
  assert.equal(sanitizeInternalDestination("//example.com"), null);
  assert.equal(sanitizeInternalDestination("/%2F%2Fexample.com"), null);
  assert.equal(sanitizeInternalDestination("/staff\\example"), null);
  assert.equal(sanitizeInternalDestination("/staff/comenzi?tab=noi"), "/staff/comenzi?tab=noi");
});

test("restores only role-authorized staff destinations", () => {
  assert.equal(
    resolvePostAuthDestination("/n7q4-v2m9/orders?status=nou", ["admin"]),
    "/n7q4-v2m9/orders?status=nou",
  );
  assert.equal(resolvePostAuthDestination("/staff/comenzi", ["employee"]), "/staff/comenzi");
  assert.equal(resolvePostAuthDestination("/n7q4-v2m9/orders", ["employee"]), EMPLOYEE_DASHBOARD);
  assert.equal(resolvePostAuthDestination("/staff/comenzi", ["customer"]), "/cont");
  assert.equal(resolvePostAuthDestination("/admin", ["customer"]), "/cont");
});

test("uses the correct trusted-role default when no protected destination exists", () => {
  assert.equal(resolvePostAuthDestination(undefined, ["admin"]), ADMIN_DASHBOARD);
  assert.equal(resolvePostAuthDestination("/cont", ["owner"]), ADMIN_DASHBOARD);
  assert.equal(resolvePostAuthDestination(undefined, ["employee"]), EMPLOYEE_DASHBOARD);
  assert.equal(resolvePostAuthDestination("/checkout", ["customer"]), "/checkout");
});
