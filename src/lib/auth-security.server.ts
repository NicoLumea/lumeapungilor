import { createClient, type Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  performRateLimitedLogin,
  type LoginKeys,
  type LoginRateLimitStore,
  type RateLimitDecision,
} from "./login-rate-limit-core";

type RateLimitConfig = {
  accountMax: number;
  ipMax: number;
  windowSeconds: number;
  lockoutSeconds: number;
  pepper: string;
};

type RpcDecision = { blocked?: unknown; retry_after_seconds?: unknown };

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid positive integer in ${name}`);
  }
  return value;
}

function config(): RateLimitConfig {
  const lockoutMinutes = positiveInteger("LOGIN_LOCKOUT_MINUTES", 15);
  const accountMax = positiveInteger("MAX_LOGIN_ATTEMPTS", 5);
  const ipMax = positiveInteger("MAX_IP_LOGIN_ATTEMPTS", 25);
  const pepper = process.env["LOGIN_RATE_LIMIT_PEPPER"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!pepper || pepper.length < 24) {
    throw new Error(
      "LOGIN_RATE_LIMIT_PEPPER (or SUPABASE_SERVICE_ROLE_KEY fallback) must be configured server-side.",
    );
  }
  if (ipMax < accountMax) {
    throw new Error("MAX_IP_LOGIN_ATTEMPTS must be at least MAX_LOGIN_ATTEMPTS.");
  }

  return {
    accountMax,
    ipMax,
    lockoutSeconds: lockoutMinutes * 60,
    windowSeconds: positiveInteger("LOGIN_ATTEMPT_WINDOW_MINUTES", lockoutMinutes) * 60,
    pepper,
  };
}

export function normalizeLoginIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

/**
 * Cloudflare overwrites CF-Connecting-IP at the Worker edge. We intentionally
 * do not fall back to X-Forwarded-For, which can contain client-supplied data.
 */
export function trustedClientIp(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp && cloudflareIp.length <= 64 && !cloudflareIp.includes(",")) {
    return cloudflareIp;
  }
  if (process.env["NODE_ENV"] !== "production") return "local-development";
  throw new Error("Trusted client IP is unavailable.");
}

async function hmac(value: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function keysFor(
  kind: "login" | "password_reset",
  identifier: string,
  ip: string,
  pepper: string,
): Promise<LoginKeys> {
  return {
    accountKey: await hmac(`${kind}:account_ip:${identifier}\u0000${ip}`, pepper),
    ipKey: await hmac(`${kind}:ip:${ip}`, pepper),
  };
}

function decision(value: unknown): RateLimitDecision {
  const payload = (value ?? {}) as RpcDecision;
  return {
    blocked: payload.blocked === true,
    retryAfterSeconds:
      typeof payload.retry_after_seconds === "number"
        ? Math.max(0, Math.ceil(payload.retry_after_seconds))
        : 0,
  };
}

function store(
  settings: RateLimitConfig,
  scopes: {
    account: "login_account_ip" | "password_reset_account_ip";
    ip: "login_ip" | "password_reset_ip";
  },
): LoginRateLimitStore {
  return {
    async check(keys) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.rpc("check_auth_rate_limits", {
        _keys: [keys.accountKey, keys.ipKey],
      });
      if (error) throw new Error("Authentication rate-limit check failed.");
      return decision(data);
    },
    async recordFailure(keys) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.rpc("record_auth_rate_limit_event", {
        _account_key: keys.accountKey,
        _ip_key: keys.ipKey,
        _account_scope: scopes.account,
        _ip_scope: scopes.ip,
        _account_max: settings.accountMax,
        _ip_max: settings.ipMax,
        _window_seconds: settings.windowSeconds,
        _lockout_seconds: settings.lockoutSeconds,
      });
      if (error) throw new Error("Authentication rate-limit update failed.");
      return decision(data);
    },
    async clearAccount(accountKey) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.rpc("clear_auth_rate_limit", {
        _account_key: accountKey,
      });
      if (error) throw new Error("Authentication rate-limit reset failed.");
    },
  };
}

function authClient(clientIp: string) {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const secretKey =
    process.env["SUPABASE_SECRET_KEY"] ??
    (serviceKey?.startsWith("sb_secret_") ? serviceKey : undefined);
  const key = secretKey ?? process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase authentication is not configured.");
  return createClient<Database>(url, key, {
    // Supabase accepts end-user IP forwarding only with a new sb_secret_ key
    // and only after the project setting is enabled. Legacy keys intentionally
    // omit this header rather than pretending it is trusted by the provider.
    ...(secretKey ? { global: { headers: { "Sb-Forwarded-For": clientIp } } } : {}),
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function loginWithProtection(request: Request, email: string, password: string) {
  const settings = config();
  const identifier = normalizeLoginIdentifier(email);
  const clientIp = trustedClientIp(request);
  const keys = await keysFor("login", identifier, clientIp, settings.pepper);
  const rateStore = store(settings, { account: "login_account_ip", ip: "login_ip" });

  return performRateLimitedLogin<Session>({
    keys,
    store: rateStore,
    authenticate: async () => {
      const { data, error } = await authClient(clientIp).auth.signInWithPassword({
        email: identifier,
        password,
      });
      if (error || !data.session) return { ok: false };
      return { ok: true, session: data.session };
    },
  });
}

export async function requestPasswordResetWithProtection(request: Request, email: string) {
  const settings = config();
  const identifier = normalizeLoginIdentifier(email);
  const clientIp = trustedClientIp(request);
  const keys = await keysFor("password_reset", identifier, clientIp, settings.pepper);
  const rateStore = store(settings, {
    account: "password_reset_account_ip",
    ip: "password_reset_ip",
  });

  const existing = await rateStore.check(keys);
  if (existing.blocked) return { status: "rate_limited" as const, ...existing };

  // Reset requests count whether or not the account exists, preventing both
  // enumeration and repeated delivery abuse.
  const afterAttempt = await rateStore.recordFailure(keys);
  if (afterAttempt.blocked) return { status: "rate_limited" as const, ...afterAttempt };

  const redirectTo = `${new URL(request.url).origin}/parola-noua`;
  await authClient(clientIp).auth.resetPasswordForEmail(identifier, { redirectTo });
  return { status: "accepted" as const };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
