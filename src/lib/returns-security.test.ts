import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const secret = "a".repeat(64);
const secretHash = createHash("sha256").update(secret).digest("hex");
type Result = { ok: boolean; error?: string; token?: string; order?: { email: string } };
type Handler = (input: unknown) => Promise<Result>;

function fixture(
  options: {
    userEmail?: string;
    confirmed?: boolean;
    authError?: boolean;
    accessError?: boolean;
    limitAllowed?: boolean;
    unpaid?: boolean;
    missing?: boolean;
  } = {},
) {
  const sessions: Record<string, unknown>[] = [];
  let queries = 0;
  const admin = {
    auth: {
      getUser: async () => ({
        data: {
          user: options.userEmail
            ? {
                email: options.userEmail,
                email_confirmed_at: options.confirmed ? "2026-01-01" : null,
              }
            : null,
        },
        error: options.authError ? { message: "invalid token" } : null,
      }),
    },
    from(table: string) {
      queries++;
      const query = {
        select: () => query,
        eq: () => query,
        // Intentionally no ILIKE: any reintroduction fails this regression suite.
        maybeSingle: async () =>
          table === "orders"
            ? {
                error: null,
                data: options.missing
                  ? null
                  : {
                      id: "00000000-0000-4000-8000-000000000001",
                      order_number: "TEST-1",
                      user_id: null,
                      email: "alice@example.com",
                      payment_status: options.unpaid ? "pending" : "paid",
                      contact_name: "Synthetic customer",
                      phone: "000000",
                      order_items: [],
                    },
              }
            : {
                data: { token_hash: secretHash },
                error: options.accessError ? { message: "unavailable" } : null,
              },
        insert: async (row: Record<string, unknown>) => {
          sessions.push(row);
          return { error: null };
        },
      };
      return query;
    },
  };
  function load(name: string): Record<string, Handler> {
    const file = new URL(name, import.meta.url);
    const module = { exports: {} };
    const compiled = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(compiled, { module, exports: module.exports, require: mockedRequire, Date });
    return module.exports;
  }
  function mockedRequire(name: string): unknown {
    if (name === "@tanstack/react-start")
      return {
        createServerFn: () => {
          let parse = (value: unknown) => value;
          const chain = {
            middleware: () => chain,
            inputValidator: (validator: typeof parse) => {
              parse = validator;
              return chain;
            },
            handler:
              (handler: (value: { data: unknown }) => Promise<Result>) => async (input: unknown) =>
                handler({ data: parse(input) }),
          };
          return chain;
        },
      };
    if (name === "@tanstack/react-start/server")
      return {
        getRequestHeader: () => (options.userEmail ? "Bearer synthetic-token" : undefined),
      };
    if (name.includes("auth-middleware")) return { requireSupabaseAuth: {} };
    if (name.includes("client.server")) return { supabaseAdmin: admin };
    if (name.includes("rate-limit.server"))
      return {
        checkRateLimit: async () => ({ allowed: options.limitAllowed !== false }),
      };
    if (name === "@/lib/returns-core") return load("./returns-core.ts");
    if (name === "@/lib/guest-return-access") return load("./guest-return-access.ts");
    if (name === "zod" || name === "node:crypto") return require(name);
    throw new Error(`Unexpected dependency: ${name}`);
  }
  const handlers = load("./returns.functions.ts");
  return {
    verifyGuestReturnOrder: handlers["verifyGuestReturnOrder"]!,
    submitGuestReturn: handlers["submitGuestReturn"]!,
    sessions,
    queries: () => queries,
  };
}

test("handler reveals nothing and issues no session for identifiers alone or wrong proofs", async () => {
  for (const options of [
    {},
    { userEmail: "alice@example.com", confirmed: false },
    { userEmail: "bob@example.com", confirmed: true },
    { userEmail: "alice@example.com", confirmed: true, authError: true },
  ]) {
    const f = fixture(options);
    const result = await f.verifyGuestReturnOrder({
      orderNumber: "TEST-1",
      email: "alice@example.com",
    });
    assert.equal(result.ok, false);
    assert.equal(result.order, undefined);
    assert.equal(f.sessions.length, 0);
  }
  for (const input of [
    { email: "alice@example.com", accessToken: "b".repeat(64) },
    { email: "_____@example.com", accessToken: secret },
  ]) {
    const f = fixture();
    assert.equal((await f.verifyGuestReturnOrder({ orderNumber: "TEST-1", ...input })).ok, false);
    assert.equal(f.sessions.length, 0);
  }
});

test("checkout secret and verified same-email account each authorize legitimate returns", async () => {
  for (const options of [{}, { userEmail: "ALICE@example.com", confirmed: true }]) {
    const f = fixture(options);
    const result = await f.verifyGuestReturnOrder({
      orderNumber: "test-1",
      email: "Alice@example.com",
      ...(options.userEmail ? {} : { accessToken: secret }),
    });
    assert.equal(result.ok, true);
    assert.match(result.token!, /^v2_[A-Za-z0-9_-]{43}$/);
    assert.equal(f.sessions.length, 1);
    assert.equal(
      f.sessions[0]!["token_hash"],
      createHash("sha256").update(result.token!).digest("hex"),
    );
    assert.equal(result.order?.email, "alice@example.com");
  }
});

test("missing order and failed authorization produce the same public error", async () => {
  const input = { orderNumber: "TEST-1", email: "alice@example.com" };
  const missing = await fixture({ missing: true }).verifyGuestReturnOrder(input);
  const denied = await fixture().verifyGuestReturnOrder(input);
  assert.equal(missing.error, denied.error);
});

test("unpaid, throttled and failed token-storage checks issue no return sessions", async () => {
  for (const options of [{ unpaid: true }, { limitAllowed: false }, { accessError: true }]) {
    const f = fixture(options);
    assert.equal(
      (
        await f.verifyGuestReturnOrder({
          orderNumber: "TEST-1",
          email: "alice@example.com",
          accessToken: secret,
        })
      ).ok,
      false,
    );
    assert.equal(f.sessions.length, 0);
    if (options.limitAllowed === false) assert.equal(f.queries(), 0);
  }
});

test("legacy guest-return tokens are rejected before any database access", async () => {
  const f = fixture();
  await assert.rejects(
    f.submitGuestReturn({
      orderId: "00000000-0000-4000-8000-000000000001",
      orderItemId: "00000000-0000-4000-8000-000000000002",
      idempotencyKey: "00000000-0000-4000-8000-000000000003",
      customerName: "Synthetic customer",
      email: "alice@example.com",
      phone: "000000",
      requestedQuantity: 1,
      reason: "other",
      description: "Synthetic return request",
      images: [],
      guestToken: "a".repeat(43),
    }),
  );
  assert.equal(f.queries(), 0);
});
