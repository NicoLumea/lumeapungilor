import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { consumeRequestBudget, type RequestBudget } from "./request-rate-limit-core.ts";

const hash = (value: string) =>
  createHmac("sha256", "test-only-pepper").update(value).digest("hex");
test("rotating emails keeps the same IP budget and never stores raw identifiers", async () => {
  const calls: RequestBudget[] = [];
  const deps = {
    clientIp: () => "192.0.2.1",
    hash,
    consume: async (args: RequestBudget) => {
      calls.push(args);
      return { data: { allowed: true }, error: null };
    },
  };
  await consumeRequestBudget("checkout", "Alice@example.com", 10, 900, deps);
  await consumeRequestBudget("checkout", "bob@example.com", 10, 900, deps);
  await consumeRequestBudget("checkout", " alice@example.com ", 10, 900, deps);
  const [first, second, third] = calls;
  assert.ok(first && second && third);
  assert.equal(first.p_ip_hash, second.p_ip_hash);
  assert.notEqual(first.p_identifier_hash, second.p_identifier_hash);
  assert.equal(first.p_identifier_hash, third.p_identifier_hash);
  assert.equal(first.p_ip_limit, 50);
  assert.doesNotMatch(JSON.stringify(calls), /example\.com|192\.0\.2/);
});
test("only an explicit successful database decision permits a request", async () => {
  for (const result of [
    { data: { allowed: false }, error: null },
    { data: { allowed: true }, error: { message: "database unavailable" } },
    { data: null, error: null },
    { data: { allowed: "true" }, error: null },
  ]) {
    assert.equal(
      (
        await consumeRequestBudget("contact", "a@example.com", 5, 3600, {
          clientIp: () => "192.0.2.1",
          hash,
          consume: async () => result,
        })
      ).allowed,
      false,
    );
  }
});
test("missing trusted IP and thrown database errors fail closed", async () => {
  const fail = () => {
    throw new Error("unavailable");
  };
  assert.equal(
    (
      await consumeRequestBudget("contact", "a", 5, 3600, {
        clientIp: fail,
        hash,
        consume: fail,
      })
    ).allowed,
    false,
  );
  assert.equal(
    (
      await consumeRequestBudget("contact", "a", 5, 3600, {
        clientIp: () => "192.0.2.1",
        hash,
        consume: fail,
      })
    ).allowed,
    false,
  );
});
