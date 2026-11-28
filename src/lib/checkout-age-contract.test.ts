import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const checkout = readFileSync(new URL("../routes/checkout.tsx", import.meta.url), "utf8");
const handler = readFileSync(new URL("./shop.functions.ts", import.meta.url), "utf8");
const migration = readFileSync(
  new URL("../../supabase/migrations/20261128120000_checkout_age_confirmation.sql", import.meta.url),
  "utf8",
);

test("guest and registered checkouts share an unchecked, order-specific age declaration", () => {
  assert.match(checkout, /const \[ageConfirmed, setAgeConfirmed\] = useState\(false\)/);
  assert.match(checkout, /if \(!ageConfirmed\) next\.ageConfirmed = AGE_CONFIRMATION_ERROR/);
  assert.match(checkout, /ageConfirmed,\s*customer:/);
  assert.doesNotMatch(checkout.slice(checkout.indexOf("const DRAFT_KEY"), checkout.indexOf("const set =")), /ageConfirmed.*sessionStorage/);
  assert.match(checkout, /termsAccepted: true as const/);
});

test("individual and company declarations use their approved distinct Romanian wording", () => {
  assert.match(checkout, /Confirm că am împlinit vârsta de 18 ani și am capacitatea legală de a încheia contracte\./);
  assert.match(checkout, /Confirm că am împlinit vârsta de 18 ani și sunt autorizat\(ă\) să plasez comanda în numele societății\./);
  assert.match(checkout, /if \(customerType !== t\) \{/);
  assert.match(checkout, /setAgeConfirmed\(false\)/);
  assert.match(checkout, /aria-invalid=\{!!errors\.ageConfirmed\}/);
});

test("new order backend rejects missing, false and non-boolean declarations before transaction", () => {
  assert.match(handler, /ageConfirmed: z\.unknown\(\)\.optional\(\)/);
  const guard = handler.indexOf("if (!isAgeConfirmed(data.ageConfirmed))");
  const transaction = handler.indexOf('rpc("create_order_tx"');
  const replay = handler.indexOf("// Idempotency: a repeated submit returns the existing order.");
  assert.ok(guard > replay, "verified existing-order replays remain possible");
  assert.ok(guard < transaction, "new orders require declaration before atomic stock changes");
  assert.match(handler, /AGE_CONFIRMATION_ERROR/);
  assert.match(handler, /data\\.ageConfirmed === undefined/);
  assert.match(handler, /Reîncarcă pagina de finalizare a comenzii/);
  const schemaGuard = handler.indexOf('.select("age_confirmed")');
  assert.ok(schemaGuard > guard && schemaGuard < transaction,
    "unmigrated databases must fail before stock and order creation");
  assert.match(handler, /age_confirmed: true/);
});

test("SQL records self-report in the existing atomic transaction without backfilling history", () => {
  for (const field of ["age_confirmed", "age_confirmed_at", "age_declaration_version"]) {
    assert.match(migration, new RegExp("add column if not exists " + field));
  }
  assert.match(migration, /case when p_order->>'age_confirmed' = 'true' then now\(\) else null end/);
  assert.match(migration, /'checkout-18-v1'/);
  assert.match(migration, /create or replace function public\.create_order_tx/);
  assert.match(migration, /grant execute on function public\.create_order_tx\(jsonb,jsonb\) to service_role/);
  assert.doesNotMatch(migration, /update public\.orders\s+set\s+age_confirmed/i);
  assert.doesNotMatch(migration, /age_confirmed\s+boolean\s+not\s+null/i);
});
