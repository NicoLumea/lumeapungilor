import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { rolesForUser, sessionIdFromClaims } from "./authorization.server.ts";
import { requiresStaffEmailVerification } from "./authorization.ts";

const CHALLENGE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function positiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw new Error(`Invalid ${name}`);
  return parsed;
}

export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

export function sessionIdFromAccessToken(accessToken: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString(),
    );
    return sessionIdFromClaims(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

function otpClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Supabase email verification is not configured.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export type StaffChallengeResult =
  | { ok: true; required: false }
  | { ok: true; required: true; maskedEmail: string; expiresAt: string; resendAfter: string }
  | { ok: false; error: string };

export async function beginStaffChallenge(
  userId: string,
  sessionId: string,
  force = false,
): Promise<StaffChallengeResult> {
  const roles = await rolesForUser(userId);
  if (!requiresStaffEmailVerification(roles)) return { ok: true, required: false };

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = authUser.user?.email?.trim().toLowerCase();
  if (userError || !authUser.user || !email || !authUser.user.email_confirmed_at) {
    return { ok: false, error: "Contul personalului trebuie să aibă adresa de e-mail confirmată." };
  }

  const now = new Date();
  const { data: active } = await supabaseAdmin
    .from("staff_login_challenges")
    .select("id,expires_at,resend_available_at")
    .eq("user_id", userId)
    .eq("auth_session_id", sessionId)
    .is("used_at", null)
    .is("invalidated_at", null)
    .gt("expires_at", now.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (active && !force && new Date(active.resend_available_at).getTime() > now.getTime()) {
    return {
      ok: true,
      required: true,
      maskedEmail: maskEmail(email),
      expiresAt: active.expires_at,
      resendAfter: active.resend_available_at,
    };
  }
  if (active && force && new Date(active.resend_available_at).getTime() > now.getTime()) {
    return { ok: false, error: "Așteaptă înainte de a solicita un cod nou." };
  }

  const { checkRateLimit } = await import("./rate-limit.server");
  const limit = await checkRateLimit("staff_mfa_send", userId, 5, 3600);
  if (!limit.allowed) {
    return { ok: false, error: "Au fost solicitate prea multe coduri. Încearcă mai târziu." };
  }

  const { error: sendError } = await supabaseAdmin.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  });
  if (sendError) return { ok: false, error: "Codul nu a putut fi trimis momentan." };

  await supabaseAdmin
    .from("staff_login_challenges")
    .update({ invalidated_at: now.toISOString() })
    .eq("user_id", userId)
    .eq("auth_session_id", sessionId)
    .is("used_at", null)
    .is("invalidated_at", null);

  const expiresAt = new Date(now.getTime() + CHALLENGE_MINUTES * 60_000).toISOString();
  const resendAfter = new Date(
    now.getTime() + positiveInteger("STAFF_MFA_RESEND_SECONDS", 60) * 1000,
  ).toISOString();
  const { error: insertError } = await supabaseAdmin.from("staff_login_challenges").insert({
    user_id: userId,
    auth_session_id: sessionId,
    expires_at: expiresAt,
    resend_available_at: resendAfter,
  });
  if (insertError) return { ok: false, error: "Verificarea nu a putut fi inițiată." };

  return { ok: true, required: true, maskedEmail: maskEmail(email), expiresAt, resendAfter };
}

