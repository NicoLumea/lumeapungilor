import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const account = readFileSync(new URL("./account.functions.ts", import.meta.url), "utf8");
const profile = readFileSync(new URL("../routes/cont.tsx", import.meta.url), "utf8");
const workers = readFileSync(new URL("../routes/n7q4-v2m9.roluri.tsx", import.meta.url), "utf8");
const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20261004140000_disable_staff_access_requests.sql",
    import.meta.url,
  ),
  "utf8",
);

test("customers have no staff request form or callable request endpoint", () => {
  assert.doesNotMatch(profile, /requestEmployeeAccess|Cere acces|askAccess/);
  assert.doesNotMatch(
    account,
    /export const (requestEmployeeAccess|requestAdminPromotion|decideAdminPromotion|decideEmployeeRequest)/,
  );
  assert.match(migration, /drop policy if exists "own employee request insert"/);
  assert.match(
    migration,
    /revoke insert, update, delete on public.employee_requests from anon, authenticated/,
  );
});

test("direct promotion is authenticated and checks administrator rights before account lookup or writes", () => {
  const promotion = account.slice(
    account.indexOf("export const promoteAccount"),
    account.indexOf("/* ---------------------------------------------- contact messages"),
  );
  assert.match(promotion, /middleware\(\[requireSupabaseAuth\]\)/);
  assert.match(promotion, /role: z.enum\(\["employee", "admin"\]\)/);
  const guard = promotion.indexOf('hasPrivilegedAccess(context.userId, "admin")');
  assert.ok(guard >= 0 && guard < promotion.indexOf('.from("profiles")'));
  assert.ok(guard < promotion.indexOf('.from("user_roles")'));
  assert.match(promotion, /auth.admin.getUserById\(profile.id\)/);
  assert.match(promotion, /authData.user\?\.email\?\.toLowerCase\(\) === data.candidateEmail/);
  assert.match(promotion, /!authData.user.email_confirmed_at/);
  assert.match(promotion, /candidate.id === context.userId/);
  assert.match(promotion, /targetRoles.includes\("owner"\)/);
  assert.match(promotion, /action: "account.promoted"/);
  assert.doesNotMatch(promotion, /role_change_requests|pending_owner_approval/);
});

test("workers page grants both roles directly and retains failed candidate input", () => {
  assert.match(workers, /option value="employee"/);
  assert.match(workers, /option value="admin"/);
  assert.match(workers, /promote\(\{ data: \{ candidateEmail: candidate, role \} \}\)/);
  assert.match(workers, /if \(success\) setCandidate\(""\)/);
  assert.doesNotMatch(workers, /askPromotion|decidePromotion|Trimite cererea/);
});
