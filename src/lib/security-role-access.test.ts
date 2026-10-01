import assert from "node:assert/strict";
import test from "node:test";
import { hasAccess } from "./authorization.ts";
import { roleAllows } from "./authorization.server.ts";

test("server role hierarchy keeps staff, admin, and owner permissions distinct", () => {
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

test("client route access never grants customer or anonymous admin access", () => {
  assert.equal(hasAccess(false, [], "admin"), false);
  assert.equal(hasAccess(true, ["customer"], "admin"), false);
  assert.equal(hasAccess(true, ["employee"], "admin"), false);
  assert.equal(hasAccess(true, ["admin"], "admin"), true);
  assert.equal(hasAccess(true, ["owner"], "admin"), true);
});
