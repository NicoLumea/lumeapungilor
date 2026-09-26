export type RateLimitDecision = {
  blocked: boolean;
  retryAfterSeconds: number;
};

export type LoginKeys = { accountKey: string; ipKey: string };

export type LoginRateLimitStore = {
  check(keys: LoginKeys): Promise<RateLimitDecision>;
  recordFailure(keys: LoginKeys): Promise<RateLimitDecision>;
  clearAccount(accountKey: string): Promise<void>;
};

export type AuthenticationResult<T> = { ok: true; session: T } | { ok: false };

export type LoginAttemptResult<T> =
  | { status: "success"; session: T }
  | { status: "invalid" }
  | { status: "rate_limited"; retryAfterSeconds: number };

/**
 * Orchestrates a login without ever passing the password to the rate-limit
 * store. The authentication callback is deliberately skipped while blocked.
 */
export async function performRateLimitedLogin<T>({
  keys,
  store,
  authenticate,
}: {
  keys: LoginKeys;
  store: LoginRateLimitStore;
  authenticate: () => Promise<AuthenticationResult<T>>;
}): Promise<LoginAttemptResult<T>> {
  const existing = await store.check(keys);
  if (existing.blocked) {
    return { status: "rate_limited", retryAfterSeconds: existing.retryAfterSeconds };
  }

  const authentication = await authenticate();
  if (!authentication.ok) {
    const afterFailure = await store.recordFailure(keys);
    if (afterFailure.blocked) {
      return {
        status: "rate_limited",
        retryAfterSeconds: afterFailure.retryAfterSeconds,
      };
    }
    return { status: "invalid" };
  }

  await store.clearAccount(keys.accountKey);
  return { status: "success", session: authentication.session };
}
