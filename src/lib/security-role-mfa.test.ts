import assert from "node:assert/strict";
import test from "node:test";
import { roleAllows, sessionIdFromClaims } from "./authorization.server.ts";
import { maskEmail, sessionIdFromAccessToken } from "./staff-mfa.server.ts";

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
