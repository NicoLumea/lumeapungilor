import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { adminErrorMessage } from "./admin-errors.ts";

const migration = readFileSync(
  new URL("../../supabase/migrations/20261001190000_admin_write_authorization.sql", import.meta.url),
  "utf8",
);

test("catalog and content writes remove historical employee-wide policies", () => {
  for (const resource of ["products", "categories", "images", "variants", "content"]) {
    assert.match(migration, new RegExp(`drop policy if exists "staff manage ${resource}"`, "i"));
    assert.match(migration, new RegExp(`create policy "admins manage ${resource}"[\\s\\S]*?public\\.is_admin\\(\\)`, "i"));
  }
});

test("private product-image storage writes and reads require an admin", () => {
  for (const action of ["read", "upload", "update", "delete"]) {
    assert.match(
      migration,
      new RegExp(`create policy "admins ${action} product images"[\\s\\S]*?public\\.is_admin\\(\\)`, "i"),
    );
  }
  assert.doesNotMatch(migration, /to anon[\s\S]*?bucket_id = 'product-images'/i);
});

test("save errors distinguish session, RLS, migration, validation, and network failures", () => {
  assert.match(adminErrorMessage({ status: 401 }, "Salvarea"), /Sesiunea/);
  assert.match(adminErrorMessage({ code: "42501" }, "Salvarea"), /permisiunea/);
  assert.match(adminErrorMessage({ code: "PGRST202" }, "Salvarea"), /migrările/);
  assert.match(adminErrorMessage({ code: "23514" }, "Salvarea"), /validare/);
  assert.match(adminErrorMessage({ message: "Failed to fetch" }, "Salvarea"), /Conexiunea/);
});
