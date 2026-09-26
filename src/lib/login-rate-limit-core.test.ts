/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import {
  performRateLimitedLogin,
  type LoginKeys,
  type LoginRateLimitStore,
  type RateLimitDecision,
} from "./login-rate-limit-core.ts";

type Counter = { attempts: number; blockedUntil: number; windowStarted: number };

class MemoryStore implements LoginRateLimitStore {
  now = 0;
  readonly account = new Map<string, Counter>();
  readonly ip = new Map<string, Counter>();
  readonly accountMax: number;
  readonly ipMax: number;
  readonly windowSeconds: number;
  readonly lockoutSeconds: number;

  constructor(accountMax = 5, ipMax = 25, windowSeconds = 15 * 60, lockoutSeconds = 15 * 60) {
    this.accountMax = accountMax;
    this.ipMax = ipMax;
    this.windowSeconds = windowSeconds;
    this.lockoutSeconds = lockoutSeconds;
  }

  private decision(keys: LoginKeys): RateLimitDecision {
    const blockedUntil = Math.max(
      this.account.get(keys.accountKey)?.blockedUntil ?? 0,
      this.ip.get(keys.ipKey)?.blockedUntil ?? 0,
    );
    return {
      blocked: blockedUntil > this.now,
      retryAfterSeconds: Math.max(0, blockedUntil - this.now),
    };
  }

  async check(keys: LoginKeys) {
    return this.decision(keys);
  }

  private increment(map: Map<string, Counter>, key: string, maximum: number) {
    const current = map.get(key);
    const expired = !current || current.windowStarted + this.windowSeconds <= this.now;
    const next: Counter = expired
      ? { attempts: 1, blockedUntil: 0, windowStarted: this.now }
      : { ...current, attempts: current.attempts + 1 };
    if (next.attempts >= maximum) next.blockedUntil = this.now + this.lockoutSeconds;
    map.set(key, next);
  }

  async recordFailure(keys: LoginKeys) {
    this.increment(this.account, keys.accountKey, this.accountMax);
    this.increment(this.ip, keys.ipKey, this.ipMax);
    return this.decision(keys);
  }

  async clearAccount(accountKey: string) {
    this.account.delete(accountKey);
  }
}

const keys = { accountKey: "account-a-ip-a", ipKey: "ip-a" };

async function attempt(
  store: MemoryStore,
  valid: boolean,
  loginKeys = keys,
  onAuthenticate?: () => void,
) {
  return performRateLimitedLogin({
    keys: loginKeys,
    store,
    authenticate: async () => {
      onAuthenticate?.();
      return valid ? { ok: true as const, session: "session" } : { ok: false as const };
    },
  });
}

test("correct password succeeds on the first attempt", async () => {
  assert.equal((await attempt(new MemoryStore(), true)).status, "success");
});

test("one incorrect password records one failure", async () => {
  const store = new MemoryStore();
  assert.equal((await attempt(store, false)).status, "invalid");
  assert.equal(store.account.get(keys.accountKey)?.attempts, 1);
});

test("four incorrect passwords still permit another authentication attempt", async () => {
  const store = new MemoryStore();
  for (let count = 0; count < 4; count += 1)
    assert.equal((await attempt(store, false)).status, "invalid");
  let called = false;
  assert.equal((await attempt(store, true, keys, () => (called = true))).status, "success");
  assert.equal(called, true);
});

test("the fifth consecutive failure activates the temporary lockout", async () => {
  const store = new MemoryStore();
  for (let count = 0; count < 4; count += 1) await attempt(store, false);
  const result = await attempt(store, false);
  assert.equal(result.status, "rate_limited");
  assert.equal(result.status === "rate_limited" && result.retryAfterSeconds, 900);
});

test("authentication is not called during an active lockout", async () => {
  const store = new MemoryStore();
  for (let count = 0; count < 5; count += 1) await attempt(store, false);
  let called = false;
  assert.equal((await attempt(store, true, keys, () => (called = true))).status, "rate_limited");
  assert.equal(called, false);
});

test("authentication becomes available after the lockout expires", async () => {
  const store = new MemoryStore();
  for (let count = 0; count < 5; count += 1) await attempt(store, false);
  store.now += 901;
  assert.equal((await attempt(store, true)).status, "success");
});

test("a successful login clears the account and IP combination counter", async () => {
  const store = new MemoryStore();
  await attempt(store, false);
  await attempt(store, false);
  await attempt(store, true);
  assert.equal(store.account.has(keys.accountKey), false);
  assert.equal(store.ip.get(keys.ipKey)?.attempts, 2);
});

test("a different IP does not inherit an account and IP combination lockout", async () => {
  const store = new MemoryStore();
  for (let count = 0; count < 5; count += 1) await attempt(store, false);
  const otherIp = { accountKey: "account-a-ip-b", ipKey: "ip-b" };
  assert.equal((await attempt(store, true, otherIp)).status, "success");
});

test("the broader IP threshold blocks attacks cycling through accounts", async () => {
  const store = new MemoryStore();
  let result = await attempt(store, false, {
    accountKey: "account-0-shared-ip",
    ipKey: "shared-ip",
  });
  for (let count = 1; count < 25; count += 1) {
    result = await attempt(store, false, {
      accountKey: `account-${count}-shared-ip`,
      ipKey: "shared-ip",
    });
  }
  assert.equal(result.status, "rate_limited");
  assert.equal(store.ip.get("shared-ip")?.attempts, 25);
});

test("state is server-store based rather than browser-state based", async () => {
  const persistentStore = new MemoryStore();
  for (let count = 0; count < 5; count += 1) await attempt(persistentStore, false);
  // A new caller represents a refreshed/reopened browser and uses the same server store.
  assert.equal((await attempt(persistentStore, true)).status, "rate_limited");
});

test("the rate-limit store receives only opaque keys and never the password", async () => {
  const observed: string[] = [];
  const store = new MemoryStore();
  const wrapped: LoginRateLimitStore = {
    check: async (value) => {
      observed.push(JSON.stringify(value));
      return store.check(value);
    },
    recordFailure: async (value) => {
      observed.push(JSON.stringify(value));
      return store.recordFailure(value);
    },
    clearAccount: (value) => store.clearAccount(value),
  };
  const password = "not-stored-password";
  await performRateLimitedLogin({
    keys,
    store: wrapped,
    authenticate: async () => {
      void password;
      return { ok: false };
    },
  });
  assert.equal(observed.join(" ").includes(password), false);
});