export async function staffVerificationStatus(userId: string, sessionId: string) {
  const roles = await rolesForUser(userId);
  if (!requiresStaffEmailVerification(roles)) return { required: false, verified: true as const };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const [{ data: verified }, { data: user }, { data: challenge }] = await Promise.all([
    supabaseAdmin
      .from("staff_verified_sessions")
      .select("expires_at")
      .eq("auth_session_id", sessionId)
      .eq("user_id", userId)
      .gt("expires_at", now)
      .maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin
      .from("staff_login_challenges")
      .select("expires_at,resend_available_at")
      .eq("user_id", userId)
      .eq("auth_session_id", sessionId)
      .is("used_at", null)
      .is("invalidated_at", null)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    required: true,
    verified: !!verified,
    verifiedUntil: verified?.expires_at ?? null,
    maskedEmail: user.user?.email ? maskEmail(user.user.email) : "***",
    challengeExpiresAt: challenge?.expires_at ?? null,
    resendAfter: challenge?.resend_available_at ?? null,
  };
}

export async function verifyStaffCode(userId: string, sessionId: string, code: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date();
  const { data: challenge } = await supabaseAdmin
    .from("staff_login_challenges")
    .select("id,attempts,expires_at")
    .eq("user_id", userId)
    .eq("auth_session_id", sessionId)
    .is("used_at", null)
    .is("invalidated_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!challenge || new Date(challenge.expires_at).getTime() <= now.getTime()) {
    return { ok: false as const, error: "Codul de verificare este invalid sau a expirat." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false as const, error: "Prea multe încercări. Solicită un cod nou mai târziu." };
  }

  const { data: attemptsTaken } = await supabaseAdmin.rpc("take_staff_mfa_attempt", {
    _challenge_id: challenge.id,
  });
  const attempts = Number(attemptsTaken ?? 0);
  if (attempts < 1) {
    return { ok: false as const, error: "Codul de verificare este invalid sau a expirat." };
  }
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = authUser.user?.email;
  if (!email)
    return { ok: false as const, error: "Codul de verificare este invalid sau a expirat." };

  const { data: verifiedOtp, error } = await otpClient().auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  if (error || verifiedOtp.user?.id !== userId) {
    if (attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin
        .from("staff_login_challenges")
        .update({ invalidated_at: now.toISOString() })
        .eq("id", challenge.id);
    }
    if (attempts >= 3) {
      const { audit } = await import("./rate-limit.server");
      await audit({
        actorId: userId,
        action: "staff_mfa.failed",
        entity: "auth.session",
        entityId: sessionId,
        details: { attempts },
      });
    }
    return { ok: false as const, error: "Codul de verificare este invalid sau a expirat." };
  }

  const verifiedSession = verifiedOtp.session;
  const verifiedSessionId = verifiedSession
    ? sessionIdFromAccessToken(verifiedSession.access_token)
    : null;
  if (!verifiedSession || !verifiedSessionId) {
    return { ok: false as const, error: "Sesiunea verificată nu a putut fi stabilită." };
  }

  const expiresAt = new Date(
    now.getTime() + positiveInteger("STAFF_MFA_SESSION_HOURS", 12) * 60 * 60 * 1000,
  ).toISOString();
  const { error: sessionWriteError } = await supabaseAdmin.from("staff_verified_sessions").upsert(
    {
      auth_session_id: verifiedSessionId,
      user_id: userId,
      verified_at: now.toISOString(),
      expires_at: expiresAt,
    },
    { onConflict: "auth_session_id" },
  );
  if (sessionWriteError) {
    return { ok: false as const, error: "Sesiunea verificată nu a putut fi salvată." };
  }
  await supabaseAdmin
    .from("staff_login_challenges")
    .update({ used_at: now.toISOString() })
    .eq("id", challenge.id);
  const { audit } = await import("./rate-limit.server");
  await audit({
    actorId: userId,
    actorEmail: email,
    action: "staff_mfa.verified",
    entity: "auth.session",
    entityId: verifiedSessionId,
    details: { expires_at: expiresAt, assurance: "application_email_check" },
  });
  return {
    ok: true as const,
    expiresAt,
    accessToken: verifiedSession.access_token,
    refreshToken: verifiedSession.refresh_token,
  };
}

export async function clearStaffSession(userId: string, sessionId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("staff_verified_sessions")
    .delete()
    .eq("auth_session_id", sessionId)
    .eq("user_id", userId);
}
