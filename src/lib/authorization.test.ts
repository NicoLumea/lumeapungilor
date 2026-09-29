import assert from "node:assert/strict";
import test from "node:test";
import { effectiveRole, hasAccess, type AppRole } from "./authorization.ts";

const matrix: Array<{
  name: string;
  authenticated: boolean;
  roles: AppRole[];
  customer: boolean;
  staff: boolean;
  admin: boolean;
  owner: boolean;
}> = [
  {
    name: "guest",
    authenticated: false,
    roles: [],
    customer: false,
    staff: false,
    admin: false,
    owner: false,
  },
  {
    name: "customer",
    authenticated: true,
    roles: ["customer"],
    customer: true,
    staff: false,
    admin: false,
    owner: false,
  },
  {
    name: "employee",
    authenticated: true,
    roles: ["customer", "employee"],
    customer: true,
    staff: true,
    admin: false,
    owner: false,
  },
  {
    name: "administrator",
    authenticated: true,
    roles: ["customer", "admin"],
    customer: true,
    staff: true,
    admin: true,
    owner: false,
  },
  {
    name: "owner",
    authenticated: true,
    roles: ["customer", "admin", "owner"],
    customer: true,
    staff: true,
    admin: true,
    owner: true,
  },
];

for (const entry of matrix) {
  test(`${entry.name} access follows the role boundary`, () => {
    assert.equal(hasAccess(entry.authenticated, entry.roles, "customer"), entry.customer);
    assert.equal(hasAccess(entry.authenticated, entry.roles, "staff"), entry.staff);
    assert.equal(hasAccess(entry.authenticated, entry.roles, "admin"), entry.admin);
    assert.equal(hasAccess(entry.authenticated, entry.roles, "owner"), entry.owner);
  });
}

test("the highest role is displayed even when every account also has the customer role", () => {
  assert.equal(effectiveRole(["customer", "admin"]), "admin");
  assert.equal(effectiveRole(["customer", "employee", "owner"]), "owner");
});
